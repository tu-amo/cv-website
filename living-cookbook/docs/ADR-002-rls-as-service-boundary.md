# ADR-002: Row Level Security as Service Boundary Substitute

## Status
Accepted

## Date
2026-04-03

## Context

Living Cookbook operates under ADR-001 (shared database). Without service-level boundaries, we need a mechanism to ensure that:
- Users can only read their own private recipes
- Household members can only see recipes scoped to their household
- Anonymous visitors can only see public recipes
- Shopping list items are never visible across households

In a microservices architecture, each service enforces its own access control in application code. In a shared-DB monolith, this enforcement must happen elsewhere.

Options considered:
- **Option A**: Application-layer access control only — check `user_id` in every query in Next.js code
- **Option B**: Supabase Row Level Security (RLS) at the database layer
- **Option C**: Hybrid — RLS for reads; application layer for writes

## Decision

We will use **Supabase Row Level Security (RLS) policies as the primary access control mechanism** for all database tables.

Every table has RLS enabled. Every SELECT, INSERT, UPDATE, and DELETE policy is explicitly defined. No table has an open-access policy. The `SECURITY DEFINER` function `get_my_group_ids()` breaks RLS recursion for group membership lookups.

## Rationale

1. **Defence in depth** — even if application code has a bug that constructs a wrong query, RLS at the DB layer prevents the data from being returned
2. **Centralised policy** — access rules are defined once in SQL, not scattered across dozens of API routes and server components
3. **Eliminates a class of bugs** — cross-user data leaks cannot happen through accidental query mistakes
4. **Supabase anonymous access** — public recipes (`is_public = true`) are served to anonymous visitors via RLS without requiring any application-layer guard

## The Named Exception: Service Role Client

ADR-002 establishes RLS as the primary access control boundary. There is one deliberate, named exception: a service role client that bypasses all RLS policies for system-level writes with no associated user session.

This exception is fully documented in **[ADR-007: Named Service Role Client as Auditable RLS Bypass](ADR-007-named-service-role-client.md)**, including the governance rules, build-time guard (`import 'server-only'`), and grep audit pattern.

---

## Trade-offs Accepted

- **SQL is not application code** — RLS policies are harder to unit test, harder to review in PRs, and harder to debug than TypeScript
- **Recursion risk** — RLS policies that query other RLS-protected tables create circular lookups; required `SECURITY DEFINER` workaround adds complexity
- **Drift risk** — the live database RLS state can drift from the snapshot without immediate visibility; requires active drift checking
- **Schema evolution is riskier** — changing a table's structure requires reviewing and potentially updating its RLS policies

## Consequences

- **Positive**: Strong data isolation guarantee at the lowest possible layer; anonymous public recipe browsing works with zero application code
- **Negative**: RLS bugs are silent (queries return empty sets, not errors) — root cause analysis is non-trivial
- **Mitigation**: 
  - `schema_snapshot.sql` maintained as canonical RLS truth
  - Drift check query validates live DB state against snapshot
  - Every migration includes RLS policies in the same file (workflow rule SC1)

## Revisit Trigger

Reconsider when:
- RLS policies become too complex to maintain safely (>5 conditions per policy)
- A domain is extracted into its own service with its own database — at that point, application-layer auth replaces RLS for that domain
- Compliance audit requires RLS policies to be version-controlled and code-reviewed with equal rigour to application code

## Related Decisions

- [ADR-001](ADR-001-shared-database.md) — The shared DB that makes RLS necessary
- [ADR-003](ADR-003-ai-image-route-isolation.md) — AI route has no DB access, so RLS does not apply
- [ADR-005](ADR-005-public-api-nutrition-route.md) — Public API route that uses the admin client for its cache write
- [ADR-006](ADR-006-ssr-isr-public-recipe-page.md) — SSR page that uses the anon key (RLS-enforced) for its Supabase read
- [ADR-007](ADR-007-named-service-role-client.md) — Full specification of the service role client exception
