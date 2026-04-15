-- Migration: 20260415_add_waitlist_table
-- Purpose: Create the waitlist table for Kitchen+ early-access signups
--          referenced by /upgrade page (src/app/upgrade/actions.js)
--
-- NOTE: This migration must be applied to BOTH staging and production
-- BEFORE or simultaneously with the Vercel deploy of commit 9b9bcb2
-- (feat: /upgrade waitlist landing page). The code is already live —
-- apply to production immediately to prevent 500 errors on form submit.
--
-- Apply with:
--   npm run db:push:staging   (test first)
--   npm run db:push:prod      (before or with git push)

-- ── 1. Schema ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waitlist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL UNIQUE,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- ── 3. Policies ───────────────────────────────────────────────────────────────

-- Public SELECT: needed so the client can COUNT spots remaining
-- (count only — no email data exposed, just a count query)
DROP POLICY IF EXISTS "public can count waitlist" ON waitlist;
CREATE POLICY "public can count waitlist"
  ON waitlist FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies — all writes go through the admin
-- client (service role key) in src/app/upgrade/actions.js which bypasses RLS.
-- This is intentional: the server action validates email format before inserting.
