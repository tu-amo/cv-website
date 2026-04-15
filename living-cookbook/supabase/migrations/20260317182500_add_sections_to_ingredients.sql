-- Add row_type and display_name to support section headers and specific ingredient varieties
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS row_type TEXT DEFAULT 'ingredient';
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing rows: If ingredient_id is present, display_name can be null (it will fetch from ingredients table)
-- but for future flexibility, we can keep display_name as the override.
