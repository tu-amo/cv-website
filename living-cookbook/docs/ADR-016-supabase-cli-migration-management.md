# ADR-016: Supabase CLI as the Migration Delivery Mechanism

## Status
Accepted

## Date
2026-04-08

## Supersedes (Partial)
[ADR-013](ADR-013-two-environment-database-strategy.md) — specifically the "Manual schema sync" trade-off accepted in §Trade-offs. The two-environment architecture decision (two Supabase projects) remains unchanged.

## Context

ADR-013 accepted a significant trade-off: every schema migration had to be applied manually to both environments via the Supabase SQL Editor, with no automated tracking of which migrations had been applied where.

This trade-off manifested as a critical incident on 2026-04-08 (LL-043):

- The `preparation` column existed in the staging `recipe_ingredients` table but was never added to production.
- The code performed `DELETE WHERE recipe_id = editId` before attempting INSERT, with no transaction boundary.
- Every ingredient INSERT returned HTTP 400 (unknown column), but the DELETE had already committed.
- Result: all ingredient rows were permanently deleted for every recipe that was saved after the column diverged.
- 4 production recipes lost all ingredient data. 3 were recovered from staging; 1 required manual re-entry.

ADR-013 explicitly listed this scenario as a revisit trigger:
> *"A production incident is caused by a missed production SQL sync — switch to automated migration tooling (`supabase db push`)"*

That trigger has now fired.

**Options considered:**

| Option | Notes |
|---|---|
| A — Continue manual SQL editor sessions | Ruled out — LL-043 is direct evidence this fails in practice |
| B — Supabase Branches | Not available on the free tier |
| C — GitHub Actions CI pipeline | Adds external infrastructure; requires DB password in GitHub Secrets; overkill for current team size |
| D — Supabase CLI (`supabase db push`) as local command | Simple; tracked; no additional infrastructure; chosen |

## Decision

Install the **Supabase CLI** (`supabase` v2.88.1) as a dev dependency and use it as the sole mechanism for applying schema migrations to both environments.

**New workflow:**
```bash
npm run db:new <name>        # creates supabase/migrations/YYYYMMDDHHMMSS_<name>.sql
# edit the SQL file
npm run db:push:staging      # apply to staging; test at localhost:3000
npm run db:push:prod         # apply to production; then git push triggers Vercel deploy
npm run db:status            # verify Local = Remote for all migrations
```

**Migration tracking:**  
The CLI maintains a `supabase_migrations.schema_migrations` table in each database. This is the authoritative record of which migrations have been applied. `npm run db:status` shows the diff between local files and the remote table at a glance.

**Baseline establishment (2026-04-08):**  
All 16 existing migrations (applied manually before the CLI was introduced) were registered via `supabase migration repair --status applied <timestamp>`. The CLI now has a complete, accurate history for both environments.

**File naming rule:**  
All migration files must use the full `YYYYMMDDHHMMSS` timestamp prefix (not just `YYYYMMDD`) to guarantee uniqueness. Six files with duplicate date-only prefixes were renamed on 2026-04-08.

## Rationale

1. **Deterministic tracking** — the CLI knows exactly which migrations have been applied to each database. `db:status` makes unsynced migrations immediately visible before they cause damage.
2. **No new infrastructure** — the CLI is a dev dependency; it runs locally. No CI secrets, no external pipeline, no Docker required.
3. **Reversible** — if the CLI setup becomes a problem, migration files are plain SQL and can always be applied manually as a fallback.
4. **LL-043 prevention** — the one-line workflow (`db:push:prod` before `git push`) makes it structurally harder to forget production than the old "remember to open the SQL editor" approach.

## Trade-offs Accepted

- **Requires authentication:** The CLI must be authenticated with a Supabase Personal Access Token (`supabase login --token`). Tokens are stored in the local keychain and must never be committed or shared. New developers must generate their own token.
- **Local-only:** `db:push` runs from the developer's machine, not from CI. If the developer does not run it before pushing, production can still diverge. A future CI integration (GitHub Actions + `SUPABASE_ACCESS_TOKEN` secret) would close this gap fully.
- **No rollback built-in:** The Supabase CLI does not support migration rollbacks. Reversal requires a new migration file. All migrations must be written to be safely re-applicable (`IF NOT EXISTS`, `IF EXISTS`, idempotent).

## Mitigation

- `npm run db:status` is listed as a mandatory check in the `/regression` and `/publish` workflows before any production deploy.
- The `/db-migration` workflow has been rewritten to make `db:push` the documented primary path.
- OBS-009 (daily schema-drift cron) remains active as a secondary alarm that catches divergence within 24 hours even if `db:push` was skipped.

## Consequences

- **Positive:** Schema drift is detected/prevented before it reaches production. Migration history is auditable. No more SQL Editor copy-paste during deployments.
- **Negative:** One more tool to authenticate on a new machine. `db:push:prod` is a manual step that CI doesn't enforce yet.
- **Future path:** Add `supabase db push --project-ref hiuhjnodzodcgwltweoc` as a step in a GitHub Actions deploy workflow, gated on `main` branch pushes, using `SUPABASE_ACCESS_TOKEN` as a repository secret.

## Revisit Trigger

Reconsider when:
- A production incident occurs because `db:push:prod` was skipped — move `db:push` into GitHub Actions CI so it runs automatically on every merge to `main`
- Team grows beyond one developer — the personal-token auth model becomes a coordination issue; switch to a service account or CI-managed token
- Supabase Branches become available on the current plan — replace the two-project strategy entirely

## Related Decisions

- [ADR-013](ADR-013-two-environment-database-strategy.md) — Two-environment architecture this ADR partially supersedes
- [ADR-002](ADR-002-rls-as-service-boundary.md) — RLS policies must still be included in every migration file
- LL-043 in `LESSONS_LEARNT.md` — the incident that triggered this ADR
