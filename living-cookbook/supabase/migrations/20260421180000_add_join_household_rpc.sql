-- Migration: 20260421180000_add_join_household_rpc
-- Purpose: Replace supabaseAdmin service-role usage in the household join flow
--          with a secure SECURITY DEFINER RPC function.
--
-- Previously, /join/[code]/page.js used supabaseAdmin (service role) for three ops:
--   1. SELECT groups WHERE invite_code = ?  — user not yet a member, RLS would block
--   2. SELECT group_members to check for existing membership
--   3. INSERT group_members
-- This is server-side only, so the key is never exposed, but service role bypass
-- of RLS is a code smell and makes the intent unclear.
--
-- Fix: A SECURITY DEFINER function that:
--   • Uses auth.uid() for the caller identity (cannot be spoofed)
--   • Looks up the group by invite code (elevated read, scoped to this function)
--   • Checks + inserts membership atomically
--   • Returns a result row describing the outcome
--
-- search_path is pinned to 'public' to prevent schema-injection attacks.
-- ADR reference: Tech Debt item (ROADMAP.md) — "Replace RLS bypass in household join flow"

CREATE OR REPLACE FUNCTION public.join_household_by_invite_code(p_invite_code TEXT)
RETURNS TABLE(
    success     BOOLEAN,
    outcome     TEXT,     -- 'joined' | 'already_member' | 'invalid_code'
    group_id    UUID,
    group_name  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id  UUID := auth.uid();
    v_group      RECORD;
    v_existing   UUID;
BEGIN
    -- Caller must be authenticated
    IF v_caller_id IS NULL THEN
        RETURN QUERY SELECT false, 'unauthenticated', NULL::UUID, NULL::TEXT;
        RETURN;
    END IF;

    -- 1. Look up the group by invite code (elevated read — user may not be a member yet)
    SELECT id, name INTO v_group
    FROM public.groups
    WHERE invite_code = p_invite_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'invalid_code', NULL::UUID, NULL::TEXT;
        RETURN;
    END IF;

    -- 2. Check if already a member
    SELECT gm.id INTO v_existing
    FROM public.group_members gm
    WHERE gm.group_id = v_group.id
      AND gm.user_id  = v_caller_id
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RETURN QUERY SELECT true, 'already_member', v_group.id, v_group.name;
        RETURN;
    END IF;

    -- 3. Insert the membership (atomic with the lookup above)
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group.id, v_caller_id, 'member');

    RETURN QUERY SELECT true, 'joined', v_group.id, v_group.name;
END;
$$;

-- Grant EXECUTE to authenticated users only
REVOKE EXECUTE ON FUNCTION public.join_household_by_invite_code(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.join_household_by_invite_code(TEXT) TO authenticated;
