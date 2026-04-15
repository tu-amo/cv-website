# ADR-014: supabaseAdmin for Household Join and Signup Profile — Expanded Use Cases

## Status
Accepted

## Date
2026-04-07

## Context

ADR-007 established `supabaseAdmin` as the single auditable RLS bypass entry point, with one documented use case: the fire-and-forget write to `nutrition_cache` in `/api/nutrition`. ADR-007 states: *"Currently, `supabaseAdmin` is used in exactly one location."*

Two additional use cases emerged during the 2026-04-06 development session that require RLS bypass. Both were added with ADR-007 acknowledgement comments at the import site, but no formal decision review was recorded at the time. This ADR closes that gap.

---

### Use Case A — Household Join Flow (`/join/[code]/page.js`)

**Why the regular client fails:**

The join page handles an authenticated user clicking an invite link. The user is logged in (JWT is valid), but they are attempting to:
1. `SELECT` a group by its `invite_code` — before they are a member of that group
2. `SELECT` from `group_members` to check existing membership — before any row exists for them

The RLS policy for `groups` (and the join check in `group_members`) follows the pattern: *"you can read rows you are a member of."* A user who has not yet joined cannot satisfy this predicate — a classic chicken-and-egg problem. The regular session client correctly enforces this and returns no rows.

**Alternatives rejected:**

| Alternative | Problem |
|---|---|
| Make `groups` fully public (no RLS) | Groups contain names and membership counts — not appropriate to expose to all users |
| Add a special policy for invite_code lookup | `invite_code` is a shared secret; an unauthenticated SELECT on it would expose the secret to anyone who can enumerate codes |
| Move join logic to a server action that joins directly | Structurally identical — still needs to bypass RLS to read the group before the user is a member |

**Decision:** Use `supabaseAdmin` with the following safeguards:
- User identity is verified via `supabase.auth.getUser()` using the JWT *before* any `supabaseAdmin` call
- The `user.id` used in the `INSERT` comes from Supabase's own auth system — it cannot be user-supplied or spoofed
- All three `supabaseAdmin` calls (group lookup, membership check, membership insert) are in a single server component file, not spread across the codebase

---

### Use Case B — Signup Profile Upsert (`/login/actions.js`)

**Why the regular client fails:**

After a user calls `supabase.auth.signUp()`, Supabase creates a user in `auth.users` but does not immediately issue a session. The user must confirm their email before a session (JWT) exists. The `profiles` table has an RLS INSERT policy that requires `auth.uid() = user_id`. Without a session, `auth.uid()` returns `null`, and the INSERT is silently rejected.

We need to create the profile row at signup time so the user's chosen `display_name` is persisted before they complete email confirmation. Without this, the user would land on the app with no display name even after confirming.

**Alternatives rejected:**

| Alternative | Problem |
|---|---|
| Create profile after first login (not at signup) | User's chosen display name from the signup form is permanently lost; they see no name on first login |
| Use a database trigger `AFTER INSERT ON auth.users` | Correct long-term solution, but requires DB-level function deployment (tracked as tech debt in project_nexus.md) |
| Prompt the user to enter their name again after confirmation | Poor UX; breaks the expectation set by the signup form |

**Decision:** Use `supabaseAdmin` with the following safeguards:
- The `user_id` written to `profiles` is taken from `signUpData.user.id` — Supabase's own generated UUID
- No user-supplied ID is trusted
- The `display_name` is taken directly from the signup form input — no transformation that could introduce privilege escalation
- The `upsert` uses `onConflict: 'user_id'` to be idempotent and safe on duplicate calls

**Accepted long-term path:** Migrate this to a PostgreSQL trigger `AFTER INSERT ON auth.users` that calls a `handle_new_user()` function. This eliminates the need for `supabaseAdmin` at signup entirely. Tracked in `project_nexus.md` Tech Debt backlog.

---

## Updated supabaseAdmin Use Site Inventory

After this ADR, the complete list of `supabaseAdmin` use sites is:

| File | Use Case | User-Scoped? | ADR-007 Comment? |
|---|---|---|---|
| `src/app/api/nutrition/route.js` | Fire-and-forget write to `nutrition_cache` | No (shared cache) | ✅ |
| `src/app/api/admin/cache-flush/route.js` | Flush all rows from `nutrition_cache` | No (admin operation) | ✅ |
| `src/app/api/nutrition/flag/route.js` | Insert row into `nutrition_flags` moderation table | Partial (user.id from JWT) | ✅ |
| `src/app/join/[code]/page.js` | Lookup group + insert membership on join | Yes (user.id from JWT) | ✅ |
| `src/app/login/actions.js` | Upsert profile row at signup before session exists | Yes (user.id from Supabase signUp) | ✅ |

## Revisit Trigger

Reconsider when:
- The DB trigger approach (`handle_new_user()`) is implemented — removes Use Case B entirely
- A formal security audit requires enumerating all bypass sites — this ADR is the reference document
- A new developer proposes adding a 6th use site — they must read this ADR first and justify why it meets the same standard (identity verified, no user-supplied IDs, server-only)

## Related Decisions

- [ADR-007](ADR-007-named-service-role-client.md) — The original pattern this ADR extends; the rules defined there still apply to all use sites listed here
- [ADR-002](ADR-002-rls-as-service-boundary.md) — RLS as the primary boundary; this ADR documents the bounded exceptions
