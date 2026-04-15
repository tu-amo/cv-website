-- ============================================================
-- Migration: 20260414210000 — add_usage_tracking_and_tier
-- Adds tier-based subscription support and AI usage tracking.
-- ============================================================

-- ── 1. Add tier column to profiles ──────────────────────────
-- Defaults to 'free' for all existing users.
-- Updated by Stripe webhook when user subscribes (Sprint 9).

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'kitchen_plus', 'chef', 'pro_kitchen'));

-- ── 2. Create usage_tracking table ──────────────────────────
-- Tracks AI feature usage per user per calendar month.
-- PK is (user_id, month) — one row per user per month.
-- month is always the first day of the month (e.g. 2026-04-01).

CREATE TABLE IF NOT EXISTS usage_tracking (
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month       date        NOT NULL,
    briefs_used int         NOT NULL DEFAULT 0,
    scans_used  int         NOT NULL DEFAULT 0,
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, month)
);

-- ── 3. RLS ───────────────────────────────────────────────────
-- Users can only read their own usage row.
-- Writes are handled server-side via supabaseAdmin (no user write policy needed).

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
    ON usage_tracking
    FOR SELECT
    USING (auth.uid() = user_id);

-- ── 4. Index ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month
    ON usage_tracking (user_id, month);

-- ── 5. Atomic increment RPC ──────────────────────────────────
-- Called by usageGate.js via supabaseAdmin.rpc('increment_usage', {...})
-- Uses INSERT ... ON CONFLICT DO UPDATE to avoid race conditions.
-- p_field must be 'briefs_used' or 'scans_used'.

CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id  uuid,
    p_month    date,
    p_field    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO usage_tracking (user_id, month, briefs_used, scans_used, updated_at)
    VALUES (
        p_user_id,
        p_month,
        CASE WHEN p_field = 'briefs_used' THEN 1 ELSE 0 END,
        CASE WHEN p_field = 'scans_used'  THEN 1 ELSE 0 END,
        now()
    )
    ON CONFLICT (user_id, month) DO UPDATE SET
        briefs_used = usage_tracking.briefs_used + CASE WHEN p_field = 'briefs_used' THEN 1 ELSE 0 END,
        scans_used  = usage_tracking.scans_used  + CASE WHEN p_field = 'scans_used'  THEN 1 ELSE 0 END,
        updated_at  = now();
END;
$$;
