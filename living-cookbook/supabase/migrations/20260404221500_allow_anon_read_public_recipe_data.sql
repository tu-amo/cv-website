-- ============================================================
-- Migration: Allow anonymous reads for public recipe related data
-- Date: 2026-04-04
-- Reason: The public recipe page (/public/recipe/[id]) queries
--   recipe_ingredients, instruction_steps, recipe_notes, ingredients,
--   and sources for any recipe where is_public = true.
--   All five tables currently require auth.uid() IS NOT NULL, which
--   blocks anonymous users and results in empty Ingredients / Method
--   sections on the public recipe page even when the recipe is public.
-- ============================================================

-- recipe_ingredients: allow anon reads for public recipes
CREATE POLICY "ri_read_public" ON recipe_ingredients
  FOR SELECT USING (
    recipe_id IN (SELECT id FROM recipes WHERE is_public = true)
  );

-- instruction_steps: allow anon reads for public recipes
CREATE POLICY "is_read_public" ON instruction_steps
  FOR SELECT USING (
    recipe_id IN (SELECT id FROM recipes WHERE is_public = true)
  );

-- recipe_notes: allow anon reads for public recipes
CREATE POLICY "rn_read_public" ON recipe_notes
  FOR SELECT USING (
    recipe_id IN (SELECT id FROM recipes WHERE is_public = true)
  );

-- ingredients: ingredient names are non-sensitive reference data.
-- Allow full anon read — required for the ingredients(name) join in
-- recipe_ingredients queries on the public recipe page.
CREATE POLICY "anon_read_ingredients" ON ingredients
  FOR SELECT USING (true);

-- sources: allow anon reads for sources linked to public recipes
CREATE POLICY "src_read_public" ON sources
  FOR SELECT USING (
    id IN (
      SELECT source_id FROM recipes
      WHERE is_public = true AND source_id IS NOT NULL
    )
  );
