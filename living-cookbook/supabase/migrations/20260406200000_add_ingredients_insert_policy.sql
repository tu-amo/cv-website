-- Migration: allow authenticated users to insert new ingredients into the catalog
-- Root cause: recipe save silently dropped any ingredient whose name didn't exist
-- in the ingredients table (SELECT found nothing, INSERT was blocked by RLS,
-- the if (ingredientId) gate skipped the recipe_ingredients row entirely).
--
-- Fix Part 1: code fallback (display_name saved even without ingredient_id)
-- Fix Part 2: this policy — allow authenticated users to build the catalog

CREATE POLICY "auth_insert_ingredients"
  ON ingredients
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Note: UPDATE is intentionally not added — ingredient name canonicalisation
-- should be a deliberate admin action, not a side-effect of a user's recipe edit.
-- If a user wants to rename an ingredient globally, that is a future admin flow.
