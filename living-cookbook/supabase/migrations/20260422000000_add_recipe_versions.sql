-- Migration: 20260422000000_add_recipe_versions
-- Purpose: Store automatic snapshots of every recipe edit so the full version
--          history is preserved. Snapshot is JSONB containing complete recipe
--          state (title, times, servings, images, source, ingredients[], steps[]).
--          This avoids normalised version_ingredients/version_steps tables while
--          keeping full fidelity. Versions are kept forever (no retention limit).
--
-- Design decision: auto-versioning on every save (no user action required).
-- Decision logged: 2026-04-21 (feature-epistemic-provenance.md).

CREATE TABLE IF NOT EXISTS recipe_versions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       BIGINT      NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    version_number  INTEGER     NOT NULL,   -- monotonically incrementing per recipe
    saved_at        TIMESTAMPTZ DEFAULT now(),
    change_note     TEXT,                   -- null for auto-saves; user-supplied for future manual checkpoints
    snapshot        JSONB       NOT NULL,   -- full recipe state at the moment of save
    created_by      UUID        REFERENCES auth.users(id)
);

-- Ensures version_number is unique per recipe and enables fast ordering
CREATE UNIQUE INDEX recipe_versions_recipe_version_uidx
    ON recipe_versions(recipe_id, version_number);

-- Fast look-up of all versions for a given recipe
CREATE INDEX recipe_versions_recipe_id_idx
    ON recipe_versions(recipe_id, saved_at DESC);

-- RLS: only the recipe owner can see or manage their version history
ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;

-- Owner-only SELECT (join through recipes to get user_id)
CREATE POLICY "rv_owner_select" ON recipe_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes r
            WHERE r.id = recipe_id
              AND r.user_id = auth.uid()
        )
    );

-- Only the creator can insert a version snapshot
CREATE POLICY "rv_owner_insert" ON recipe_versions
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Owner can delete their own version history entries
CREATE POLICY "rv_owner_delete" ON recipe_versions
    FOR DELETE USING (created_by = auth.uid());
