-- ── PK1/PK2: production_plans table ─────────────────────────────────────────
-- Stores production run plans for Pro Kitchen groups.
-- Each plan links a recipe to a group, capturing planned servings, date,
-- and an optional team member assignment (display-only label, not a FK).
--
-- Requirements: PK1, PK2 (REQUIREMENTS.md §6b)
-- Architecture: group_type = 'pro_kitchen' groups only (enforced in UI by isPro gate)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_plans (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id        bigint      REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
    group_id         uuid        REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    planned_servings integer     NOT NULL CHECK (planned_servings > 0),
    planned_date     date,
    assigned_to      text,           -- display name label only; not a FK (PK2 design decision)
    notes            text,
    status           text        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
    created_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS production_plans_group_idx
    ON production_plans (group_id, status);

CREATE INDEX IF NOT EXISTS production_plans_recipe_idx
    ON production_plans (recipe_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;

-- Group members can view their kitchen's plans
CREATE POLICY "group_members_select_production_plans"
    ON production_plans FOR SELECT
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Group members can create plans for their kitchen
CREATE POLICY "group_members_insert_production_plans"
    ON production_plans FOR INSERT
    TO authenticated
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Group members can update plans in their kitchen (e.g. change status, add notes)
CREATE POLICY "group_members_update_production_plans"
    ON production_plans FOR UPDATE
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );
