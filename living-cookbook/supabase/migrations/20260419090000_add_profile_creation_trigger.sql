-- Migration: 20260419090000_add_profile_creation_trigger
-- Purpose: Replace the application-level supabaseAdmin profile upsert with a
--          PostgreSQL trigger. This eliminates the service role key from the
--          signup flow and closes the window where a profile row might not be
--          created if the application-level upsert fails.
--
-- The trigger fires AFTER INSERT ON auth.users and reads display_name from
-- raw_user_meta_data (set via options.data in supabase.auth.signUp()).
--
-- SECURITY DEFINER: the function runs with the privileges of its creator
-- (postgres/supabase_admin), scoped only to this single INSERT.
-- search_path is pinned to 'public' to prevent schema-injection attacks.
--
-- ADR reference: ADR-007 (service role used at signup — now replaced)

-- ── 1. Create the trigger function ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name'
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name
    WHERE profiles.display_name IS NULL;
  RETURN NEW;
END;
$$;

-- ── 2. Attach the trigger to auth.users ────────────────────────────────────

-- Drop first in case an older version of this trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
