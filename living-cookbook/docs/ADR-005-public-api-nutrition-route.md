# ADR-005: Public API Route Exemption from Auth Middleware

## Status
Accepted

## Date
2026-04-03

## Context

The Living Cookbook uses Supabase auth middleware (`src/lib/supabase/middleware.js`) that intercepts every incoming request and redirects to `/login` if no valid session exists. This is the correct default — all application routes require authentication.

The middleware maintains an explicit `isPublicRoute` allowlist:
- `/public/*` — public recipe pages
- `/login/*` — auth screens
- `/join/*` — invite link handler
- `/_next/*` — Next.js internals
- `/auth/callback` — email confirmation handler

The `/api/nutrition` route was built as part of the nutrition caching feature (ADR-004). It proxies USDA FoodData Central and returns cached ingredient nutrition data. It requires exemption from auth for two independent reasons:

1. **The public recipe page (`/public/recipe/[id]`) is an unauthenticated consumer of this endpoint.** When a guest visits a public recipe, the browser calls `/api/nutrition` from `NutritionPanel.js` to display calorie data. At this point, no session exists.
2. **The data returned is non-sensitive public information.** The route never queries user-owned tables, never reads RLS-protected data, and never returns anything that could identify or affect a user. It returns USDA nutritional values for ingredient names.

**Options considered:**

| Option | Problem |
|---|---|
| A — Require auth for `/api/nutrition` | Public recipe page cannot show calorie data without login |
| B — Pass auth tokens from the public page | Impossible — public pages have no session |
| C — Exempt `/api/nutrition` from middleware | Correct — data is non-sensitive, no user data at risk |
| D — Create a separate unauthenticated API at `/public/api/nutrition` | Extra routing complexity for no gain |

## Decision

Add `/api/nutrition` to the `isPublicRoute` allowlist in `src/lib/supabase/middleware.js`.

This is a **deliberate, documented security decision**, not an oversight. The exemption is justified by both conditions holding simultaneously:
- The route returns only non-sensitive cached public data (USDA ingredient values)
- The route has no access to user-owned or RLS-protected tables

**Future public API routes must meet both conditions to qualify for middleware exemption.** If a route returns user data or queries user-owned tables, it must NOT be added to the allowlist regardless of convenience.

## Rationale

1. **Defence in depth is maintained** — the route never reads user-scoped data; exempting it from session checks introduces no data isolation risk
2. **USDA API key is server-side only** — the key is never returned in the response; callers cannot extract it through this route
3. **Public recipe pages are a primary product surface** — showing calorie data to unauthenticated visitors is a feature, not a gap

## Trade-offs Accepted

- **No per-caller rate limiting at the auth layer** — unauthenticated callers could technically hammer the endpoint. Mitigated by in-memory + Supabase caching (most requests never reach USDA), but no explicit rate limit exists.
- **The allowlist grows over time** — each addition to `isPublicRoute` requires explicit review; without discipline, sensitive routes could be accidentally exempted.
- **Not all public API routes are equivalent** — `/api/nutrition` is safe to exempt because it has no user data. Future developers must not copy the pattern without understanding the justification.

## Consequences

- **Positive**: Public recipe pages display calorie data without requiring visitors to log in. The calorie counter works end-to-end on the public-facing surface.
- **Negative**: No rate limiting on unauthenticated calls to `/api/nutrition`. Under sustained abuse, the USDA API key's quota could theoretically be exhausted.
- **Mitigation**:
  - Supabase L2 cache (ADR-004) absorbs most load — genuine USDA calls are rare after warm-up
  - If abuse becomes a concern, add a lightweight anonymous rate limiter (e.g. IP-based with `next-rate-limit`) without requiring auth changes

## Revisit Trigger

Reconsider when:
- A public API route is proposed that touches user-owned data — do NOT exempt it; require a different auth pattern
- A rate-limiting middleware is added to the app — ensure exempt routes are also covered
- The middleware allowlist exceeds 8 entries — consider replacing the pattern with a route-decorator or `export const publicRoute = true` convention instead of a central list

## Related Decisions

- [ADR-002](ADR-002-rls-as-service-boundary.md) — RLS is the data isolation boundary; this ADR exempts a route from session checks, not from RLS
- [ADR-004](ADR-004-nutrition-caching-usda.md) — The `/api/nutrition` route this ADR exempts
- [ADR-006](ADR-006-ssr-isr-public-recipe-page.md) — The public recipe page that is the unauthenticated consumer of this route
