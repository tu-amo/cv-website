---
description: how to publish / deploy the site to production
---

# 🚀 Publishing Workflow
**Last Reviewed:** 2026-05-24

> ⚠️ **All work is committed and pushed directly to `main`.** Never push broken or untested changes to `main`.

> 🔴 **Critical lesson (LL-022):** `npm run dev` reads from disk. Vercel reads from Git. Uncommitted changes are **invisible to Vercel** — always verify with `git status` before any deploy.

---

## Day-to-Day: Commit to Feature Branch

After building and testing locally at `http://localhost:3000`:

### Step 0 — Verify working tree is clean
```bash
git status
```
**Expected output:** Every changed file must appear under "Changes to be committed" or be intentionally untracked.  
**If any file shows as `modified` but not staged** → `git add <file>` before continuing. Do NOT assume the dev server reflects what Vercel will deploy.

1. Run the regression suite — must be 18/18 PASS (`/regression` Step 1)
2. Confirm all manual UI checks pass (`/regression` Step 2)
3. Stage and commit to the feature branch:
   ```bash
   git add .
   git status  # confirm — nothing should remain unstaged
   git commit -m "feat: [describe what changed]"
   git push origin main
   ```
4. Work is backed up to GitHub. Production is untouched.

---

## Production Deploy: Merge to Main

Only when ALL milestones are complete and regression is fully green:

### Step 0 — Pre-flight checklist
```bash
git status        # MUST show "nothing to commit, working tree clean"
git diff HEAD     # MUST show no diff
```
If either command shows changes → **stop, commit them first.**

### Step 1 — Regression + Changelog
1. Confirm checklist in `/regression` Step 4 is fully checked
2. Update `CHANGELOG.md` — move `[Unreleased]` to a version number
3. Verify Vercel environment variables are set (see below)

### Step 1.5 — Database Migrations (Automated)

> 💡 **Branching Automation:** Since we use Supabase Branching with GitHub integration, you no longer need to push migrations to production manually. When you merge your branch into `main` (or push directly to it), Supabase will automatically apply any new migrations in `supabase/migrations/` to the production database.

1. Ensure your local migrations have been applied to your feature branch and tested (`npm run db:push`).
2. Proceed to Step 2 to push to GitHub.

### Step 2 — Push to main
```bash
git push origin main
```

### Step 3 — Monitor Vercel
1. Vercel auto-deploys on push to `main`
2. Watch **Deployments tab** — confirm the new build shows ✅ Ready (not ❌ Error)
3. Build should take 2–5 minutes (a 25-second build likely used stale cache — redeploy without cache if needed)
4. Hard refresh (`Cmd+Shift+R`) the live URL after the build is Ready
5. Verify the live URL shows the expected new design

---

## Vercel Environment Variables Checklist

All of these must be set in **Vercel → Settings → Environment Variables** for Production:

| Variable | Type | Used at |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Build + Runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Build + Runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Runtime only (lazy-loaded via Proxy — LL-023) |
| `USDA_FDC_API_KEY` | Secret | Runtime only |
| `OPENAI_API_KEY` | Secret | Runtime only |

> 💡 `NEXT_PUBLIC_*` vars are embedded at build time — they must be set before building.  
> `SUPABASE_SERVICE_ROLE_KEY` is lazy-loaded and will not crash the build if missing, but the nutrition cache will fail at runtime.
