-- ============================================================
-- Migration: 20260422000003_performance_advisor_fixes
-- Purpose: Resolve all Supabase Performance Advisor findings:
--
-- A. unindexed_foreign_keys (INFO × 22)
--    Add covering indexes on all foreign key columns.
--
-- B. unused_index (INFO × 1)
--    Drop nutrition_cache_fetched_at_idx — never queried by index.
--
-- C. auth_rls_initplan (WARN × 40+)
--    Replace bare  auth.uid()       with  (SELECT auth.uid())
--    Replace bare  auth.role()      with  (SELECT auth.role())
--    The bare form re-evaluates on every row; the SELECT form is
--    evaluated once per statement, which is dramatically faster at
--    any non-trivial row count.
--
-- D. multiple_permissive_policies (WARN × many)
--    Collapse redundant permissive policies into a single canonical
--    policy per table × role × action. Postgres evaluates ALL
--    permissive policies for a query even if the first one matches.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- A. FK INDEXES — 22 missing covering indexes
-- ════════════════════════════════════════════════════════════

-- adaptation_notes
CREATE INDEX IF NOT EXISTS idx_adaptation_notes_recipe_id
    ON public.adaptation_notes (recipe_id);

-- group_members
CREATE INDEX IF NOT EXISTS idx_group_members_user_id
    ON public.group_members (user_id);

-- groups
CREATE INDEX IF NOT EXISTS idx_groups_owner_id
    ON public.groups (owner_id);

-- nutrition_flags (prod-only table)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'nutrition_flags') THEN
    CREATE INDEX IF NOT EXISTS idx_nutrition_flags_recipe_id
        ON public.nutrition_flags (recipe_id);
    CREATE INDEX IF NOT EXISTS idx_nutrition_flags_flagged_by
        ON public.nutrition_flags (flagged_by);
  END IF;
END $$;


-- production_plans (prod-only table)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'production_plans') THEN
    CREATE INDEX IF NOT EXISTS idx_production_plans_recipe_id
        ON public.production_plans (recipe_id);
    CREATE INDEX IF NOT EXISTS idx_production_plans_group_id
        ON public.production_plans (group_id);
    CREATE INDEX IF NOT EXISTS idx_production_plans_created_by
        ON public.production_plans (created_by);
  END IF;
END $$;


-- recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id
    ON public.recipe_ingredients (recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id
    ON public.recipe_ingredients (ingredient_id);

-- recipe_notes
CREATE INDEX IF NOT EXISTS idx_recipe_notes_recipe_id
    ON public.recipe_notes (recipe_id);

-- recipes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id
    ON public.recipes (user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_group_id
    ON public.recipes (group_id);
CREATE INDEX IF NOT EXISTS idx_recipes_source_id
    ON public.recipes (source_id);
CREATE INDEX IF NOT EXISTS idx_recipes_updated_by
    ON public.recipes (updated_by);

-- shopping_list
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id
    ON public.shopping_list (user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_recipe_id
    ON public.shopping_list (recipe_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_group_id
    ON public.shopping_list (group_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_supplier_order_id
    ON public.shopping_list (supplier_order_id);

-- supplier_orders (prod-only table)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'supplier_orders') THEN
    CREATE INDEX IF NOT EXISTS idx_supplier_orders_group_id
        ON public.supplier_orders (group_id);
    CREATE INDEX IF NOT EXISTS idx_supplier_orders_ordered_by
        ON public.supplier_orders (ordered_by);
  END IF;
END $$;


-- waitlist (created in prod dashboard only — guard for staging)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'waitlist') THEN
        CREATE INDEX IF NOT EXISTS idx_waitlist_user_id
            ON public.waitlist (user_id);
    END IF;
END $$;



-- ════════════════════════════════════════════════════════════
-- B. DROP UNUSED INDEX
-- ════════════════════════════════════════════════════════════

-- nutrition_cache_fetched_at_idx was added speculatively for cache
-- expiry queries but has never been used in practice. Removing it
-- saves write overhead on every cache upsert.
DROP INDEX IF EXISTS public.nutrition_cache_fetched_at_idx;


-- ════════════════════════════════════════════════════════════
-- C & D. RLS POLICY REWRITES
--
-- Approach per table:
--   1. DROP all existing policies for the affected table
--   2. Recreate with (SELECT auth.uid()) and as a single policy
--      per role × action wherever multiple existed.
--
-- Ordering: child tables first (no FK dependencies in policies),
--   then parent tables.
-- ════════════════════════════════════════════════════════════


-- ── ingredients ──────────────────────────────────────────────
-- Was: auth_read_ingredients (auth only) + anon_read_ingredients (true)
--      + "Allow public read access" (dashboard, true)
--      + auth_insert_ingredients (auth only)
-- Now: single SELECT (true) — ingredient names are non-sensitive
--      reference data, same rationale as anon_read_ingredients;
--      single INSERT requiring auth.

DROP POLICY IF EXISTS "auth_read_ingredients"        ON public.ingredients;
DROP POLICY IF EXISTS "anon_read_ingredients"        ON public.ingredients;
DROP POLICY IF EXISTS "Allow public read access"     ON public.ingredients;
DROP POLICY IF EXISTS "auth_insert_ingredients"      ON public.ingredients;

CREATE POLICY "ingredients_read"
    ON public.ingredients FOR SELECT
    USING (true);

CREATE POLICY "ingredients_insert"
    ON public.ingredients FOR INSERT
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);


-- ── adaptation_notes ─────────────────────────────────────────
-- Was: auth_read_adaptation_notes (auth.uid() IS NOT NULL)
--      + auth_insert_adaptation_notes (auth.uid() IS NOT NULL)
--        [the latter created in migration 20260422000002]
-- Now: same logic, rewritten with (SELECT auth.uid()).

DROP POLICY IF EXISTS "auth_read_adaptation_notes"   ON public.adaptation_notes;
DROP POLICY IF EXISTS "auth_insert_adaptation_notes" ON public.adaptation_notes;

CREATE POLICY "adaptation_notes_read"
    ON public.adaptation_notes FOR SELECT
    USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "adaptation_notes_insert"
    ON public.adaptation_notes FOR INSERT
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);


-- ── recipe_ingredients ────────────────────────────────────────
-- Was: ri_read (auth only) + ri_read_public (public recipe subquery)
--      + ri_insert/ri_update/ri_delete (auth only each)
-- Now: merged SELECT covers both cases; CRUD policies rewritten.

DROP POLICY IF EXISTS "ri_read"        ON public.recipe_ingredients;
DROP POLICY IF EXISTS "ri_read_public" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "ri_insert"      ON public.recipe_ingredients;
DROP POLICY IF EXISTS "ri_update"      ON public.recipe_ingredients;
DROP POLICY IF EXISTS "ri_delete"      ON public.recipe_ingredients;

CREATE POLICY "ri_read"
    ON public.recipe_ingredients FOR SELECT
    USING (
        (SELECT auth.uid()) IS NOT NULL
        OR recipe_id IN (SELECT id FROM public.recipes WHERE is_public = true)
    );

CREATE POLICY "ri_insert"
    ON public.recipe_ingredients FOR INSERT
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "ri_update"
    ON public.recipe_ingredients FOR UPDATE
    USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "ri_delete"
    ON public.recipe_ingredients FOR DELETE
    USING ((SELECT auth.uid()) IS NOT NULL);


-- ── instruction_steps ─────────────────────────────────────────
-- Was: is_read (auth only) + is_read_public (public recipe subquery)
-- Now: merged SELECT; CRUD rewritten.

DROP POLICY IF EXISTS "is_read"        ON public.instruction_steps;
DROP POLICY IF EXISTS "is_read_public" ON public.instruction_steps;
DROP POLICY IF EXISTS "is_insert"      ON public.instruction_steps;
DROP POLICY IF EXISTS "is_update"      ON public.instruction_steps;
DROP POLICY IF EXISTS "is_delete"      ON public.instruction_steps;

CREATE POLICY "is_read"
    ON public.instruction_steps FOR SELECT
    USING (
        (SELECT auth.uid()) IS NOT NULL
        OR recipe_id IN (SELECT id FROM public.recipes WHERE is_public = true)
    );

CREATE POLICY "is_insert"
    ON public.instruction_steps FOR INSERT
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "is_update"
    ON public.instruction_steps FOR UPDATE
    USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "is_delete"
    ON public.instruction_steps FOR DELETE
    USING ((SELECT auth.uid()) IS NOT NULL);


-- ── recipe_notes ──────────────────────────────────────────────
-- Was: rn_read (auth only) + rn_read_public (public recipe subquery)
-- Now: merged SELECT; CRUD rewritten.

DROP POLICY IF EXISTS "rn_read"        ON public.recipe_notes;
DROP POLICY IF EXISTS "rn_read_public" ON public.recipe_notes;
DROP POLICY IF EXISTS "rn_insert"      ON public.recipe_notes;
DROP POLICY IF EXISTS "rn_update"      ON public.recipe_notes;
DROP POLICY IF EXISTS "rn_delete"      ON public.recipe_notes;

CREATE POLICY "rn_read"
    ON public.recipe_notes FOR SELECT
    USING (
        (SELECT auth.uid()) IS NOT NULL
        OR recipe_id IN (SELECT id FROM public.recipes WHERE is_public = true)
    );

CREATE POLICY "rn_insert"
    ON public.recipe_notes FOR INSERT
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "rn_update"
    ON public.recipe_notes FOR UPDATE
    USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "rn_delete"
    ON public.recipe_notes FOR DELETE
    USING ((SELECT auth.uid()) IS NOT NULL);


-- ── sources ───────────────────────────────────────────────────
-- Was: src_read (auth only) + src_read_public (public recipe subquery)
-- Now: merged SELECT; CRUD rewritten.
-- Note: sources.id is UUID; recipes.source_id FK points here.

DROP POLICY IF EXISTS "src_read"        ON public.sources;
DROP POLICY IF EXISTS "src_read_public" ON public.sources;
DROP POLICY IF EXISTS "src_insert"      ON public.sources;
DROP POLICY IF EXISTS "src_update"      ON public.sources;
DROP POLICY IF EXISTS "src_delete"      ON public.sources;

CREATE POLICY "src_read"
    ON public.sources FOR SELECT
    USING (
        (SELECT auth.uid()) IS NOT NULL
        OR id IN (
            SELECT source_id FROM public.recipes
            WHERE is_public = true AND source_id IS NOT NULL
        )
    );

CREATE POLICY "src_insert"
    ON public.sources FOR INSERT
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "src_update"
    ON public.sources FOR UPDATE
    USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "src_delete"
    ON public.sources FOR DELETE
    USING ((SELECT auth.uid()) IS NOT NULL);


-- ── recipes ───────────────────────────────────────────────────
-- Was: recipes_select (own | group | public)
--    + "Anyone can see public recipes" (is_public = true) — REDUNDANT
--    + recipes_write (FOR ALL with user_id = auth.uid()) — covers SELECT too
--      causing 3-policy SELECT evaluation per query
-- Now: Drop "Anyone can see public recipes" (covered by recipes_select).
--      Replace recipes_write FOR ALL → explicit INSERT/UPDATE/DELETE policies.
--      Rewrite recipes_select with (SELECT auth.uid()).

DROP POLICY IF EXISTS "Anyone can see public recipes" ON public.recipes;
DROP POLICY IF EXISTS "recipes_select"                ON public.recipes;
DROP POLICY IF EXISTS "recipes_write"                 ON public.recipes;

CREATE POLICY "recipes_select"
    ON public.recipes FOR SELECT
    USING (
        (SELECT auth.uid()) = user_id
        OR group_id IN (SELECT get_my_group_ids())
        OR is_public = true
    );

CREATE POLICY "recipes_insert"
    ON public.recipes FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "recipes_update"
    ON public.recipes FOR UPDATE
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "recipes_delete"
    ON public.recipes FOR DELETE
    USING ((SELECT auth.uid()) = user_id);


-- ── profiles ──────────────────────────────────────────────────
-- Was: profiles_read (auth.uid() IS NOT NULL)
--    + profiles_insert (id = auth.uid())
--    + profiles_update (id = auth.uid())
-- Now: same logic, rewritten with (SELECT auth.uid()).

DROP POLICY IF EXISTS "profiles_read"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_read"
    ON public.profiles FOR SELECT
    USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "profiles_insert"
    ON public.profiles FOR INSERT
    WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update"
    ON public.profiles FOR UPDATE
    USING (id = (SELECT auth.uid()));


-- ── groups ────────────────────────────────────────────────────
-- Was: groups_select/insert/update all using bare auth.uid()
-- Now: rewritten with (SELECT auth.uid()).

DROP POLICY IF EXISTS "groups_select" ON public.groups;
DROP POLICY IF EXISTS "groups_insert" ON public.groups;
DROP POLICY IF EXISTS "groups_update" ON public.groups;

CREATE POLICY "groups_select"
    ON public.groups FOR SELECT
    USING (
        owner_id = (SELECT auth.uid())
        OR id IN (SELECT get_my_group_ids())
    );

CREATE POLICY "groups_insert"
    ON public.groups FOR INSERT
    WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "groups_update"
    ON public.groups FOR UPDATE
    USING (owner_id = (SELECT auth.uid()));


-- ── group_members ─────────────────────────────────────────────
-- Was: gm_select_own (user_id = auth.uid())
--    + gm_select_teammates (group_id IN get_my_group_ids())  ← 2 SELECT policies
--    + gm_insert (user_id = auth.uid())
--    + gm_delete_own (user_id = auth.uid())
--    + gm_delete_as_owner (group_id in groups owned by user)  ← 2 DELETE policies
-- Now: merged into single SELECT and single DELETE.

DROP POLICY IF EXISTS "gm_select_own"       ON public.group_members;
DROP POLICY IF EXISTS "gm_select_teammates" ON public.group_members;
DROP POLICY IF EXISTS "gm_insert"           ON public.group_members;
DROP POLICY IF EXISTS "gm_delete_own"       ON public.group_members;
DROP POLICY IF EXISTS "gm_delete_as_owner"  ON public.group_members;

CREATE POLICY "gm_select"
    ON public.group_members FOR SELECT
    USING (
        (SELECT auth.uid()) = user_id
        OR group_id IN (SELECT get_my_group_ids())
    );

CREATE POLICY "gm_insert"
    ON public.group_members FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "gm_delete"
    ON public.group_members FOR DELETE
    USING (
        (SELECT auth.uid()) = user_id
        OR group_id IN (
            SELECT id FROM public.groups WHERE owner_id = (SELECT auth.uid())
        )
    );


-- ── shopping_list ─────────────────────────────────────────────
-- Was: all policies used bare auth.uid()
-- Now: rewritten with (SELECT auth.uid()).

DROP POLICY IF EXISTS "shopping_select" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_insert" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_update" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_delete" ON public.shopping_list;

CREATE POLICY "shopping_select"
    ON public.shopping_list FOR SELECT
    USING (
        (SELECT auth.uid()) = user_id
        OR group_id IN (SELECT get_my_group_ids())
    );

CREATE POLICY "shopping_insert"
    ON public.shopping_list FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "shopping_update"
    ON public.shopping_list FOR UPDATE
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "shopping_delete"
    ON public.shopping_list FOR DELETE
    USING ((SELECT auth.uid()) = user_id);


-- ── nutrition_flags ───────────────────────────────────────────
-- Was: "Authenticated users can flag nutrition matches" / "Users can view..."
--      / "Users can update..." — all using bare auth.uid()
-- Now: canonical names, (SELECT auth.uid()).
-- Table may not exist on staging — guard with DO block.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'nutrition_flags') THEN
    DROP POLICY IF EXISTS "Authenticated users can flag nutrition matches" ON public.nutrition_flags;
    DROP POLICY IF EXISTS "Users can view their own flags"                 ON public.nutrition_flags;
    DROP POLICY IF EXISTS "Users can update their own flags"               ON public.nutrition_flags;
    CREATE POLICY "nutrition_flags_insert"
        ON public.nutrition_flags FOR INSERT TO authenticated
        WITH CHECK (flagged_by = (SELECT auth.uid()));
    CREATE POLICY "nutrition_flags_select"
        ON public.nutrition_flags FOR SELECT TO authenticated
        USING (flagged_by = (SELECT auth.uid()));
    CREATE POLICY "nutrition_flags_update"
        ON public.nutrition_flags FOR UPDATE TO authenticated
        USING (flagged_by = (SELECT auth.uid()));
  END IF;
END $$;


-- ── usage_tracking ────────────────────────────────────────────
-- Was: "Users can read own usage" with bare auth.uid()
-- Now: rewritten with (SELECT auth.uid()).
-- Table may not exist on staging — guard with DO block.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'usage_tracking') THEN
    DROP POLICY IF EXISTS "Users can read own usage" ON public.usage_tracking;
    CREATE POLICY "usage_tracking_select"
        ON public.usage_tracking FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;


-- ── supplier_orders ───────────────────────────────────────────
-- Was: group_members_{select,insert,update}_supplier_orders
--      using auth.uid() inline in subquery
-- Now: rewritten with (SELECT auth.uid()).
-- Table may not exist on staging — guard with DO block.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'supplier_orders') THEN
    DROP POLICY IF EXISTS "group_members_select_supplier_orders" ON public.supplier_orders;
    DROP POLICY IF EXISTS "group_members_insert_supplier_orders" ON public.supplier_orders;
    DROP POLICY IF EXISTS "group_members_update_supplier_orders" ON public.supplier_orders;
    CREATE POLICY "supplier_orders_select"
        ON public.supplier_orders FOR SELECT TO authenticated
        USING (group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = (SELECT auth.uid())
        ));
    CREATE POLICY "supplier_orders_insert"
        ON public.supplier_orders FOR INSERT TO authenticated
        WITH CHECK (group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = (SELECT auth.uid())
        ));
    CREATE POLICY "supplier_orders_update"
        ON public.supplier_orders FOR UPDATE TO authenticated
        USING (group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = (SELECT auth.uid())
        ));
  END IF;
END $$;


-- ── production_plans ──────────────────────────────────────────
-- Was: group_members_{select,insert,update}_plans using bare auth.uid()
-- Now: rewritten with (SELECT auth.uid()).
-- Table may not exist on staging — guard with DO block.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'production_plans') THEN
    DROP POLICY IF EXISTS "group_members_select_plans" ON public.production_plans;
    DROP POLICY IF EXISTS "group_members_insert_plans" ON public.production_plans;
    DROP POLICY IF EXISTS "group_members_update_plans" ON public.production_plans;
    CREATE POLICY "production_plans_select"
        ON public.production_plans FOR SELECT TO authenticated
        USING (group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = (SELECT auth.uid())
        ));
    CREATE POLICY "production_plans_insert"
        ON public.production_plans FOR INSERT TO authenticated
        WITH CHECK (group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = (SELECT auth.uid())
        ));
    CREATE POLICY "production_plans_update"
        ON public.production_plans FOR UPDATE TO authenticated
        USING (group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = (SELECT auth.uid())
        ));
  END IF;
END $$;
