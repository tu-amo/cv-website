---
description: Cloud Database Sync — Deliver SQL before code when touching Supabase schema
---

# ☁️ Cloud Database Sync Workflow
**Last Reviewed:** 2026-05-24

## When to Use This Workflow

Run this procedure whenever a code change requires a **new column, table, constraint, or RLS policy** in Supabase Cloud.

> ⚠️ Failing to sync the schema first will cause silent data blackouts or 400 errors.
> The Supabase CLI (`npm run db:push`) is now the delivery mechanism — manual SQL editor sessions are no longer required.

---

## Database Branching Rule

The project uses a single Supabase project (`living-cookbook`) with **Database Branching**.
- **Production (`main`)** is updated automatically via GitHub integration.
- **Local Dev** happens against a linked preview branch (e.g. `dev`).

---

## Steps

### Step 0: Pre-flight — confirm migration status
Before writing any code, check the current sync state against your active preview branch:
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

### Step 2: Apply to Preview Branch
Apply the migration via the CLI to your current preview branch:
```bash
npm run db:push
```
Then test locally at `localhost:3000`. Only proceed to Step 3 after smoke-testing.

### Step 3: Apply the Frontend Code Changes
Only after the SQL has been applied to your **preview branch**, update:
- Component files (`.js`)
- API route files
- Supabase query selectors (e.g. `.select("*, new_column()")`)

Test locally at `localhost:3000`.

### Step 4: Merge to Production (Automated)

Commit your code and migration files to git.

```bash
git add .
git commit -m "feat: adding new column"
git push origin feature-branch
```

When the PR is merged into `main`, Supabase GitHub integration automatically applies the migrations to the production database.

### Step 5: Verify with the DB Migration Checklist
Run `/db-migration` Step 2 (RLS audit) to confirm no silent data blackouts were introduced by the new schema. 

### Step 6: Update schema_snapshot.sql
Add all new columns, tables, constraints, and policies to:
`supabase/schema_snapshot.sql`
