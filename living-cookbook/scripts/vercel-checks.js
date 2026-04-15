#!/usr/bin/env node
/**
 * Post-deployment health checks for The Living Cookbook
 *
 * Run automatically by GitHub Actions after every successful Vercel
 * Production deployment (see .github/workflows/post-deploy-checks.yml).
 *
 * Can also be run manually:
 *   BASE_URL=https://living-cookbook.vercel.app node scripts/vercel-checks.js
 *
 * Required env vars:
 *   BASE_URL               — the deployed URL to test against
 *   KNOWN_PUBLIC_RECIPE_ID — UUID of a known public recipe (GitHub secret)
 */

const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '');
const PUBLIC_RECIPE_ID = process.env.KNOWN_PUBLIC_RECIPE_ID || '';

if (!BASE_URL) {
    console.error('❌ BASE_URL is required. Set BASE_URL=https://your-deployment.vercel.app');
    process.exit(1);
}

// ── Utilities ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function check(id, name, fn) {
    try {
        await fn();
        console.log(`  ✅ ${id} — ${name}`);
        results.push({ id, name, ok: true });
        passed++;
    } catch (err) {
        console.error(`  ❌ ${id} — ${name}`);
        console.error(`       ${err.message}`);
        results.push({ id, name, ok: false, error: err.message });
        failed++;
    }
}

// ── Checks ───────────────────────────────────────────────────────────────────

async function run() {
    console.log(`\n🔍  Post-deploy health checks`);
    console.log(`    Target: ${BASE_URL}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // Check 1 — Auth middleware is running
    //
    // Hitting a protected route without a session cookie should follow the
    // redirect chain and land on /login. This confirms:
    //   a) The middleware.js file is being picked up (not silently ignored)
    //   b) protect routes are not accidentally exposed
    //
    await check('CHK-001', 'Auth middleware redirects protected routes to /login', async () => {
        const res = await fetch(`${BASE_URL}/recipe/00000000-0000-0000-0000-000000000000`);
        // Follow redirects (default): the final URL should contain /login
        assert(
            res.url.includes('/login'),
            `Expected redirect to /login — got ${res.status} at ${res.url}`
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Check 2 — Public nutrition API is accessible and returns valid data
    //
    // Confirms:
    //   a) The /api/nutrition route is reachable without auth (middleware allowlist OK)
    //   b) Either the L2 cache (Supabase) or the USDA API is responding
    //   c) SUPABASE_SERVICE_ROLE_KEY and/or USDA_FDC_API_KEY are configured
    //
    await check('CHK-002', 'Nutrition API returns valid calorie data for "butter"', async () => {
        const res = await fetch(`${BASE_URL}/api/nutrition?ingredients=butter`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);

        const data = await res.json();

        // Response shape: { "butter": { found: true, per100g: { kcal: ... } } }
        assert(data.butter, 'No "butter" key in response — response shape may have changed');
        assert(data.butter.found === true, `butter.found is ${data.butter.found} — ingredient not matched`);
        assert(
            data.butter.per100g?.kcal > 0,
            `Expected kcal > 0 for butter, got: ${JSON.stringify(data.butter.per100g)}`
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Check 3 — Public recipe page renders ingredients
    //
    // Confirms:
    //   a) The /public/recipe/[id] route is publicly accessible
    //   b) Anonymous RLS policies are in place for all related tables
    //      (recipe_ingredients, instruction_steps, ingredients, sources)
    //   c) The page does not show an empty state / error for a known recipe
    //
    if (PUBLIC_RECIPE_ID) {
        await check('CHK-003', 'Public recipe page renders ingredients (anon RLS OK)', async () => {
            const res = await fetch(`${BASE_URL}/public/recipe/${PUBLIC_RECIPE_ID}`);
            assert(res.status === 200, `Expected 200, got ${res.status}`);

            const html = await res.text();
            assert(
                html.toLowerCase().includes('ingredient'),
                'Page HTML does not contain "ingredient" — recipe may be empty or page errored'
            );
            assert(
                !html.toLowerCase().includes('recipe not found'),
                'Page shows "recipe not found" — check the KNOWN_PUBLIC_RECIPE_ID secret'
            );
        });
    } else {
        console.log(`  ⚠️  CHK-003 skipped — KNOWN_PUBLIC_RECIPE_ID secret not set`);
        console.log(`           Set it in: GitHub → repo → Settings → Secrets → Actions`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Check 4 — Admin endpoint is not publicly accessible
    //
    // Confirms that the middleware route-protection layer is working for
    // admin API routes. An unauthenticated DELETE should either:
    //   - Be intercepted by middleware → redirect to /login (302/307)
    //   - Or be rejected by the route handler → 401 Unauthorized
    //
    // If this returns 200, either the middleware is broken or the endpoint
    // has no auth guard — both are critical failures.
    //
    await check('CHK-004', 'Admin cache-flush endpoint blocks unauthenticated requests', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/cache-flush`, { method: 'DELETE' });

        // Middleware redirects to /login → res.url contains '/login'
        // Route handler rejects cleanly → 401
        const isProtected = res.status === 401 || res.url.includes('/login');
        assert(
            isProtected,
            `Admin endpoint is NOT protected! Got status=${res.status} at url=${res.url}`
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Summary
    //
    const total = passed + (failed > 0 ? failed : 0) + (PUBLIC_RECIPE_ID ? 0 : 0);
    console.log('\n────────────────────────────────────────────');
    if (failed === 0) {
        console.log(`🎉  All ${passed} checks passed — deployment looks healthy.\n`);
    } else {
        console.log(`🚨  ${failed}/${passed + failed} checks failed.\n`);
        results.filter(r => !r.ok).forEach(r => {
            console.error(`    ${r.id}: ${r.error}`);
        });
        console.log('\n    Check the Vercel logs and /system page for diagnostics.\n');
        process.exit(1);
    }
}

run().catch(err => {
    console.error('\n💥  Unexpected error in check runner:', err);
    process.exit(1);
});
