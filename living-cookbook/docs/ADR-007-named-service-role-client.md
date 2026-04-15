# ADR-007: Named Service Role Client as Auditable RLS Bypass

## Status
Accepted

## Date
2026-04-03

## Context

ADR-002 establishes Row Level Security as the primary access control boundary for the application. Every table has RLS enabled. All application code accesses data through session-aware Supabase clients that pass the user's JWT, allowing RLS policies to filter rows appropriately.

There is one category of server operation where this model breaks down: **server-to-database writes that have no associated user session**.

The nutrition cache write-back (ADR-004) is the first and currently only instance of this pattern:
- After a successful USDA API call, the result is written to `nutrition_cache`
- This write originates from an API route handler, not from a user action
- No valid user JWT exists (the `/api/nutrition` route is public — ADR-005)
- The `nutrition_cache` table has no INSERT policy; only the **service role key** can write to it

**Options considered:**

| Option | Problem |
|---|---|
| A — Create an INSERT RLS policy for anon callers | Would allow unauthenticated callers to write to the DB — a security hole |
| B — Add an authenticated user context artificially | Fabricating sessions is unsafe and architecturally wrong |
| C — Use the service role key ad hoc in the API route | Works but creates an undocumented, hard-to-audit bypass |
| D — Create a named module (`supabaseAdmin`) as the single RLS bypass entry point | All bypasses are centralised, auditable, and documented — chosen |

**The risk this ADR is designed to contain:**

The service role key bypasses all RLS policies entirely. If it is used carelessly — especially if it somehow reaches client-side code — it grants unrestricted access to the entire database. The service role key must never:
- Be imported in a client component
- Be returned in an API response
- Be committed to version control

Without a named pattern, each developer who needs a service role write might create their own ad hoc `createClient(serviceRoleKey)` call in different files. This proliferates the bypass surface and makes security audits unreliable.

## Decision

Create `src/lib/supabase/admin.js` as a **single, named, server-only module** that exports `supabaseAdmin` — a Supabase client initialized with the service role key.

**Implementation: Lazy Proxy (not eager singleton)**

The client must be initialised lazily — deferred to the first request — not at module-load time. Eager initialisation crashes Vercel builds because `SUPABASE_SERVICE_ROLE_KEY` is a runtime secret unavailable during the build bundle evaluation step (LL-023).

```js
// src/lib/supabase/admin.js
import 'server-only'; // Next.js build-time guard: throws if imported in a Client Component

import { createClient } from '@supabase/supabase-js';

let _client = null;

function getInstance() {
    if (!_client) {
        // Deferred to first request — SUPABASE_SERVICE_ROLE_KEY is a runtime secret
        // not available at build time. Do NOT call createClient() at module top-level.
        _client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }
    return _client;
}

// Proxy defers getInstance() to first property access (first actual use)
export const supabaseAdmin = new Proxy({}, {
    get(_, prop) { return getInstance()[prop]; }
});
```

> [!CAUTION]
> Do NOT simplify this to `export const supabaseAdmin = createClient(url, key)` at module top-level. This evaluates at bundle time and crashes Vercel builds with `Error: supabaseKey is required` when the secret is absent in the build environment (LL-023).

**Rules governing use of `supabaseAdmin`:**

1. **Only import it in server-only files**: API routes, server actions, middleware
2. **Never use it to query user-scoped data**: If a table has a `user_id` column and you need user-filtered rows, use the session-aware client — not `supabaseAdmin`
3. **Always prefer extending RLS policies first**: If a new table need can be satisfied by adding an RLS policy, do that instead of using `supabaseAdmin`
4. **Document every new use site**: Any file that imports `supabaseAdmin` must have a comment explaining why RLS bypass is appropriate for this specific operation
5. **Audit via grep**: `grep -rn "supabaseAdmin"` shows every bypass site in the codebase

Currently, `supabaseAdmin` is used in exactly one location: `src/app/api/nutrition/route.js` for the fire-and-forget write to `nutrition_cache`.

## Rationale

1. **Centralisation enables auditing** — all RLS bypasses are visible through a single grep; no need to search for service role key usage patterns
2. **`import 'server-only'` is a build-time guard** — Next.js throws a build error if `admin.js` is imported anywhere that could be bundled for the client
3. **The `nutrition_cache` use case is legitimate** — the table holds shared non-user data (public USDA nutritional facts); it is not protected by RLS policies and no user session is needed or appropriate for the write
4. **Named module signals intent** — `supabaseAdmin` reads as "admin-level access" at the call site, making it obvious that the code is doing something privileged that requires justification

## Trade-offs Accepted

- **A privileged path exists** — any developer who imports `supabaseAdmin` can bypass RLS. The `import 'server-only'` guard prevents accidental client exposure; it does not prevent intentional misuse in server code.
- **The pattern could be copied incorrectly** — a future developer might use `supabaseAdmin` for a user-scoped query (e.g. "fetch all recipes by any user") without understanding the security implications.
- **Only one layer of enforcement** — the `server-only` import prevents client-side exposure. There is no runtime check that verifies the caller is using the admin client only for non-user-scoped data.

## Consequences

- **Positive**: All service role usage is auditable at a single grep. Build-time guard prevents the most dangerous misuse (client-side exposure). RLS bypass is named and visible rather than hidden in ad hoc client creation.
- **Negative**: The pattern legitimises RLS bypass as a concept, which new developers may over-apply.
- **Mitigation**:
  - Code review rule: any new `import { supabaseAdmin }` requires an explicit comment justifying why RLS bypass is appropriate
  - If a second use site emerges that touches user-scoped data, create a separate ADR before proceeding — do not silently expand usage

## Revisit Trigger

Reconsider when:
- A second table requires service role writes — evaluate whether the table can instead use an RLS `INSERT` policy that is appropriately scoped
- A formal security audit is required — enumerate all `supabaseAdmin` use sites and review each against the rules above
- Next.js introduces a better server-action-based pattern for authenticated server writes — consider migrating nutrition cache writes to that pattern
- The team grows beyond 2 developers — add a linting rule or PR checklist item that flags new `supabaseAdmin` imports for explicit review

## Related Decisions

- [ADR-002](ADR-002-rls-as-service-boundary.md) — This ADR documents the first and currently only legitimate exception to RLS-enforced access control
- [ADR-004](ADR-004-nutrition-caching-usda.md) — The nutrition cache write-back is the specific use case that motivated this pattern
- [ADR-005](ADR-005-public-api-nutrition-route.md) — The `/api/nutrition` route has no user session, making service role the only viable write mechanism
