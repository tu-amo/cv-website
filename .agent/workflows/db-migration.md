---
description: Safe Database Migration Checklist (Schema + RLS + Client Sync)
---

# 🔐 Database Migration Safety Workflow
**Last Reviewed:** 2026-04-20

> **The Supabase CLI is the migration tool.** As of 2026-04-08, all schema changes go through
> `npm run db:new` → `npm run db:push:staging` → test → `npm run db:push:prod`.  
> Manual SQL editor sessions are no longer part of the migration process.

---

## Step 0: Check for Schema Drift (Always Run First)

```bash
npm run db:status    # shows Local | Remote columns — any blank in Remote = unapplied migration
npm run db:diff      # shows structural drift between migration files and live production schema
```

If `db:diff` shows unexpected changes, **stop and investigate before proceeding.**

> ⚠️ **Two environments:**
> | Environment | Supabase Project | Who Points Here |
> |---|---|---|
> | Staging (dev) | `hbgxotjjpapdqlqrofqz` (living-cookbook-dev) | `localhost:3000` / `.env.local` |
> | Production | `hiuhjnodzodcgwltweoc` (living-cookbook) | Vercel / `.env.local.production` |

---

## Step 1: Create the Migration File

```bash
npm run db:new describe_the_change
```

This creates `supabase/migrations/YYYYMMDDHHMMSS_describe_the_change.sql`.

Edit the generated file. Every migration MUST contain:

```sql
-- 1. SCHEMA: Create or alter the table
CREATE TABLE IF NOT EXISTS my_table ( ... );
-- or: ALTER TABLE my_table ADD COLUMN IF NOT EXISTS my_col TEXT;

-- 2. RLS: Enable row level security immediately
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES: At least one SELECT policy (never leave empty — silent data blackout!)
CREATE POLICY "auth_read" ON my_table
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

---

## Step 2: Apply to Staging First

```bash
npm run db:push:staging
```

This applies all pending migrations to staging. Test at `localhost:3000`.

---

## Step 3: Verify Policies Are Complete

Run this in the [Staging SQL Editor](https://supabase.com/dashboard/project/hbgxotjjpapdqlqrofqz/sql):

```sql
SELECT
  t.tablename, t.rowsecurity AS rls_on,
  COUNT(p.policyname) AS policy_count,
  STRING_AGG(p.policyname, ', ') AS policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
```

🚨 **Any row where `rls_on = true` AND `policy_count = 0` is a silent data blackout.**

---

## Step 4: Update the Code

Only after staging is confirmed working, update the component/API files that use the new schema.

```bash
# After auth-related changes, check for legacy client usage:
grep -rn 'from "@/lib/supabase"' src/
```

---

## Step 5: Commit Migration + Code Together

```bash
git add supabase/migrations/ src/
git commit -m "feat/fix: [describe change] + migration YYYYMMDDHHMMSS"
git push origin main
```

---

## Step 6: Apply to Production at Deploy Time

**DB push happens BEFORE or simultaneously with `git push`.** Never push code that depends on a schema change without applying it to production first.

```bash
npm run db:push:prod     # pushes pending migrations to production
git push origin main     # triggers Vercel deploy
```

Verify status after:
```bash
npm run db:status        # all migrations should show Local = Remote
```

---

## Step 7: Verify RLS on Production

Run the same RLS audit (Step 3) in the [Production SQL Editor](https://supabase.com/dashboard/project/hiuhjnodzodcgwltweoc/sql).

---

## Step 8: Update the Schema Snapshot + OBS-009

1. Export the updated schema from Supabase → Schema → Export and replace `supabase/schema_snapshot.sql`
2. Add any new required column to the `EXPECTED` object in `src/app/api/admin/schema-check/route.js`
3. Commit:

```bash
git add supabase/schema_snapshot.sql src/app/api/admin/schema-check/route.js
git commit -m "schema: update snapshot + OBS-009 after [describe change]"
```

---

## Recursive Policy Warning

Policies that reference the same table they protect cause infinite recursion.

**❌ Dangerous (self-referencing):**
```sql
CREATE POLICY "bad" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );
```

**✅ Safe (direct membership check):**
```sql
CREATE POLICY "own_membership" ON group_members
  FOR SELECT USING (user_id = auth.uid());
```

---

## Data Integrity Rule (LL-043)

Never DELETE child rows before INSERTing replacements without a snapshot-restore guard:

```js
// ✅ Safe pattern for delete-then-reinsert
const { data: snapshot } = await supabase.from('child').select('*').eq('parent_id', id);
await supabase.from('child').delete().eq('parent_id', id);
const { error } = await supabase.from('child').insert(newRows);
if (error) {
    await supabase.from('child').delete().eq('parent_id', id); // clear partials
    await supabase.from('child').insert(snapshot.map(({ id: _, ...r }) => r)); // restore
    return; // abort
}
```
