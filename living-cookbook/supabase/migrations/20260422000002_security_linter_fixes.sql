-- ============================================================
-- Migration: 20260422000002_security_linter_fixes
-- Purpose:   Resolve 5 warnings from the Supabase Security Linter.
--
--   1. function_search_path_mutable — public.increment_usage
--   2. function_search_path_mutable — public.create_profile_on_signup (orphan)
--   3. rls_policy_always_true       — public.adaptation_notes (anon INSERT)
--   4. rls_policy_always_true       — public.ingredients     (anon INSERT)
--   5. public_bucket_allows_listing — recipe-images (documented accepted risk)
--
-- Finding 6 (auth_leaked_password_protection) requires a dashboard toggle:
--   Supabase → Authentication → Sign In / Up → Password Strength
--   → enable "Check against known compromised passwords".
-- ============================================================


-- ── 1. Pin search_path on public.increment_usage ─────────────────────────────
--
-- Created in 20260414210000 without a pinned search_path.
-- A mutable search_path on a SECURITY DEFINER function lets an attacker
-- shadow system functions or tables via a schema they control.
-- Body is unchanged — only the SET search_path option is added.

CREATE OR REPLACE FUNCTION public.increment_usage(
    p_user_id  uuid,
    p_month    date,
    p_field    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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


-- ── 2. Drop the orphaned public.create_profile_on_signup function ─────────────
--
-- Migration 20260419090000 replaced this trigger function with
-- public.handle_new_user() which has search_path pinned.
-- The trigger on auth.users already points to handle_new_user().
-- The old function was never explicitly dropped, so the linter still
-- flags it. This DROP removes the orphaned function body only.

DROP FUNCTION IF EXISTS public.create_profile_on_signup();


-- ── 3. Fix: adaptation_notes — remove anon INSERT, add auth-only INSERT ───────
--
-- The Supabase dashboard created "Allow public insert access" with
-- WITH CHECK (true) for the anon role.  This lets unauthenticated visitors
-- insert adaptation notes for any recipe.
--
-- The table schema (id, recipe_id, content, created_at) has no user_id column,
-- so the INSERT policy can only gate on auth.uid() IS NOT NULL.
-- The SELECT policy already exists as "auth_read_adaptation_notes"
-- (auth.uid() IS NOT NULL) — no change needed there.

DROP POLICY IF EXISTS "Allow public insert access" ON public.adaptation_notes;

ALTER TABLE public.adaptation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_insert_adaptation_notes"
  ON public.adaptation_notes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ── 4. Fix: ingredients — remove anon INSERT policy ──────────────────────────
--
-- The Supabase dashboard created "Allow public insert access" with
-- WITH CHECK (true) for the anon role.
-- Migration 20260406200000 already added "auth_insert_ingredients"
-- (WITH CHECK (auth.uid() IS NOT NULL)), which is the correct policy.
-- This DROP removes only the redundant dashboard-created anon policy.
-- After this migration, only authenticated users can insert ingredients.

DROP POLICY IF EXISTS "Allow public insert access" ON public.ingredients;


-- ── 5. recipe-images bucket listing — accepted risk (documented) ──────────────
--
-- Finding: anon_read_recipe_images SELECT policy on storage.objects with
-- USING (bucket_id = 'recipe-images') permits file listing by anon clients.
--
-- Why it exists (see 20260404220000):
--   SecureImage.js calls storage.createSignedUrl() client-side for anon
--   users viewing public recipes. Supabase requires a SELECT policy on
--   storage.objects to allow this call.
--
-- Risk assessment:
--   • Image paths are timestamp-prefixed random filenames — not guessable.
--   • Listing exposes filenames only, not recipe content or user data.
--   • Linter severity: EXTERNAL/WARN (not CRITICAL).
--   Accepted risk — documented here.
--
-- Future mitigation: Convert recipe-images to a PUBLIC bucket.
--   Public objects are accessible by direct URL without signed URLs,
--   which would allow removal of the anon SELECT policy entirely.
--
-- No SQL change in this migration.
-- ─────────────────────────────────────────────────────────────────────────────
