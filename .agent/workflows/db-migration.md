---
description: Safe Database Migration Checklist (Schema + RLS + Client Sync)
---

# 🔐 Database Migration Safety Workflow
**Last Reviewed:** 2026-04-07

> **Pre-requisite:** Before writing any migration, run `/cloud-db-sync` to confirm you have a SQL sync artifact ready to deliver to the user alongside (or before) the code change.

Use this EVERY TIME you make a Supabase schema change (new table, RLS, new column).


---

## Step 0: Check for Schema Drift (Always Run First)

Before making any change, confirm the live database matches the code.

> ⚠️ **Two environments exist.** Generally run the drift check on **staging** first (this is what `localhost:3000` tests against), then apply to production before deploying.
>
> | Environment | SQL Editor |
> |---|---|
> | Staging (dev) | [living-cookbook-dev](https://supabase.com/dashboard/project/hbgxotjjpapdqlqrofqz/sql) |
> | Production | [living-cookbook](https://supabase.com/dashboard/project/hiuhjnodzodcgwltweoc/sql) |

Run this in the Supabase SQL Editor (staging first):

```sql
-- Audit live RLS policies vs. what schema_snapshot.sql expects
SELECT
  t.tablename,
  t.rowsecurity                   AS rls_on,
  COUNT(p.policyname)             AS policy_count,
  STRING_AGG(p.policyname, ', ') AS live_policies
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
```

Compare the result against [`supabase/schema_snapshot.sql`](file:///Users/janescott/Projects/Anti/living-cookbook/supabase/schema_snapshot.sql).

**🚨 If policies in the live DB differ from the snapshot:**
- A change was made directly in the SQL Editor without being committed to code
- Update `schema_snapshot.sql` and create a migration file *before* proceeding

---

## Step 1: Write the Migration File

Create a new file in `supabase/migrations/` with a timestamp name:
```
YYYYMMDDHHMMSS_describe_the_change.sql
```

Every migration file MUST contain all 4 of these sections:

```sql
-- 1. SCHEMA: Create or alter the table
CREATE TABLE IF NOT EXISTS my_table ( ... );
-- or: ALTER TABLE my_table ADD COLUMN IF NOT EXISTS ...

-- 2. RLS: Enable row level security immediately
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES: Add at least one SELECT policy (never leave empty!)
-- Simple rule: authenticated users can read
CREATE POLICY "auth_read" ON my_table
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- If data has ownership, scope it:
CREATE POLICY "owner_read" ON my_table
  FOR SELECT USING (user_id = auth.uid());

-- 4. RELATED TABLES: Check if joins are also RLS-protected!
-- Run this to see which joined tables may also need policies:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## Step 2: Verify Policies Are Complete

Run this diagnostic in the [Supabase SQL Editor](https://supabase.com/dashboard) after every migration:

```sql
-- See ALL policies across ALL tables (no policy = silent deny!)
SELECT 
  t.tablename,
  t.rowsecurity AS rls_on,
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

## Step 3: Check for Recursive Policies

Policies that reference the same table they protect cause infinite recursion.

**❌ Dangerous pattern (self-referencing):**
```sql
-- DO NOT do this on group_members:
CREATE POLICY "bad" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );
```

**✅ Safe pattern (always reference self directly first):**
```sql
-- You can always see your OWN membership row:
CREATE POLICY "own_membership" ON group_members
  FOR SELECT USING (user_id = auth.uid());
```

---

## Step 4: Update the Supabase Client in Code

After any auth-related change, grep for old client usage:

// turbo
```bash
grep -rn "from \"@/lib/supabase\"" src/
```

If any files are found, they must be updated to use the SSR-aware client:

```js
// ❌ Old (no session token passed to RLS)
import { supabase } from "@/lib/supabase";

// ✅ New (session-aware, works with RLS)
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
const supabase = useMemo(() => createClient(), []);
```

---

## Step 5: Assign Ownership for Existing Data

If you added a `user_id` column to existing rows, claim them:

```sql
-- Replace 'YOUR_EMAIL' with your actual email
UPDATE recipes
SET user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL')
WHERE user_id IS NULL;

-- Repeat for any table with a user_id column
UPDATE shopping_list
SET user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL')
WHERE user_id IS NULL;
```

---

## Step 6: Smoke Test

Open the app and verify these routes work after login:

- [ ] `/` — Library loads recipes (no "Error connecting to database")
- [ ] `/recipe/[id]` — Ingredients and Method are visible
- [ ] `/shopping` — Market list loads
- [ ] `/add` — Form loads without errors

> Run this smoke test against **staging** (`localhost:3000`) first.
> After production deploy, repeat the key checks on the live Vercel URL.

---

## Step 7: Update the Schema Snapshot

After confirming everything works, update the canonical snapshot so future drift checks stay accurate:

1. Open [`supabase/schema_snapshot.sql`](file:///Users/janescott/Projects/Anti/living-cookbook/supabase/schema_snapshot.sql)
2. Add any new tables, columns, or policy definitions you created in this session
3. Update the `-- Last Updated:` date at the top
4. Commit it alongside your migration file:

```bash
git add supabase/schema_snapshot.sql supabase/migrations/
git commit -m "schema: update snapshot after [describe change]"
```
