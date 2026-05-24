---
description: Cloud Database Sync — Deliver SQL before code when touching Supabase schema
---

# ☁️ Cloud Database Sync Workflow
**Last Reviewed:** 2026-05-24

## When to Use This Workflow

Run this procedure whenever a code change requires a **new column, table, constraint, or RLS policy** in Supabase Cloud.

> ⚠️ Failing to sync the schema first will cause silent data blackouts or 400 errors in production (see LL-043).
> The Supabase CLI (`npm run db:push`) is now the delivery mechanism — manual SQL editor sessions are no longer required.

> 🔴 **Schema Gate Rule (LL-052):** Never commit or push code that depends on a schema change until `npm run db:push:prod` has been confirmed. If the Vercel build deploys before the migration runs, any route that touches the missing table/column will 500.

---

## Two-Environment Rule

The project now has **two Supabase projects**. Every migration must be applied to both:

| Environment | Project | Who Points Here |
|---|---|---|
| **Staging** | `hbgxotjjpapdqlqrofqz` (living-cookbook-dev) | `localhost:3000` / `.env.local` |
| **Production** | `hiuhjnodzodcgwltweoc` (living-cookbook) | Vercel / `.env.local.production` |

**Always apply staging first, verify, then production at deploy time.**

---

## Steps

### Step 0: Pre-flight — confirm migration status
Before writing any code, check the current sync state:
```bash
npm run db:status
```
All rows must show Local = Remote. Any row with a blank Remote column = unapplied migration that will fail on next push.

### Step 1: Write the Migration File FIRST
Before touching any component or page file, create the migration:
```bash
npm run db:new describe_the_change
```
Edit the generated file in `supabase/migrations/`. Every migration must contain:
- Schema change (`CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`)
- `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- At least one SELECT policy (empty RLS = silent data blackout, see LL-001)
- Backfill for existing rows if needed (`UPDATE ... WHERE ... IS NULL`)

### Step 2: Apply to Staging First
Apply the migration via the CLI:
```bash
npm run db:push:staging
```
Then test locally at `localhost:3000` against staging. Only proceed to Step 3 after smoke-testing.

### Step 3: Apply the Frontend Code Changes
Only after the user confirms the SQL has been applied to **staging**, update:
- Component files (`.js`)
- API route files
- Supabase query selectors (e.g. `.select("*, new_column()")`)

Test locally at `localhost:3000` against staging.

### Step 4: Apply to Production at Deploy Time

> 🔴 **This step must happen BEFORE `git push origin main`.** Vercel deploys within seconds of a push — if the migration runs after, the live site will 500 on every request that touches the new schema.

```bash
npm run db:push:prod     # apply migrations to production FIRST
git push origin main     # THEN trigger Vercel deploy
```

Verify sync:
```bash
npm run db:status        # all rows must show Local = Remote
```

> ⚠️ If you ever apply a migration manually via the Supabase SQL editor (emergency), immediately run `supabase migration repair --status applied <version>` to keep the tracking table in sync (LL-052).

### Step 5: Verify with the DB Migration Checklist
Run `/db-migration` Step 2 (RLS audit) to confirm no silent data blackouts were introduced by the new schema. Run on **both** environments.

### Step 6: Update schema_snapshot.sql
Add all new columns, tables, constraints, and policies to:
`/Users/janescott/Projects/Anti/living-cookbook/supabase/schema_snapshot.sql`
