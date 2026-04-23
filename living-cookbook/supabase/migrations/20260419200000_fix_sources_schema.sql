-- Migration: Align sources table with application schema
-- Date: 2026-04-19
-- Context: The sources table was created with legacy column names (name, url, page).
-- The application code uses the canonical names (book_title, link, publisher, page_number).
-- This migration adds the missing columns, migrates any existing legacy data,
-- and adds the FK constraint that PostgREST needs to resolve the
-- sources!source_id(*) join from the recipes table.

-- 1. Add canonical columns (IF NOT EXISTS is safe to run multiple times)
ALTER TABLE sources ADD COLUMN IF NOT EXISTS book_title TEXT;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS publisher  TEXT;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS link       TEXT;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS page_number TEXT;

-- 2. Migrate any legacy data from old column names → new names
UPDATE sources SET book_title   = name  WHERE book_title   IS NULL AND name IS NOT NULL;
UPDATE sources SET link         = url   WHERE link         IS NULL AND url  IS NOT NULL;
UPDATE sources SET page_number  = page  WHERE page_number  IS NULL AND page IS NOT NULL;

-- 3. Add FK from recipes.source_id → sources.id so PostgREST can discover
--    the join used in: .select("*, sources!source_id(*)")
--    Use ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS to guard against re-runs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'recipes_source_id_fkey'
      AND table_name = 'recipes'
  ) THEN
    ALTER TABLE recipes
      ADD CONSTRAINT recipes_source_id_fkey
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL;
  END IF;
END $$;
