import 'server-only'; // Build-time guard: throws if imported in a Client Component (ADR-007)
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin (Service Role) Client — lazy singleton
 *
 * Server-only. Never import this in client components or expose to the browser.
 * Bypasses RLS — use only in API routes and server actions where you need
 * to read/write regardless of user session (e.g. shared caches, admin ops).
 *
 * The client is created on-demand (first property access), NOT at module
 * evaluation time. This prevents the Vercel build from crashing when
 * SUPABASE_SERVICE_ROLE_KEY is a runtime secret not available in the
 * build environment. See ADR-007, ADR-010.
 */
let _client = null;

function getInstance() {
    if (!_client) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            throw new Error(
                '[supabase/admin] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
                'Add SUPABASE_SERVICE_ROLE_KEY to Vercel → Settings → Environment Variables.'
            );
        }
        _client = createClient(url, key);
    }
    return _client;
}

// Proxy forwards every property access (.from, .rpc, .storage, .auth, etc.)
// to the real client. All existing call sites are unchanged.
export const supabaseAdmin = new Proxy({}, {
    get(_target, prop) {
        return getInstance()[prop];
    },
});
