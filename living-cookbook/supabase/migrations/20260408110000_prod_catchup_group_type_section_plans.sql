-- ── Production catch-up: Pro Kitchen schema gaps ────────────────────────────
-- Date: 2026-04-08
--
-- These columns/tables were present in dev (staging) but were never applied
-- to production from the original F-001 and PK1-PK2 implementation.
-- Applied manually to production (hiuhjnodzodcgwltweoc) on 2026-04-08.
--
-- Verified: group_type=1, section_col=1, production_plans=1

-- 1. group_type on groups (F-001)
ALTER TABLE groups
    ADD COLUMN IF NOT EXISTS group_type TEXT NOT NULL DEFAULT 'household'
    CHECK (group_type = ANY (ARRAY['household'::text, 'pro_kitchen'::text]));

-- 2. section column on recipe_ingredients (used by stock check page PK3-PK5)
ALTER TABLE recipe_ingredients
    ADD COLUMN IF NOT EXISTS section TEXT;

-- 3. production_plans table (PK1/PK2)
CREATE TABLE IF NOT EXISTS production_plans (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id         UUID        NOT NULL REFERENCES public.groups(id),
    recipe_id        BIGINT      NOT NULL REFERENCES public.recipes(id),
    planned_servings INTEGER     NOT NULL CHECK (planned_servings > 0),
    planned_date     DATE,
    assigned_to      TEXT,
    notes            TEXT,
    status           TEXT        NOT NULL DEFAULT 'draft'
                     CHECK (status = ANY (ARRAY['draft','confirmed','completed','cancelled'])),
    created_by       UUID        REFERENCES auth.users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select_plans" ON production_plans
    FOR SELECT TO authenticated
    USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "group_members_insert_plans" ON production_plans
    FOR INSERT TO authenticated
    WITH CHECK (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "group_members_update_plans" ON production_plans
    FOR UPDATE TO authenticated
    USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
