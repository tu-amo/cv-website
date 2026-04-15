# ADR-011: Next.js Middleware File Naming Convention

## Status
⚠️ Partially Superseded — see LL-024 update below

## Date
2026-04-04

## Update — 2026-04-05 (LL-024)

Next.js 16 renamed the middleware concept to **"Proxy"**. The framework now:
- Prefers `src/proxy.js` with `export function proxy(request) {}`
- Shows a deprecation warning for `src/middleware.js`: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`
- Still accepts `src/middleware.js` for backwards compatibility — functionality is unaffected during the transition period

**Current action**: Leave `src/middleware.js` in place. The deprecation warning does not affect runtime behaviour. Plan migration to `src/proxy.js` in a dedicated branch, with full testing of the auth allowlist before merging.

**Migration checklist (when ready):**
1. Rename `src/middleware.js` → `src/proxy.js`
2. Rename `export async function middleware` → `export async function proxy`
3. Confirm `config.matcher` export is unchanged
4. Run the deployment check: protected route without session must redirect to `/login`
5. Update this ADR status to `Accepted` and remove the superseded note

> The core finding of this ADR — **silent failure when the file is incorrectly named** — remains valid and unchanged. The risk now applies to `proxy.js` as well as `middleware.js`.

## Context

Next.js has a strict, undocumented constraint on where middleware can be placed and how it must be exported. The framework silently ignores any middleware file that does not match the exact naming and export convention — **no build error, no console warning, no runtime error**.

This was discovered when the middleware was placed in a descriptively named file (`src/proxy.js`) and the expected request interception did not occur. The failure mode is silent: the app runs normally, routes that should be protected are accessible without authentication, and there is no indication in build output or logs that the middleware is being skipped.

**The constraint:**

| Rule | Detail |
|---|---|
| File location | Must be exactly `src/middleware.js` (with `src/` directory) or `middleware.js` (project root, without `src/`) |
| Export name | Must be a named export: `export function middleware(request) {}` or `export default` |
| Config export | Route matching is controlled by `export const config = { matcher: [...] }` in the same file |
| No other file | Any other filename — `proxy.js`, `auth-middleware.js`, `handler.js` — is silently ignored |

**The failure mode in detail:**

```
Developer creates src/proxy.js with correct middleware logic
  ↓
Build succeeds with no warnings
  ↓
App runs normally
  ↓
All routes are accessible without authentication — middleware never ran
  ↓
No error, no log entry, no indication anything is wrong
  ↓
Discovered only when testing a route that should have been blocked
```

The risk is highest during refactoring: a developer moves middleware logic to a new file "to keep things organised" and the silent failure means the security regression is only caught if explicitly tested.

## Decision

The middleware file **must** be located at `src/middleware.js` and must export a function named `middleware`. This is a hard framework constraint — it is not a stylistic preference and cannot be overridden.

```js
// src/middleware.js  ← MUST be this exact path
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request) {  // ← MUST be named 'middleware'
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!api/nutrition|public|join|login|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

The implementation logic (session checking, route allowlisting) lives in `src/lib/supabase/middleware.js` and is called from the entry point. **Only the entry point file at `src/middleware.js` is recognised by Next.js.**

### What is permitted

- The implementation logic can live in any file and be imported
- The `config.matcher` array controls which routes trigger the middleware
- Multiple middleware concerns can be composed inside the single `middleware` function

### What is not permitted

- Splitting middleware across multiple files that Next.js calls independently (not supported)
- Naming the entry point anything other than `middleware.js` at the project or `src/` root

## Rationale

1. **Silent failure is a security risk** — an incorrectly named middleware file does not protect routes; auth checks are silently bypassed
2. **Framework constraint, not preference** — this cannot be changed by configuration; it must be documented so developers understand it is immovable
3. **Refactoring risk is high** — the temptation to rename or reorganise middleware files is common; this ADR explicitly prevents it

## Trade-offs Accepted

- None — this is a framework constraint. There are no meaningful trade-offs to choose between.

## Consequences

- **Positive**: All developers understand why the file must be named exactly `src/middleware.js` and will not rename it during refactoring
- **Negative**: The constraint cannot be worked around; if Next.js changes the convention in a future major version, migration is required
- **Mitigation**:
  - Add a comment at the top of `src/middleware.js`: `// FRAMEWORK CONSTRAINT: This file must be named middleware.js at the src/ root. See ADR-011.`
  - Add a test that hits a protected route without a session and asserts it redirects to `/login` — this catches silent middleware failures in CI

## Revisit Trigger

Reconsider only when:
- Next.js releases a major version that changes the middleware file naming convention — this would be a documented breaking change in the release notes

## Related Decisions

- [ADR-005](ADR-005-public-api-nutrition-route.md) — The `isPublicRoute` allowlist lives in the middleware config this ADR governs
- [ADR-002](ADR-002-rls-as-service-boundary.md) — Middleware is the session-check layer; RLS is the data-isolation layer; both must function for security to hold
