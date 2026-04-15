-- Fix schema mismatch: code uses 'preparation' but prod had 'preparation_note'
-- This column was causing all ingredient saves to silently fail in production (LL-043)
ALTER TABLE recipe_ingredients
    ADD COLUMN IF NOT EXISTS preparation TEXT;
