# ADR-013: Two-Environment Database Strategy (Staging + Production)

## Status
Accepted

## Date
2026-04-07

## Context

The Living Cookbook initially operated against a single Supabase project in all contexts — local development, testing, and production. This created two problems:

1. **No safe place to test schema changes**: Any migration tested locally against production also immediately affected live users.
2. **No realistic auth testing**: Invite links, email confirmation, and password reset flows require real outbound email, which meant either testing against production users or skipping those flows entirely.

**Options considered:**

| Option | Problem |
|---|---|
| A — Keep single Supabase project | Schema changes tested directly on live production data |
| B — Supabase Branches | Not available on the free tier |
| C — Local Supabase via Docker | Complex setup; email flows don't work without external SMTP; different Postgres version risk |
| D — Second Supabase project (living-cookbook-dev) | Full isolation; identical auth behaviour; same billing model; Resend SMTP works — chosen |

## Decision

Provision a **second Supabase project** (`living-cookbook-dev`) as a permanent staging environment.

**Environment mapping:**

| Context | Supabase Project | URL suffix | `.env` file |
|---|---|---|---|
| Local dev (`localhost:3000`) | `living-cookbook-dev` | `hbgxotjjpapdqlqrofqz` | `.env.local` |
| Production (Vercel) | `living-cookbook` | `hiuhjnodzodcgwltweoc` | Vercel env vars |

**Data strategy:**
- Staging is seeded from production via `scripts/seed-from-prod.js` (idempotent, BigInt→UUID remapping)
- `supabase/staging_setup.sql` documents the correct table dependency order for fresh staging projects
- Staging data is for testing only — it may drift from production at any time

**Schema sync rule:**
- Every `supabase/migrations/` file must be applied to **staging first**, smoke-tested, then applied to **production at or before the matching `git push origin main`**
- The `/cloud-db-sync` and `/publish` workflows enforce this rule

## Rationale

1. **Real auth flows need a real SMTP pipeline** — Resend is configured for both projects; invite links, email confirmation, and password reset work identically in staging and production
2. **Schema change safety** — a breaking migration discovered in staging costs nothing; the same migration discovered in production costs user trust
3. **No additional infrastructure** — a second Supabase free-tier project is zero incremental cost and uses the same mental model as the first
4. **Isolation without complexity** — two projects vs. Docker compose or preview environments; materially simpler to operate

## Trade-offs Accepted

- **Manual schema sync**: Migrations must be applied to both environments manually. There is no automated pipeline (Supabase Migrate CLI is not set up). A migration applied to staging but forgotten for production will silently break users after deploy.
- **Data drift**: Staging will periodically diverge from production data. The seed script must be re-run when staging data needs refreshing.
- **Two sets of credentials**: Each environment has its own `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The risk of using the wrong set (e.g. pointing local dev at production) is real and would affect live data.

## Mitigation

- `.env.local` is committed to `.gitignore` and always points to staging
- `.env.local.production` holds production credentials and is never loaded by `next dev`
- The migration checklist in `/publish` Step 1.5 prompts for production SQL sync before every deploy
- `scripts/seed-from-prod.js` includes a pre-flight guard that aborts if staging already has data (LL-034)

## Consequences

- **Positive**: Schema changes can be safely tested before any live user sees them; realistic auth flows are testable without touching production data
- **Negative**: Every new developer must configure two sets of credentials; every migration requires two manual SQL editor operations
- **Future path**: When/if the project upgrades to Supabase Pro, Supabase Branches can replace this pattern and automate the promotion flow

## Revisit Trigger

Reconsider when:
- The team grows and manual two-project SQL sync becomes a coordination problem — migrate to Supabase Branches or a CI-managed migration pipeline
- A production incident is caused by a missed production SQL sync — switch to automated migration tooling (`supabase db push`)
- Supabase Branches become available on the current plan

## Related Decisions

- [ADR-001](ADR-001-shared-database.md) — This ADR extends the shared-DB decision; the schema is still shared, but across environments not just logical domains
- [ADR-007](ADR-007-named-service-role-client.md) — Each environment has its own service role key; the lazy Proxy pattern (LL-023) means the correct key is loaded at runtime per environment
