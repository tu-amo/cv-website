---
description: Cloud Database Sync — Deliver SQL before code when touching Supabase schema
---

# ☁️ Cloud Database Sync Workflow
**Last Reviewed:** 2026-04-07

## When to Use This Workflow

Run this procedure whenever a code change requires a **new column, table, constraint, or RLS policy** in Supabase Cloud. Because the AI cannot touch the live database directly, the user must manually apply SQL before the code takes effect.

> ⚠️ Failing to sync first will cause silent data blackouts or 400 errors in production.

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

### Step 1: Write the SQL Sync Artifact FIRST
Before touching any component or page file, create a `.sql` artifact with:
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` for schema changes
- `DROP CONSTRAINT IF EXISTS / ADD CONSTRAINT` for FK additions
- `DROP POLICY IF EXISTS / CREATE POLICY` for RLS changes
- `UPDATE ... WHERE ... IS NULL` for backfilling existing rows

### Step 2: Apply to Staging First
Explicitly prompt the user with:
> "Before I update the frontend code, please run this SQL in your **Staging** [Supabase SQL Editor](https://supabase.com/dashboard/project/hbgxotjjpapdqlqrofqz/sql). Let me know once it's done."

Wait for user confirmation before proceeding to Step 3.

### Step 3: Apply the Frontend Code Changes
Only after the user confirms the SQL has been applied to **staging**, update:
- Component files (`.js`)
- API route files
- Supabase query selectors (e.g. `.select("*, new_column()")`)

Test locally at `localhost:3000` against staging.

### Step 4: Apply to Production at Deploy Time
When merging to `main`, prompt the user to apply the same SQL to **production** before or at the same time as `git push origin main`:
> "Before pushing to main, please run this same SQL in your **Production** [Supabase SQL Editor](https://supabase.com/dashboard/project/hiuhjnodzodcgwltweoc/sql)."

> ⚠️ Never push code that depends on a schema change without applying it to production first.

### Step 5: Verify with the DB Migration Checklist
Run `/db-migration` Step 2 (RLS audit) to confirm no silent data blackouts were introduced by the new schema. Run on **both** environments.

### Step 6: Update schema_snapshot.sql
Add all new columns, tables, constraints, and policies to:
`/Users/janescott/Projects/Anti/living-cookbook/supabase/schema_snapshot.sql`
