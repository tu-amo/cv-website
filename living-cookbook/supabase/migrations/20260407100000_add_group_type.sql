-- ── F-001: Add group_type to groups table ────────────────────────────────────
-- Adds a group_type column that separates standard households from Pro Kitchens.
-- Pro Kitchens inherit all household features + unlock professional workflows.
--
-- Architecture: ADR-016 (proposed)
-- Requirements: F-001 (REQUIREMENTS.md §6a)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS group_type TEXT
    NOT NULL
    DEFAULT 'household'
    CHECK (group_type IN ('household', 'pro_kitchen'));

-- Backfill: all existing groups become households (no data migration needed —
-- DEFAULT 'household' handles new rows; this UPDATE handles existing ones)
UPDATE groups
  SET group_type = 'household'
  WHERE group_type IS NULL;

-- Index: used when filtering groups by type (e.g. "show only pro kitchens")
CREATE INDEX IF NOT EXISTS groups_group_type_idx ON groups (group_type);

-- No RLS changes needed — group_type is readable by existing GROUP member
-- SELECT policies. No write policy added — group_type set only at creation time
-- (the INSERT path). Future: an UPDATE policy could allow owner to upgrade type.
