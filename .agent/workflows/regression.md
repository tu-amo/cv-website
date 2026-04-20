---
description: Automated Regression Suite + Production Deployment
---

# Grandmaster Regression & Deployment Workflow v4.0
**Last Reviewed:** 2026-04-20

This workflow validates all logical, visual, and security layers of the Living Cookbook before production deployment. **Must pass 100% before any `git push`.**

---

## Pre-Flight: Database Sync Check

Before running anything, confirm the live database is in sync:

> ⚠️ `localhost:3000` runs against **staging** (`hbgxotjjpapdqlqrofqz` / living-cookbook-dev).
> Confirm any schema changes needed for the regression have been applied to staging.
> After a production deploy (Step 4), also confirm production has the same schema.

- [ ] `is_public` column exists on `recipes`
- [ ] `updated_by` column exists on `recipes`
- [ ] `recipes_updated_by_fkey` FK constraint is active
- [ ] `"Anyone can see public recipes"` RLS policy is active
- [ ] `nutrition_flags` table exists with `auth_insert_nutrition_flags` policy
- [ ] `auth_insert_ingredients` INSERT policy exists on `ingredients` table

Run this in the [Staging SQL Editor](https://supabase.com/dashboard/project/hbgxotjjpapdqlqrofqz/sql) to confirm:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'recipes' AND column_name IN ('is_public', 'updated_by');
```

---

## Step 1: Automated Logic Suite

Verify the core engine (Parser, Scaler, Metric Aggregation, Visibility, Audit, Budgeting).

// turbo
```bash
node --input-type=module < /Users/janescott/.gemini/antigravity/brain/ad6a946e-f5c8-4097-b608-65c09a182a2d/grandmaster_regression_v3.js
```

**Expected output:** `🏆 GRANDMASTER REGRESSION: 9/9 PASS — 100% COVERAGE`

---

## Step 2: UI/UX & Feature Verification Checklist

Manually verify at `http://localhost:3000`:

### 🔐 Auth & Identity
- [ ] Logged-in homepage shows dynamic title e.g. **"Jane's Cookbook"** (not email address)
- [ ] Top-right avatar shows user initial (e.g. "J") — clicking opens dropdown with Library · Market · Profile Settings · Manage Households · Log Out
- [ ] **Log Out** → page redirects to `/login`, avatar disappears, only "Public" tab visible
- [ ] Log back in → dynamic title returns, all three tabs visible, without needing a page refresh
- [ ] Visit `/` in Incognito mode → **Public tab loads** (homepage `/` is intentionally public in `src/middleware.js`). Only "Public" tab visible, no My Recipes / Household.
- [ ] Visit `/recipe/[any-id]` in Incognito → **redirected to `/login`** (protected route)

### 📖 Recipe Library
- [ ] "My Recipes" tab loads personal recipe cards with food photos
- [ ] Carousel auto-advances every 2.5 seconds on cards with multiple images
- [ ] Images display full-frame (no subject cropping — `object-fit: contain`)

### 📝 Recipe Add/Edit
- [ ] Clicking **+ Add Recipe** opens the add form
- [ ] Visibility UI shows toggle rows: Personal + one row per household + Public toggle — each is an independent pill switch (no dropdown, no scope buttons)
- [ ] "🌍 Publish to Global Gallery" toggle is independent and animated
- [ ] Toggling "Global Gallery" ON + saving stores `is_public = true` in DB
- [ ] "Last modified by [name]" appears on a recipe detail after saving

### 🌍 Public Gallery
- [ ] "Public" tab on homepage shows public recipes
- [ ] Open `/public/recipe/[id]` on a `is_public = true` recipe in Incognito → loads without login
- [ ] Private recipe `/public/recipe/[id]` in Incognito → blocked or empty

### 🏠 Household Sharing
- [ ] "Manage Households" in nav dropdown → households page loads
- [ ] Household tab on homepage shows household recipes when a household is selected in the header
- [ ] Household switcher (header dropdown) changes recipe set without page reload

### 🖼 Image Carousel & AI Brief
- [ ] AI Magic Brief generates TWO images (Mise/prep + Hero/finished dish)
- [ ] Images upload and appear in carousel on both gallery card and detail page
- [ ] Signed URLs contain `?token=` (confirming private bucket)

### 🛒 Market List & Budgeting
- [ ] Navigate to **Market** via nav → market list loads
- [ ] Add same ingredient in two units (500g + 1.5kg) → aggregates correctly to 2kg
- [ ] Budget estimate badge updates correctly
- [ ] Items can be checked off and deleted
- [ ] WhatsApp share button is visible

### 🖨 Print
- [ ] Open a recipe detail → print (Cmd+P) → sidebar/nav hidden, recipe card centred

---

## Step 3: Commit to Feature Branch (Safe Backup)

After passing Step 1 and Step 2, commit your work to the **feature branch** — not `main`. This backs up your changes to GitHub without triggering a production deployment.

```bash
git add .
```

```bash
git commit -m "feat: [describe what you built] — Regression 18/18 PASS"
```

// turbo
```bash
git push origin main
```

✅ **Your work is now backed up to GitHub.**  
✅ **Production (`main`) is untouched.**  
✅ **`localhost:3000` continues running your latest code.**

> Repeat Steps 1–3 after each milestone. Keep committing to the feature branch as you build.

---

## Step 4: Merge to Main (Production Deploy)

Only run this step when **ALL milestones are complete** and you are ready to ship:

- [ ] ✅ Milestone 1 — Household Context Engine done
- [ ] ✅ Milestone 2 — Library Tabs done
- [ ] ✅ Regression suite passes 18/18 on the full build
- [ ] ✅ CHANGELOG.md updated with all changes
- [ ] ✅ Manual UI checklist above fully completed

When ready:

```bash
git checkout main
git merge feature/collab-kitchen-v2
```

// turbo
```bash
git push origin main
```

Vercel will detect the push to `main` and automatically deploy to production.

---

## Step 5: Post-Deployment Audit

Check the live Vercel URL:

- [ ] SSL active
- [ ] Public recipe at `/public/recipe/[id]` loads without login on production
- [ ] Images load from live Supabase storage (signed URLs, not expired)
- [ ] Login and household sharing functional on production
- [ ] Confirm production Supabase schema matches staging: run the drift query from Pre-Flight in the [Production SQL Editor](https://supabase.com/dashboard/project/hiuhjnodzodcgwltweoc/sql) and compare
