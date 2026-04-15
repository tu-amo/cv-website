/**
 * usageGate.js — Server-side usage enforcement for AI features.
 *
 * Call checkUsage(feature) inside any API route that consumes AI credits
 * BEFORE making the external API call.
 *
 * Flow:
 *  1. Verify the request is authenticated (reads session from cookies)
 *  2. Read the user's tier from profiles table
 *  3. Compare current-month usage against the tier limit
 *  4. If allowed  → atomically increment the counter, return { allowed: true }
 *  5. If blocked  → return { allowed: false, code: 'LIMIT_REACHED', ... }
 *  6. If unauthed → return { allowed: false, code: 'NOT_AUTHENTICATED' }
 *
 * Usage in an API route:
 *  const gate = await checkUsage('briefs')
 *  if (!gate.allowed) return gateResponse(gate)
 *  // ... proceed with AI call
 */

import { createClient }                   from '@/lib/supabase/server';
import { supabaseAdmin }                  from '@/lib/supabase/admin';
import { getTierLimits, isUnlimited }     from '@/lib/tiers';

// ── Error codes (returned to client so UI can show the right prompt) ──────────
export const GATE_ERRORS = {
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
    LIMIT_REACHED:     'LIMIT_REACHED',
};

/**
 * Check whether the authenticated user may use a given AI feature this month.
 *
 * @param {'briefs' | 'scans'} feature
 * @returns {Promise<{
 *   allowed:   boolean,
 *   code?:     string,   // GATE_ERRORS value — present when allowed = false
 *   userId?:   string,
 *   tier?:     string,
 *   used?:     number | null,   // null = unlimited tier
 *   limit?:    number | null,   // null = unlimited tier
 *   feature?:  string,
 * }>}
 */
export async function checkUsage(feature) {
    // ── 1. Auth check ─────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { allowed: false, code: GATE_ERRORS.NOT_AUTHENTICATED };
    }

    // ── 2. Get the user's tier from profiles ──────────────────────────────────
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle();

    const tier     = profile?.tier ?? 'free';
    const limits   = getTierLimits(tier);
    const field    = `${feature}_used`;        // 'briefs_used' | 'scans_used'
    const limitKey = `${feature}_per_month`;   // 'briefs_per_month' | 'scans_per_month'

    // ── 3. Unlimited tier — always allow, still track for analytics ───────────
    if (isUnlimited(tier, limitKey)) {
        await _increment(user.id, field);
        return { allowed: true, userId: user.id, tier, used: null, limit: null };
    }

    // ── 4. Check current month usage ──────────────────────────────────────────
    const monthKey = _monthKey();
    const { data: row } = await supabaseAdmin
        .from('usage_tracking')
        .select(field)
        .eq('user_id', user.id)
        .eq('month', monthKey)
        .maybeSingle();

    const used  = row?.[field] ?? 0;
    const limit = limits[limitKey];

    if (used >= limit) {
        return {
            allowed: false,
            code:    GATE_ERRORS.LIMIT_REACHED,
            userId:  user.id,
            tier,
            used,
            limit,
            feature,
        };
    }

    // ── 5. Atomically increment via Postgres RPC (avoids race conditions) ─────
    await _increment(user.id, field);

    return { allowed: true, userId: user.id, tier, used: used + 1, limit };
}

/**
 * Convenience: convert a gate result into a standard NextResponse.
 * Import and use in API routes so all error shapes are consistent.
 *
 * @param {object} gate  — result from checkUsage()
 * @returns {Response}
 */
export function gateResponse(gate) {
    if (gate.code === GATE_ERRORS.NOT_AUTHENTICATED) {
        return new Response(
            JSON.stringify({ error: 'Authentication required.', code: gate.code }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // LIMIT_REACHED
    const tierLabel = {
        free:         'Home Cook',
        kitchen_plus: 'Kitchen+',
        chef:         'Chef',
        pro_kitchen:  'Pro Kitchen',
    }[gate.tier] ?? gate.tier;

    const upgradeMessage = gate.tier === 'free'
        ? `Upgrade to Kitchen+ to unlock AI ${gate.feature === 'briefs' ? 'styling briefs' : 'recipe scanning'}.`
        : `You've used all ${gate.limit} ${gate.feature === 'briefs' ? 'AI briefs' : 'recipe scans'} on your ${tierLabel} plan this month.`;

    return new Response(
        JSON.stringify({
            error:   upgradeMessage,
            code:    gate.code,
            used:    gate.used,
            limit:   gate.limit,
            tier:    gate.tier,
            feature: gate.feature,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
}

// ── Private helpers ───────────────────────────────────────────────────────────

/** Returns the first-of-month date string for the current month: 'YYYY-MM-01' */
function _monthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Atomically upserts the usage row and increments the given field.
 * Uses a Postgres RPC to avoid SELECT + UPDATE race conditions under load.
 */
async function _increment(userId, field) {
    const { error } = await supabaseAdmin.rpc('increment_usage', {
        p_user_id: userId,
        p_month:   _monthKey(),
        p_field:   field,
    });
    if (error) {
        // Non-fatal — log but don't block the request
        console.warn('[usageGate] increment_usage RPC failed:', error.message);
    }
}
