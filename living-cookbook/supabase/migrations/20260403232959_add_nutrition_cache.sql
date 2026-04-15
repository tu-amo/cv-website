-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add nutrition_cache table
-- Purpose:   Persistent L2 cache for USDA FoodData Central ingredient lookups.
--            Survives Vercel cold starts. Shared across all users/instances.
--            Keyed by cleaned ingredient name (e.g. "butter", "plain flour").
--            90-day TTL — row older than 90 days triggers a USDA re-fetch.
-- Date:      2026-04-03
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. SCHEMA
CREATE TABLE IF NOT EXISTS nutrition_cache (
    ingredient_name  TEXT        PRIMARY KEY,   -- cleaned name (e.g. "butter")
    usda_fdc_id      INTEGER,                   -- USDA FoodData Central ID
    usda_name        TEXT,                      -- USDA matched description
    usda_datatype    TEXT,                      -- "SR Legacy" | "Foundation"
    kcal_100g        NUMERIC(8,2),
    protein_100g     NUMERIC(8,2),
    fat_100g         NUMERIC(8,2),
    carbs_100g       NUMERIC(8,2),
    fiber_100g       NUMERIC(8,2),
    confidence       TEXT,                      -- "high" | "medium"
    fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for TTL queries (WHERE fetched_at > NOW() - INTERVAL '90 days')
CREATE INDEX IF NOT EXISTS nutrition_cache_fetched_at_idx
    ON nutrition_cache (fetched_at);

-- 2. RLS
ALTER TABLE nutrition_cache ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- Nutrition data is non-sensitive (USDA public data).
-- Anyone — logged in or not — can read it. The public recipe page needs it.
-- Writes only happen from the server-side API route using the service role key,
-- which bypasses RLS entirely, so no INSERT policy is needed.

DROP POLICY IF EXISTS "nutrition_cache_public_read" ON nutrition_cache;
CREATE POLICY "nutrition_cache_public_read" ON nutrition_cache
    FOR SELECT
    USING (true);   -- fully public read — this data is non-sensitive USDA data
