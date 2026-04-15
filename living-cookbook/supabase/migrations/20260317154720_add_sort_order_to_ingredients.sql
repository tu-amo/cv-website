-- Add sort_order column to recipe_ingredients to persist ordering
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS sort_order integer;

-- Update existing rows to have a default sort_order based on their creation time within each recipe
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY recipe_id ORDER BY created_at) as pos
  FROM recipe_ingredients
)
UPDATE recipe_ingredients
SET sort_order = ordered.pos
FROM ordered
WHERE recipe_ingredients.id = ordered.id;
