-- ============================================================
-- Migration: 20260422000004_index_advisor_sort_indexes
-- Purpose: Add the two sort-order indexes recommended by the
--          Supabase Index Advisor (top query stats report).
--
-- Both are ORDER BY indexes on hot query paths — every recipe
-- listing and every recipe ingredient fetch hits these columns.
--
-- 1. public.recipes (created_at)
--    All recipe listing queries order by created_at DESC.
--    Planner cost: 62.62 → 27.75 after index (~56% reduction).
--    Accounts for ~50% of total measured query time.
--
-- 2. public.recipe_ingredients (sort_order)
--    All ingredient fetch queries order by sort_order ASC.
--    Planner cost: 43.92 → 8.97 after index (~80% reduction).
--    Accounts for ~15% of total measured query time.
--
-- Note: group_members(user_id) and recipe_notes(recipe_id) were
-- already added in migration 20260422000003.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_recipes_created_at
    ON public.recipes (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_sort_order
    ON public.recipe_ingredients (sort_order ASC);
