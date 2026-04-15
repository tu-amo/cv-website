# ADR-010: Observability and Error Tracking Strategy

## Status
Accepted — Implementation Pending

## Date
2026-04-04

## Context

The Living Cookbook has nine accepted ADRs covering data access, caching, security, and rendering strategy. A recurring pattern across those ADRs is mitigations that depend on monitoring that has not yet been implemented:

| ADR | Promised mitigation | Currently implemented |
|---|---|---|
| 004 | "Log USDA misses to identify gaps in coverage" | ❌ No |
| 005 | "If abuse becomes a concern, add rate limiting" | ❌ No signal to trigger this |
| 006 | "Signed URL TTL is a dependency to monitor" | ❌ No monitoring |
| 007 | "Audit via `grep -rn supabaseAdmin`" | ✅ Manual — not automated |
| 008 | "Log USDA responses when returned item differs from search term" | ❌ No |

This means the current architecture has **no operational visibility**:
- A wrong USDA nutrition match is cached for 90 days with no alert
- USDA API quota exhaustion produces a user-facing error but no server-side alert
- A broken signed URL (expired TTL) in ISR-cached HTML produces broken images with no server-side signal
- A Supabase RLS policy regression silently returns empty result sets — indistinguishable from "user has no recipes"

**The specific silent failure chain of highest concern** (documented in LL-021):
```
Wrong USDA match → cached for 90 days → users see wrong calories
                                      → no error, no HTTP 500, no alert
                                      → no user feedback mechanism
```

**Options considered:**

| Option | Coverage | Cost | Complexity |
|---|---|---|---|
| A — No observability; rely on user reports | None | Free | Zero |
| B — `console.log` only | Developer-only, lost after function exit | Free | Minimal |
| C — Sentry for error tracking + Vercel Analytics for performance | Errors + Core Web Vitals | Free tier sufficient | Low |
| D — Full third-party stack (Datadog, PagerDuty, custom dashboards) | Comprehensive | High | High — over-engineered at this scale |
| E — Cache invalidation endpoint (`DELETE /api/nutrition/cache`) | Fix path for wrong cached values | Free | Low — a single API route |

## Decision

Implement a **three-layer observability strategy** using tools already available or trivially integratable with the Vercel + Next.js stack:

### Layer 1 — Error Tracking: Sentry

Install `@sentry/nextjs` with the Next.js wizard. This provides:
- Automatic capture of unhandled server-side exceptions in API routes and server components
- Automatic capture of unhandled client-side exceptions in browser code
- Source map upload for readable stack traces in production
- Free tier: 5,000 errors/month — sufficient for current scale

```bash
npx @sentry/wizard@latest -i nextjs
```

**What Sentry will catch automatically:**
- USDA API calls that throw (network errors, 5xx responses, 429 quota exhaustion)
- Supabase query failures (connection errors, malformed queries)
- ISR page regeneration failures
- Any unhandled exception in a server action or API route

### Layer 2 — Custom Structured Logging for Silent Failures

For failures that don't throw — wrong USDA matches, cache anomalies, quota warnings — implement structured logging in the API routes using `console.log` with JSON payloads. Vercel captures all `console.log` and `console.warn` output in the **Vercel Function Logs** tab — searchable and filterable by level, function, and time window. No additional infrastructure required.

```js
// src/lib/observability.js

/**
 * Log every USDA origin call (L1/L2 misses that reach USDA).
 * Uses result.confidence which is already computed in route.js:
 *   'high' — USDA item name starts with the search term
 *   'medium' — USDA item found but name doesn't start with search term
 *   'none'  — no USDA result found for this ingredient
 */
export function logNutritionLookup({ ingredient, result, source }) {
  console.log(JSON.stringify({
    level:      'info',
    event:      'nutrition_lookup',
    ingredient,
    usda_name:  result?.name ?? null,
    confidence: result?.confidence ?? 'none',  // 'high' | 'medium' | 'none'
    source,                                    // 'L1' | 'L2' | 'origin'
    timestamp:  new Date().toISOString(),
  }));
}

/**
 * Flag results that are implausibly high or low for cooking ingredients.
 * A result outside this range is a strong signal of a wrong USDA match.
 * Called after USDA origin call only — not for cache hits.
 */
export function logNutritionAnomaly({ ingredient, usdaResult, kcal }) {
  if (kcal > 900 || kcal < 5) {
    console.warn(JSON.stringify({
      level:         'warn',
      event:         'nutrition_anomaly',
      ingredient,
      usda_top_result: usdaResult?.description,
      kcal_100g:     kcal,
      flag:          'implausible_value',
      timestamp:     new Date().toISOString(),
    }));
  }
}
```

### Layer 3 — Nutrition Cache Invalidation Endpoint

To address the 90-day cache lock-in problem, implement a server-side cache invalidation endpoint:

```
DELETE /api/nutrition/cache?ingredient=butter
```

- Protected by a simple admin secret header (`x-admin-key: ${process.env.ADMIN_SECRET}`)
- Uses `supabaseAdmin` to delete the row from `nutrition_cache` (second legitimate use site per ADR-007)
- Clears the in-memory `Map` entry on the current function instance
- Documents its existence so that when a wrong cached value is discovered, the fix path is clear

This does not require a UI — a `curl` command is sufficient for now:
```bash
curl -X DELETE \
  "https://living-cookbook.vercel.app/api/nutrition/cache?ingredient=butter" \
  -H "x-admin-key: $ADMIN_SECRET"
```

### What Each Monitoring Gap Is Addressed By

| Gap identified | Resolution |
|---|---|
| Wrong USDA match cached for 90 days | `logNutritionAnomaly` flags implausible values; Layer 3 invalidation endpoint clears bad entries |
| USDA quota exhaustion | Sentry captures the 429 error automatically; `logNutritionLookup(source: 'origin')` tracks call frequency |
| ISR signed URL TTL | Documented as a manual check; Sentry catches client-side image load errors as a proxy signal |
| `supabaseAdmin` misuse | ESLint rule (see below) produces a warning at import time; code review checklist |
| RLS drift | Existing drift check SQL query — add to a scheduled Vercel cron job |

### ESLint Rule for `supabaseAdmin`

The project uses ESLint flat config (`eslint.config.mjs`). Add a new config block:

```js
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      'no-restricted-imports': ['warn', {
        paths: [{
          name: '@/lib/supabase/admin',
          message: 'supabaseAdmin bypasses RLS. Add a justification comment and reference ADR-007.',
        }],
      }],
    },
  },
]);

export default eslintConfig;
```

This produces a lint warning on every import that forces the developer to acknowledge the bypass before proceeding.

## Rationale

1. **Sentry + Vercel Logs is zero-infrastructure** — no additional services to deploy, manage, or pay for at current scale; both integrate natively with Next.js on Vercel
2. **Structured JSON logging is free and queryable** — Vercel's function log UI supports filtering by log level and content; structured JSON makes filtering reliable
3. **`result.confidence` already exists** — `route.js` line 178 already computes `'high'` or `'medium'` based on whether the USDA item name starts with the search term; `logNutritionLookup` uses this directly rather than recomputing it
4. **The invalidation endpoint converts a 90-day problem into a 5-minute fix** — the risk is not that wrong data gets cached, but that there is no fix path once it does
5. **ESLint warnings create friction at the right moment** — a warning at import time is harder to ignore than an ADR read days or weeks later

## Trade-offs Accepted

- **Sentry free tier is rate-limited** — 5,000 errors/month. Under abuse of the public `/api/nutrition` endpoint, this could be exhausted quickly if errors are thrown per bad request
- **Vercel function logs are ephemeral** — logs are not persisted beyond 7 days on the free tier and are not searchable historically. This is a monitoring tool, not an audit log.
- **No alerting by default** — Sentry will capture errors but not proactively alert unless a notification integration (email, Slack) is configured post-setup
- **The invalidation endpoint is curl-only** — there is no UI; the fix path requires developer access
- **`logNutritionLookup` logs every USDA origin call** — on a cold cache this generates one log line per unique ingredient per recipe view; log volume will grow with recipe library size but is negligible at current scale

## Implementation Checklist

- [ ] Run `npx @sentry/wizard@latest -i nextjs` and commit generated config files
- [ ] Add `SENTRY_DSN` to Vercel environment variables
- [ ] Configure Sentry alert: notify on error spike (>10 errors/hour)
- [ ] Create `src/lib/observability.js` with `logNutritionLookup` and `logNutritionAnomaly`
- [ ] Instrument `/api/nutrition/route.js` — call `logNutritionLookup` on origin hits, `logNutritionAnomaly` after kcal is extracted
- [ ] Implement `DELETE /api/nutrition/cache` endpoint with `x-admin-key` guard
- [ ] Add `ADMIN_SECRET` to Vercel environment variables (server-side only, never `NEXT_PUBLIC_`)
- [ ] Add ESLint `no-restricted-imports` rule block to `eslint.config.mjs`
- [ ] Add Supabase drift check SQL to a scheduled Vercel cron job
- [ ] Update ADR-007 use-site registry: note `DELETE /api/nutrition/cache` as second `supabaseAdmin` use

## Consequences

- **Positive**: The mitigations promised in ADR-004, ADR-005, ADR-006, ADR-007, and ADR-008 become real. Silent failures produce visible signals. Wrong cached nutrition data has a clear fix path.
- **Negative**: Sentry adds ~15KB to the client bundle. Structured logging adds minor overhead per API call. The invalidation endpoint adds a second `supabaseAdmin` use site (documented per ADR-007 governance rules).
- **Mitigation**: Configure Sentry's `tracesSampleRate` to `0.1` (10% of requests) to limit performance overhead and event volume on the free tier.

## Revisit Trigger

Reconsider when:
- Error volume consistently exceeds Sentry free tier (5,000/month) — upgrade to Team plan or migrate to self-hosted Glitchtip
- The team grows beyond 2 developers — add PagerDuty or Slack alerting for an on-call rotation
- Nutrition data quality issues become frequent — at that point build a proper admin UI with a searchable cache table rather than curl-based invalidation

## Related Decisions

- [ADR-004](ADR-004-nutrition-caching-usda.md) — Silent failure chain this ADR primarily addresses; `logNutritionLookup` and `logNutritionAnomaly` are the detection mechanisms
- [ADR-005](ADR-005-public-api-nutrition-route.md) — Public route with no abuse signal; Sentry provides the first visibility into quota exhaustion
- [ADR-006](ADR-006-ssr-isr-public-recipe-page.md) — Signed URL TTL dependency; Sentry client-side errors provide a proxy signal for expired cached URLs
- [ADR-007](ADR-007-named-service-role-client.md) — ESLint rule formalises the audit expectation; `DELETE /api/nutrition/cache` is the second documented `supabaseAdmin` use site
- [ADR-008](ADR-008-ingredient-query-boost-map.md) — `logNutritionAnomaly` is the automated detection mechanism for boost map gaps; LL-021 documents the specific failure pattern
