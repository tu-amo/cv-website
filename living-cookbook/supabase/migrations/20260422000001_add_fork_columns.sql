-- Migration: 20260422000001_add_fork_columns
-- Purpose: Add attribution tracking to the recipes table and a SECURITY DEFINER
--          RPC function that handles recipe forking atomically.
--
-- A "fork" creates a full copy of a public recipe owned by the calling user.
-- The forked_from_recipe_id column creates a traversable attribution chain:
--   My version → Jane's adaptation → Original cookbook source
--
-- fork_recipe() copies: recipe row + recipe_ingredients + instruction_steps.
-- The original source_id is carried forward (epistemic provenance preserved).
-- The new recipe is private by default; the user decides whether to share it.

-- ── 1. Fork attribution columns on recipes ────────────────────────────────

ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS forked_from_recipe_id BIGINT
        REFERENCES recipes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS forked_at TIMESTAMPTZ;

-- Index for fast "how many times has this recipe been forked?" queries
CREATE INDEX IF NOT EXISTS recipes_forked_from_idx
    ON recipes(forked_from_recipe_id)
    WHERE forked_from_recipe_id IS NOT NULL;

-- ── 2. fork_recipe() SECURITY DEFINER function ───────────────────────────
--
-- Called from the client as: supabase.rpc('fork_recipe', { p_recipe_id: X })
-- The function uses auth.uid() internally — the callerʼs identity is determined
-- by the JWT session, not any argument, so it cannot be spoofed.
--
-- SECURITY DEFINER: runs with the privileges of its creator (postgres/supabase_admin),
-- scoped only to the specific INSERT operations within this function.
-- search_path is pinned to 'public' to prevent schema-injection attacks.

CREATE OR REPLACE FUNCTION public.fork_recipe(p_recipe_id BIGINT)
RETURNS BIGINT  -- returns the new recipe's id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id  UUID   := auth.uid();
    v_source     recipes%ROWTYPE;
    v_new_id     BIGINT;
BEGIN
    -- Caller must be authenticated
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated: must be signed in to fork a recipe';
    END IF;

    -- Load source recipe — must be public OR owned by the caller
    SELECT * INTO v_source FROM public.recipes
    WHERE id = p_recipe_id
      AND (is_public = true OR user_id = v_caller_id)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recipe not found or not public (id=%)', p_recipe_id;
    END IF;

    -- Prevent forking your own recipe via this path
    -- (owners use the normal edit flow; forking yourself is a no-op)
    IF v_source.user_id = v_caller_id THEN
        RAISE EXCEPTION 'Cannot fork your own recipe — use Edit instead';
    END IF;

    -- ── Insert the forked recipe ─────────────────────────────────────────
    INSERT INTO public.recipes (
        title,
        description,
        servings,
        prep_time_minutes,
        cook_time_minutes,
        difficulty,
        tags,
        images,
        image,
        is_public,          -- private by default; user decides later
        ai_images_used,
        source_id,          -- carry original source forward (epistemic provenance)
        page_number,
        user_id,            -- new owner = caller
        group_id,           -- no group assigned by default
        updated_by,
        forked_from_recipe_id,
        forked_at
    )
    VALUES (
        v_source.title,
        v_source.description,
        v_source.servings,
        v_source.prep_time_minutes,
        v_source.cook_time_minutes,
        v_source.difficulty,
        v_source.tags,
        v_source.images,
        v_source.image,
        false,
        v_source.ai_images_used,
        v_source.source_id,
        v_source.page_number,
        v_caller_id,
        NULL,
        v_caller_id,
        p_recipe_id,
        now()
    )
    RETURNING id INTO v_new_id;

    -- ── Copy ingredients ─────────────────────────────────────────────────
    INSERT INTO public.recipe_ingredients (
        recipe_id, ingredient_id, display_name,
        quantity, unit, preparation, section, sort_order
    )
    SELECT
        v_new_id, ingredient_id, display_name,
        quantity, unit, preparation, section, sort_order
    FROM public.recipe_ingredients
    WHERE recipe_id = p_recipe_id;

    -- ── Copy instruction steps ───────────────────────────────────────────
    INSERT INTO public.instruction_steps (
        recipe_id, step_number, instruction_text, duration_minutes
    )
    SELECT
        v_new_id, step_number, instruction_text, duration_minutes
    FROM public.instruction_steps
    WHERE recipe_id = p_recipe_id;

    RETURN v_new_id;
END;
$$;

-- Revoke public access; grant only to authenticated users
REVOKE EXECUTE ON FUNCTION public.fork_recipe(BIGINT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fork_recipe(BIGINT) TO authenticated;
