-- ── PK6–PK9: Supplier Order Tracking ─────────────────────────────────────────
-- Date: 2026-04-07
--
-- Adds supplier order management for Pro Kitchen shopping lists.
-- One supplier_order = a batch of items ordered from one supplier on one date.
-- shopping_list items link to a supplier_order via supplier_order_id.

-- ── supplier_orders table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_orders (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id         UUID        REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    supplier_name    TEXT        NOT NULL,
    order_date       DATE,
    ordered_at       TIMESTAMPTZ,
    ordered_by       UUID        REFERENCES auth.users(id),
    notes            TEXT,
    source_plan_id   UUID,       -- FK to production_plans.id (uuid)
    created_at       TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select_supplier_orders" ON supplier_orders
    FOR SELECT TO authenticated
    USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "group_members_insert_supplier_orders" ON supplier_orders
    FOR INSERT TO authenticated
    WITH CHECK (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "group_members_update_supplier_orders" ON supplier_orders
    FOR UPDATE TO authenticated
    USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

-- ── Extend shopping_list ──────────────────────────────────────────────────────
ALTER TABLE shopping_list
    ADD COLUMN IF NOT EXISTS supplier_order_id  UUID REFERENCES supplier_orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS source             TEXT DEFAULT 'manual';
