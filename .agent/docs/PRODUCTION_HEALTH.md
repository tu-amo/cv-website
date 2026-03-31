# 📊 Production Health Review — The Living Cookbook

**Purpose:** Periodic checks to monitor the live app for health, data quality, security, and performance.  
**Last Updated:** 2026-03-31  
**How to use:** Work through the relevant frequency column. Not every section needs to run every week — use the cadence labels as a guide.

---

## Cadence Guide

| Symbol | Frequency |
|---|---|
| 🟢 | Every deploy / after any significant release |
| 🟡 | Weekly |
| 🟠 | Monthly |
| 🔵 | Quarterly or ad hoc |

---

## 1. User & Auth Health 🟡

### 1a. New Sign-ups This Week
Run in **Supabase → SQL Editor**:
```sql
SELECT COUNT(*), DATE(created_at) as day
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day;
```
**Watch for:** Zero new users for 2+ weeks (may indicate a broken signup flow).

### 1b. Stuck Email Confirmations
Users who signed up but never confirmed their email:
```sql
SELECT COUNT(*) as unconfirmed
FROM auth.users
WHERE email_confirmed_at IS NULL
  AND created_at < NOW() - INTERVAL '48 hours';
```
**Watch for:** Rising count without explanation. Could mean confirmation email is landing in spam, or the Supabase email template is broken.

### 1c. Profile Coverage
Every user should have a `profiles` row (created by trigger):
```sql
SELECT COUNT(*) as users_without_profile
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;
```
**Watch for:** Any number > 0. Fix: manually INSERT profile rows or check `create_profile_on_signup` trigger.

### 1d. Password Reset Usage
```sql
SELECT COUNT(*) as resets
FROM auth.users
WHERE recovery_sent_at > NOW() - INTERVAL '30 days';
```
**Watch for:** Spikes that don't match normal traffic (potential credential stuffing).

---

## 2. Recipe & Content Health 🟡

### 2a. Recipe Growth
```sql
SELECT COUNT(*) as total_recipes,
       COUNT(*) FILTER (WHERE is_public = true) as public_recipes,
       COUNT(*) FILTER (WHERE group_id IS NOT NULL) as household_recipes,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as added_this_week
FROM recipes;
```

### 2b. Recipes with No Ingredients
```sql
SELECT r.id, r.title, r.created_at
FROM recipes r
LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
WHERE ri.recipe_id IS NULL
ORDER BY r.created_at DESC;
```
**Watch for:** Recipes that were created but scanning/import failed. Follow up with the user if possible.

### 2c. Recipes with No Images
```sql
SELECT COUNT(*) as recipes_without_images
FROM recipes
WHERE (images IS NULL OR images = '[]'::jsonb)
  AND image IS NULL;
```
**Watch for:** High number may mean upload failures occurred silently.

### 2d. Orphaned `recipe_ingredients` Rows
```sql
SELECT COUNT(*) as orphaned
FROM recipe_ingredients ri
LEFT JOIN recipes r ON r.id = ri.recipe_id
WHERE r.id IS NULL;
```
**Watch for:** Any count > 0. Indicates a cascade delete didn't run. Safe to `DELETE` these manually.

---

## 3. Household Health 🟠

### 3a. Household Activity
```sql
SELECT 
  g.name,
  g.created_at,
  COUNT(gm.user_id) as member_count
FROM groups g
LEFT JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id, g.name, g.created_at
ORDER BY g.created_at DESC;
```

### 3b. Households with No Members
```sql
SELECT g.id, g.name, g.created_at
FROM groups g
LEFT JOIN group_members gm ON gm.group_id = g.id
WHERE gm.group_id IS NULL;
```
**Watch for:** These are abandoned households. Either the owner left without deleting, or a cascade delete failed. Safe to clean up.

### 3c. Invite Codes — Unused ("Cold" Invites)
```sql
-- Households with member_count = 1 (just the owner, invite never used)
SELECT g.name, g.invite_code, g.created_at
FROM groups g
JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id, g.name, g.invite_code, g.created_at
HAVING COUNT(gm.user_id) = 1
  AND g.created_at < NOW() - INTERVAL '30 days';
```
**Watch for:** Not an error — just useful to know which households are still solo after a month.

---

## 4. Shopping List Health 🟠

### 4a. Stale Unchecked Items
Items that haven't been touched in over 30 days (may be zombie lists):
```sql
SELECT COUNT(*) as stale_items
FROM shopping_list
WHERE is_checked = false
  AND created_at < NOW() - INTERVAL '30 days';
```
**Watch for:** Growing count. Not a bug — but worth noting for future "auto-clear" feature consideration.

### 4b. RLS Spot-Check — No Cross-User Leakage
```sql
-- Count items where user_id doesn't match group membership
-- If this returns > 0, there may be an RLS gap
SELECT COUNT(*) as suspicious_items
FROM shopping_list sl
LEFT JOIN group_members gm 
  ON gm.group_id = sl.group_id AND gm.user_id = sl.user_id
WHERE sl.group_id IS NOT NULL   -- household items
  AND gm.user_id IS NULL;       -- but user is not a member
```
**Watch for:** Any number > 0 is a data integrity issue. Investigate immediately.

---

## 5. AI & API Health 🟢 (after deploy)

### 5a. Gemini Quota Status
Navigate to: [Google AI Studio → API Usage](https://aistudio.google.com/)  
Check remaining daily quota for:
- **Gemini Flash** (image generation via `/api/generate-image`)
- **Gemini Vision** (recipe scanning via `/api/scan`)
- **Gemini Flash** (brief generation via `/api/brief`)

**Watch for:** `429 Too Many Requests` errors in Vercel logs.  
**Action:** If quota exhausted, note approximately when it resets (usually midnight Pacific) and log in open items.

### 5b. Vercel Function Errors
Navigate to: **Vercel Dashboard → [Project] → Functions → Logs**  
Filter by `Error` status.

Key routes to check:
| Route | Common failure reasons |
|---|---|
| `/api/brief` | Gemini quota, malformed recipe data |
| `/api/scan` | Image too large, Gemini quota, unsupported format |
| `/api/generate-image` | Prompt too long, Gemini quota |
| `/auth/callback` | Token expired, bad redirect URL |

### 5c. Edge Middleware Health
Check that the middleware is not blocking legitimate routes. Verify `/public/*` and `/join/*` are accessible without a session by visiting:
- `https://[your-domain]/public/recipe/[any-public-id]` — should load without login
- `https://[your-domain]/join/[any-code]` — should redirect to login gracefully

---

## 6. Supabase Storage Health 🟠

### 6a. Storage Bucket Usage
Navigate to: **Supabase → Storage → recipe-images → Bucket Details**  
Note total size and file count.

**Watch for:** Rapid growth without corresponding recipe count increase (may indicate duplicate uploads or failed cleanups).

### 6b. Orphaned Storage Objects
Images in the bucket that are no longer referenced by any recipe:
```sql
-- Run in SQL Editor (requires storage schema access)
SELECT COUNT(*) as orphaned_objects
FROM storage.objects so
LEFT JOIN (
  SELECT UNNEST(images) as img_url FROM recipes
  UNION ALL
  SELECT image FROM recipes WHERE image IS NOT NULL
) AS referenced ON so.name = SPLIT_PART(referenced.img_url, '/', -1)
WHERE so.bucket_id = 'recipe-images'
  AND referenced.img_url IS NULL;
```
> [!NOTE]
> If this query is slow, run it on a copy of the data or only periodically (quarterly).

---

## 7. Grams Converter Coverage 🟠

Run in browser console while logged in (`console.table` review):
```js
console.table(JSON.parse(localStorage.getItem('density_misses') || '{}'))
```

**Process:**
1. Look for ingredients with `count > 2` — these appear across multiple recipes
2. Add legitimate ones to `INGREDIENT_DENSITY` in `src/lib/unit-converter.js`
3. Commit: `git commit -m "feat(converter): expand density table — [ingredients]"`
4. Clear the log: `localStorage.removeItem('density_misses')`

> See also: `/update-docs` Step 7e for the full procedure.

---

## 8. Performance Spot-Check 🟠

### 8a. Core Web Vitals (after deploy)
Run [PageSpeed Insights](https://pagespeed.web.dev/) on:
- `https://[your-domain]/` — gallery page (recipe grid)
- `https://[your-domain]/public/recipe/[id]` — public recipe detail

**Target thresholds:**
| Metric | Target |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

### 8b. Supabase Query Performance
Navigate to: **Supabase → Database → Query Performance**  
Look for queries averaging > 500ms. Common culprits:
- `recipe_ingredients` join on large recipes
- Unindexed `group_id` filter on `shopping_list`
- Missing index on `recipes.user_id` for "My Recipes" tab

---

## 9. Security Spot-Check 🔵 (Quarterly)

### 9a. RLS Enabled on All Tables
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
```
**Watch for:** Any row in the result. Every public table must have RLS enabled.

### 9b. No Policies with `USING (true)` (Open Access)
```sql
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true';
```
**Watch for:** Any result here means a table is publicly readable without restriction. Only acceptable for `ingredients` (lookup table) if intentional.

### 9c. Service Role Key Audit
```bash
# Check no client-side files contain the service role key
grep -r "service_role" src/ --include="*.js" --include="*.ts"
```
**Expected:** No results. The service role key must only appear in `.env.local` (server-only).

### 9d. Signed URL Expiry
Supabase signed URLs default to 3600 seconds (1 hour). If recipe images appear broken after ~1 hour, the URL is expiring before the user refreshes.

Check `SecureImage.js` — signed URL TTL should be at least `3600` (1 hour) or `86400` (1 day) for gallery use.

---

## 10. Pre-Deploy Checklist 🟢

Run before every production release:

- [ ] `npm run build` completes with zero errors
- [ ] All environment variables set in Vercel dashboard match `.env.local.example`
- [ ] Regression suite: `node grandmaster_regression_v3.js` — 18/18 PASS
- [ ] Middleware allows `/public/*` without auth
- [ ] Middleware blocks `/recipe/*` without auth
- [ ] `CHANGELOG.md` updated with this release's changes
- [ ] `REQUIREMENTS.md` statuses are current
- [ ] `project_nexus.md` Last Reviewed dates updated

---

## 11. Open Incident Log

Track any production issues that occur, with root cause and resolution:

| Date | Severity | Issue | Root Cause | Resolution |
|---|---|---|---|---|
| — | — | No incidents recorded yet | — | — |

---

## Quick Reference — Supabase Dashboard Links

| Destination | Path |
|---|---|
| SQL Editor | Supabase → SQL Editor |
| Auth users | Supabase → Authentication → Users |
| Storage | Supabase → Storage → recipe-images |
| Query performance | Supabase → Database → Query Performance |
| RLS Policies | Supabase → Authentication → Policies |
| Logs | Supabase → Logs → Postgres / Edge |
| Vercel Logs | Vercel → [Project] → Functions → Logs |
| Gemini Quota | aistudio.google.com → API Usage |
