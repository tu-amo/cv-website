# Architecture Decision Records — The Living Cookbook

This directory contains Architecture Decision Records (ADRs) for The Living Cookbook.

ADRs capture significant architectural decisions — the context, what was decided, the trade-offs accepted, and when to revisit. They are written **before or alongside implementation**, not after.

> **Rule**: Accepted ADRs are never edited. If a decision changes, write a new ADR that supersedes the old one.

---

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-001](ADR-001-shared-database.md) | Shared Supabase Database as Primary Integration | Accepted | 2026-04-03 |
| [ADR-002](ADR-002-rls-as-service-boundary.md) | Row Level Security as Service Boundary Substitute | Accepted | 2026-04-03 |
| [ADR-003](ADR-003-ai-image-route-isolation.md) | AI Image Generation as Isolated API Route | Accepted | 2026-04-03 |
| [ADR-004](ADR-004-nutrition-caching-usda.md) | Multi-Tier Nutrition Caching with USDA FoodData Central | Accepted | 2026-04-03 |
| [ADR-005](ADR-005-public-api-nutrition-route.md) | Public API Route Exemption from Auth Middleware | Accepted | 2026-04-03 |
| [ADR-006](ADR-006-ssr-isr-public-recipe-page.md) | SSR + ISR for Public Recipe Page / Client Component for Authenticated Page | Accepted | 2026-04-03 |
| [ADR-007](ADR-007-named-service-role-client.md) | Named Service Role Client as Auditable RLS Bypass | Accepted | 2026-04-03 |
| [ADR-008](ADR-008-ingredient-query-boost-map.md) | Ingredient Name Normalisation and Query Boost Map | Accepted | 2026-04-03 |
| [ADR-009](ADR-009-whatsapp-calendar-deep-links.md) | WhatsApp and Google Calendar as OS-Handled Deep Links | Accepted | 2026-04-03 |
| [ADR-010](ADR-010-observability-error-tracking.md) | Observability and Error Tracking Strategy | Accepted | 2026-04-04 |
| [ADR-011](ADR-011-middleware-file-naming-convention.md) | Next.js Middleware File Naming Convention | Accepted | 2026-04-04 |
| [ADR-012](ADR-012-anon-rls-policies-public-recipe-tables.md) | Anonymous RLS Policies for Public Recipe Related Tables | Accepted | 2026-04-04 |
| [ADR-013](ADR-013-two-environment-database-strategy.md) | Two-Environment Database Strategy (Staging + Production) | Accepted — partially superseded by ADR-016 | 2026-04-07 |
| [ADR-014](ADR-014-supabaseadmin-join-and-signup.md) | supabaseAdmin Usage at Household Join and Signup | Accepted | 2026-04-07 |
| [ADR-015](ADR-015-nutrition-flags-table.md) | Nutrition Flags Table for Bad USDA Match Reporting | Accepted | 2026-04-07 |
| [ADR-016](ADR-016-supabase-cli-migration-management.md) | Supabase CLI as the Migration Delivery Mechanism | Accepted | 2026-04-08 |
| [ADR-017](ADR-017-snapshot-restore-guard-child-rows.md) | Snapshot-Restore Guard for Delete-Then-Insert Child Row Patterns | Accepted | 2026-04-08 |

---

## How to Add a New ADR

1. Copy the template below into a new file: `ADR-00N-short-title.md`
2. Fill in all sections honestly — including negative consequences
3. Update this index after the decision is accepted

```markdown
# ADR-00N: [Title]

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-00X

## Date
YYYY-MM-DD

## Context
[What problem? What constraints?]

## Decision
[What exactly did we decide?]

## Rationale
[Why — tied to constraints and requirements]

## Trade-offs Accepted
[What are we giving up and why is that acceptable?]

## Consequences
- **Positive**: ...
- **Negative**: ...
- **Mitigation**: ...

## Revisit Trigger
[When should this decision be reconsidered?]
```
