-- ── nutrition_flags ───────────────────────────────────────────────────────────
-- Tracks bad USDA matches flagged directly from the NutritionPanel breakdown.
-- Used for periodic maintenance: review flagged rows → add to QUERY_BOOSTS
-- or flush the nutrition_cache entry.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nutrition_flags (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_name  text        NOT NULL,           -- what was searched (e.g. "chinese spice")
    usda_name        text,                           -- what USDA returned (e.g. "Broccoli, chinese, cooked")
    usda_fdc_id      integer,                        -- USDA FDC ID for reference
    kcal_100g        numeric,                        -- the suspicious kcal/100g value
    confidence       text,                           -- 'high' | 'medium' | 'low'
    recipe_id        bigint      REFERENCES recipes(id) ON DELETE SET NULL,
    flagged_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    flagged_at       timestamptz NOT NULL DEFAULT now(),
    status           text        NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('open', 'resolved', 'wont_fix')),
    resolution_note  text                            -- e.g. "Added to QUERY_BOOSTS: chinese spice → five spice powder"
);

-- Index for maintenance queries (list all open flags, oldest first)
CREATE INDEX IF NOT EXISTS nutrition_flags_status_idx
    ON nutrition_flags (status, flagged_at);

-- Index for checking whether an ingredient is already flagged (avoid duplicate flags)
CREATE INDEX IF NOT EXISTS nutrition_flags_ingredient_idx
    ON nutrition_flags (ingredient_name);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE nutrition_flags ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can flag a match
CREATE POLICY "Authenticated users can flag nutrition matches"
    ON nutrition_flags FOR INSERT
    TO authenticated
    WITH CHECK (flagged_by = auth.uid());

-- Users can see their own flags; also allows admin review via service role
CREATE POLICY "Users can view their own flags"
    ON nutrition_flags FOR SELECT
    TO authenticated
    USING (flagged_by = auth.uid());

-- Users can update their own flags (e.g. add a note, mark resolved)
CREATE POLICY "Users can update their own flags"
    ON nutrition_flags FOR UPDATE
    TO authenticated
    USING (flagged_by = auth.uid());
