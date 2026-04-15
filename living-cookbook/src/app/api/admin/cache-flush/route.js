import { NextResponse } from 'next/server';
// ADR-007: supabaseAdmin used here deliberately — nutrition_cache is a shared, non-user-scoped table.
// It has no RLS SELECT/DELETE policy for individual users; only the service role can manage it.
// This route is additionally protected by a Bearer token check + middleware (double-gated).
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cache-flush
 *
 * Flushes the nutrition_cache table. Useful when cache poisoning is suspected
 * (see BUG-001, LL-021 — USDA wrong-match cached for 90 days).
 *
 * Auth: Bearer token in Authorization header must match SUPABASE_SERVICE_ROLE_KEY.
 * The middleware also guards this route — it is doubly protected.
 *
 * Usage:
 *   curl -X DELETE https://living-cookbook.vercel.app/api/admin/cache-flush \
 *     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
 *
 * Returns:
 *   200 { flushed, timestamp }  — success
 *   401 { error }               — missing or incorrect bearer token
 *   500 { error }               — database error
 */

function isAuthorized(request) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Both must be non-empty and match
    return !!token && !!expected && token === expected;
}

export async function DELETE(request) {
    // Defense-in-depth: route-level auth check even though middleware also guards this path
    if (!isAuthorized(request)) {
        return NextResponse.json(
            { error: 'Unauthorized — valid Authorization: Bearer <token> required' },
            { status: 401 }
        );
    }

    try {
        // Delete all rows from the nutrition cache
        const { count, error } = await supabaseAdmin
            .from('nutrition_cache')
            .delete({ count: 'exact' })
            .neq('ingredient_name', ''); // Supabase requires a filter for delete-all

        if (error) throw error;

        console.log(`[admin/cache-flush] Flushed ${count} rows from nutrition_cache`);

        return NextResponse.json({
            flushed: count ?? 0,
            timestamp: new Date().toISOString(),
            message: `Flushed ${count} cached nutrition entries. Fresh USDA lookups will be made on next request.`,
        });

    } catch (err) {
        console.error('[admin/cache-flush] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// All other HTTP methods are explicitly rejected
export async function GET()    { return NextResponse.json({ error: 'Method not allowed — use DELETE' }, { status: 405 }); }
export async function POST()   { return NextResponse.json({ error: 'Method not allowed — use DELETE' }, { status: 405 }); }
export async function PUT()    { return NextResponse.json({ error: 'Method not allowed — use DELETE' }, { status: 405 }); }
export async function PATCH()  { return NextResponse.json({ error: 'Method not allowed — use DELETE' }, { status: 405 }); }
