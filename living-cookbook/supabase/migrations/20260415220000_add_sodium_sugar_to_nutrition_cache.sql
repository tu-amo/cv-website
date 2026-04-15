-- Migration: 20260415220000_add_sodium_sugar_to_nutrition_cache.sql
--
-- Adds sodium_100g and sugar_100g columns to the nutrition_cache table.
-- These are populated from USDA FoodData Central "Sodium" and "Sugars, total" nutrients.
-- L0 (local ground truth) entries always have these values.
-- L2 (USDA cached) entries will have these values for any new inserts after this migration.
-- Existing L2 rows will have NULL until the cache expires and is re-fetched from USDA.
--
-- Safe to apply to production before the code deploy — columns are nullable with no defaults.

ALTER TABLE nutrition_cache
    ADD COLUMN IF NOT EXISTS sodium_100g NUMERIC,   -- mg per 100g
    ADD COLUMN IF NOT EXISTS sugar_100g  NUMERIC;   -- g per 100g (total sugars)

COMMENT ON COLUMN nutrition_cache.sodium_100g IS 'Sodium content in mg per 100g. Source: USDA nutrient "Sodium" or L0 ground truth.';
COMMENT ON COLUMN nutrition_cache.sugar_100g  IS 'Total sugars in g per 100g. Source: USDA nutrient "Sugars, total" or L0 ground truth.';
