-- Migration: Refine visibility and add audit metadata
-- Date: 2026-03-30 14:00:00

-- 1. Add columns
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS updated_by UUID;

-- 2. Explicitly add constraint so relationship is discoverable
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_updated_by_fkey;
ALTER TABLE recipes ADD CONSTRAINT recipes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id);

-- 2. Backfill existing updated_by with user_id
UPDATE recipes SET updated_by = user_id WHERE updated_by IS NULL;

-- 3. Update RLS Policies for Recipes
-- First, drop the existing restrictive select policy if it exists
-- DROP POLICY IF EXISTS "Users can see personal and group recipes" ON recipes;

CREATE POLICY "Anyone can see public recipes" ON recipes
  FOR SELECT USING (is_public = true);

-- Add policy for anonymous users if not already implicitly allowed by the above
-- (Note: Public anonymous access requires 'is_public = true')
