# ADR-001: Shared Supabase Database as Primary Integration

## Status
Accepted

## Date
2026-04-03

## Context

The Living Cookbook is in early MVP stage, built by a single developer, targeting a single deployment.
The system has multiple logical domains (Recipes, Households, Market List, Identity, AI) that all need to read and write data.

We needed to choose how these domains integrate:
- **Option A**: Shared database — all domains read/write the same Supabase PostgreSQL instance
- **Option B**: Database per service — each domain owns its own isolated data store
- **Option C**: API-first from day one — services only communicate via REST/events, no direct DB sharing

## Decision

We will use **a single shared Supabase PostgreSQL database** as the integration mechanism for all domains during the current MVP phase.

All Next.js application code accesses data through the Supabase JS client (`@supabase/ssr`), using Row Level Security (RLS) policies to enforce data isolation at the database layer.

## Rationale

1. **Single developer, single team** — the coordination overhead of separate databases provides no benefit at this stage
2. **Supabase as BaaS** — Supabase provides auth, storage, and PostgreSQL in one managed service, dramatically reducing infrastructure complexity
3. **RLS compensates for shared schema** — Supabase RLS enforces row-level access control at the database layer, meaning data isolation is maintained even without service-level boundaries
4. **Speed to market** — a shared DB allows cross-domain queries (e.g. joining recipes to profiles to households) in a single PostgREST call without inter-service HTTP overhead

## Trade-offs Accepted

- **Tight data coupling**: All domains share the same schema — a change to the `recipes` table potentially affects all code that reads it
- **No independent scaling**: If the Recipe domain receives massive traffic, we cannot scale it independently from the Household domain
- **Schema migration coordination**: Any schema change must be coordinated across all code that touches that table
- **Single point of failure**: If the Supabase instance is unhealthy, all domains fail simultaneously

These trade-offs are acceptable because:
- The application has low traffic at this stage
- The development team is one person — coordination cost is near zero
- Supabase provides managed uptime SLAs that are sufficient for current needs

## Consequences

- **Positive**: Very fast development velocity; no inter-service network calls; PostgREST auto-generates a REST API over the schema
- **Negative**: As the team grows, schema changes become political and risky; bounded contexts are only logical, not physical
- **Mitigation**: Enforce the logical boundaries in code (never query across context boundaries in application logic); document bounded contexts clearly so the physical split is easier when needed

## Revisit Trigger

Reconsider this decision when **any** of the following occur:
- A second independent team needs to own a domain
- A domain requires a different scaling profile (e.g. AI features hitting DB quota)
- The schema grows beyond ~20 tables and cross-context joins become too complex to reason about
- Compliance requirements demand physical data separation between user types (e.g. professional vs personal)

## Related Decisions

- [ADR-002](ADR-002-rls-as-service-boundary.md) — RLS as the access control mechanism within the shared DB
- [ADR-003](ADR-003-ai-image-route-isolation.md) — First exception: AI route already isolated from DB
