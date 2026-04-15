-- ── Living Cookbook: Recipe Seed Template ────────────────────────────────────
--
-- PURPOSE: Add test recipes directly via the Supabase SQL editor.
-- ENVIRONMENT: Staging only (hbgxotjjpapdqlqrofqz)
-- LAST VERIFIED: 2026-04-07
--
-- KEY SCHEMA FACTS (verified against live DB — do not trust schema_snapshot types):
--   recipes.id              BIGINT (GENERATED ALWAYS AS IDENTITY)
--   recipes.user_id         UUID   (FK → auth.users.id)
--   recipe_ingredients.recipe_id     BIGINT (nullable)
--   recipe_ingredients.ingredient_id BIGINT (nullable) ← leave NULL, use display_name
--   instruction_steps.recipe_id      BIGINT (nullable)
--   instruction_steps.instruction_text TEXT   ← NOT "instruction"
--
-- PATTERN: Skip the ingredients catalog (ingredient_id = NULL).
--   recipe_ingredients.ingredient_id is nullable — the app resolves display_name at runtime.
--   This avoids type-mismatch errors and constraint issues during seeding.
--
-- HOW TO FIND YOUR STAGING USER ID:
--   SELECT id, email FROM auth.users ORDER BY created_at;
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- Replace with your staging user ID
  v_uid uuid := 'd03274cc-fd2e-4415-84fe-8abe8ddb2d6a';

  -- Recipe ID variables — bigint to match recipes.id
  r1 bigint;
  -- r2 bigint;  -- uncomment for additional recipes
BEGIN

-- ── Recipe 1 ──────────────────────────────────────────────────────────────
INSERT INTO recipes (title, servings, prep_time_minutes, cook_time_minutes, user_id, is_public)
VALUES ('My Recipe Title', 4, 15, 30, v_uid, false)
RETURNING id INTO r1;

-- Ingredients: skip ingredient_id (leave NULL), rely on display_name
INSERT INTO recipe_ingredients (recipe_id, quantity, unit, sort_order, display_name) VALUES
(r1, 200, 'g',    1, 'Ingredient One'),
(r1, 2,   'tbsp', 2, 'Ingredient Two'),
(r1, 1,   'tsp',  3, 'Ingredient Three'),
(r1, 3,   null,   4, 'Ingredient Four (no unit)');

-- Steps: use instruction_text (NOT "instruction")
INSERT INTO instruction_steps (recipe_id, step_number, instruction_text) VALUES
(r1, 1, 'First step description.'),
(r1, 2, 'Second step description.'),
(r1, 3, 'Third step description.');

-- ── Add more recipes by copying the block above ────────────────────────────

END $$;

-- ── Verify ────────────────────────────────────────────────────────────────────
-- Run this separately after the DO block to confirm data was committed:
-- SELECT id, title, user_id, created_at FROM recipes ORDER BY created_at DESC LIMIT 5;
