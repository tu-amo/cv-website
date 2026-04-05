---
description: Production deployment checklist for Living Cookbook
---

# Living Cookbook — Production Deployment Checklist

Run these steps in order before and after every merge to `main`.

## Pre-Deploy — Local Checks

// turbo
1. Confirm working tree is clean — no uncommitted changes:
```bash
git status --short
```
Expected output: empty. If any files appear, commit or stash them before proceeding.
**Why**: Uncommitted files are invisible to Vercel (LL-022). The live site will silently serve the old committed version.

// turbo
2. Confirm you are on `main` and up to date:
```bash
git log --oneline -5
```

3. Pull and confirm no merge conflicts:
```bash
git pull origin main
```

## Post-Deploy — Vercel Deployment Checks

Wait for the Vercel deployment to complete, then run these checks against the **production URL**.

Set the base URL:
```bash
export BASE_URL="https://living-cookbook.vercel.app"
```

// turbo
4. Protected route redirects without session (auth middleware is running — ADR-011):
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" "$BASE_URL/recipe/00000000-0000-0000-0000-000000000000"
```
Expected: `307` redirect to `/login`. Next.js middleware issues `307` (Temporary Redirect), not `302`.
If `200` is returned, the middleware is not running — **this is a critical security failure**.

// turbo
5. Public nutrition API is accessible without auth (ADR-005):
```bash
curl -s "$BASE_URL/api/nutrition?ingredients=butter" | jq '.butter.per100g.kcal'
```
Expected: A number between 600–800 (butter is ~717 kcal/100g).
If `null`: check `USDA_FDC_API_KEY` in Vercel env vars, or verify the response shape with `jq '.'`.

// turbo
6. Admin cache-flush endpoint is protected (ADR-007):
```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/admin/cache-flush"
```
Expected: `307` redirect to `/login` — the middleware intercepts this route before the handler runs.
If `200`: the middleware is broken — rollback immediately.
Note: `401` is the response if the middleware is bypassed and the route handler handles auth itself (defence-in-depth). Either `307` or `401` is safe; `200` or `204` is not.

7. Public recipe page loads with ingredients (ADR-012 — anon RLS):
Manually open a known public recipe URL in an incognito window.
Expected: Full ingredients list, method steps, and notes are visible without logging in.

8. Check Vercel function logs for errors in the last deployment:
Go to Vercel Dashboard → Project → Functions → Filter by errors in the last 10 minutes.

## Environment Variable Checklist

Confirm these are set in Vercel (Settings → Environment Variables):

| Variable | Scope | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | ✅ — embedded at build time |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | ✅ — embedded at build time |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ✅ — runtime-only; also used as Bearer token for `/api/admin/cache-flush` |
| `USDA_FDC_API_KEY` | Server only | ✅ |
| `OPENAI_API_KEY` | Server only | ✅ — AI brief generation |
| `SENTRY_DSN` | All | ⏳ Pending ADR-010 implementation |

## Rollback Procedure

If a check fails after deployment:

1. Go to Vercel Dashboard → Deployments
2. Find the previous successful deployment
3. Click **Promote to Production**
4. Investigate the failure on a preview deployment before re-deploying to main

## References

- LL-022: Uncommitted files are invisible to Vercel
- LL-023: Eager supabaseAdmin init crashes Vercel builds
- ADR-005: `/api/nutrition` public route exemption
- ADR-007: `supabaseAdmin` lazy Proxy implementation
- ADR-010: Observability and error tracking strategy
- ADR-011: Middleware/Proxy file naming (Next.js 16 migration pending)
- ADR-012: Anon RLS policies for public recipe tables
