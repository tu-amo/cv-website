# 📖 Knowledge Capture Log — The Living Cookbook

**Purpose:** Capture patterns, gaps, and engineering decisions encountered while building this app — so they can be distilled into reusable skills that speed up future application builds.

**End Goal:** Every pattern here should eventually live inside a `.agent/skills/` file that any future project can pick up and run with — reducing the cost of solving the same class of problem twice.

**Entry Types:**
- 🐛 **Bug** — something broken that was diagnosed and fixed
- 🔲 **Gap** — a missing feature or design pattern discovered during testing
- 💡 **Pattern** — a deliberate engineering decision worth repeating

**Skill Pipeline:**
```
Observation → Log entry → Cluster by theme → Draft skill → Test on next project
```

---

## Log

---

### LL-001 · RLS Infinite Recursion (42P17)
**Date:** 2026-03-25  
**Symptom:** All database queries failed with Postgres error `42P17 — infinite recursion detected in policy`.  
**Root Cause:** The `group_members` SELECT policy referenced the `group_members` table itself to check membership.  
**Solution:** Replaced with a `SECURITY DEFINER` function (`get_my_group_ids()`).

---

### LL-002 · Silent Data Blackout (RLS with no policies)
**Date:** 2026-03-25  
**Symptom:** Recipe detail page loaded but Ingredients were empty. No error shown.  
**Solution:** Added `SELECT` policies for all auth users.  
**Prevention:** Run drift check after every migration.

---

### LL-003 · Legacy vs SSR Supabase Client Mismatch
**Date:** 2026-03-25  
**Symptom:** `Recipe not found` on detail page after RLS.  
**Root Cause:** Used old static client vs. session-aware SSR client.  
**Solution:** Migrated all `useMemo(() => createClient(), [])` implementations.

---

### LL-006 · Portrait Photos Cropped in Landscape Container
**Date:** 2026-03-27  
**Symptom:** Phone photos appeared heavily zoomed in on detail pages.  
**Root Cause:** `object-fit: cover` fills fixed containers by cropping subject matter.  
**Solution:** Switched to `object-fit: contain` for full-context viewing.

---

### LL-015 · Legacy "Allow Public Access" Policy Overriding Shopping List RLS
**Date:** 2026-03-30  
**Type:** 🐛 Bug (data isolation) — ✅ Resolved  
**Symptom:** New user could see all items from all users.  
**Root Cause:** Stale `FOR ALL USING (true)` policy was never dropped when auth was added.

---

### LL-016 · Forced Full-Frame Framing (Contain vs. Cover)
**Date:** 2026-03-30  
**Type:** 🔲 Gap (UX/Design)  
**Symptom:** Thumbnails zoomed on arbitrary spots (e.g. only a spoon), losing dish context.  
**Root Cause:** Standard browser grid defaults (`cover`) fail for high-value food photography.  
**Solution:** Forced `object-fit: contain` with a themed backdrop.  
**Wait/Research:** While `contain` shows the whole photo, it creates "bars" in grids. **Future research needed on Adaptive Framing** (focal-point detection) to make thumbnails feel premium WITHOUT the subject loss.  

---

### LL-017 · Visibility "Scope vs. Toggle" Architecture
**Date:** 2026-03-30  
**Type:** 💡 Pattern  
**Symptom:** User wanted a recipe both in a household AND public.  
**Root Cause:** Treating "Public" as a mutually exclusive category.  
**Solution:** Split UI into **Sharing Scope** (Private/Household) and an independent **Public Toggle**.  

---

### LL-018 · Metadata Accountability (Last Modified By)
**Date:** 2026-03-30  
**Type:** 💡 Pattern  
**Symptom:** Shared household members didn't know who last changed a recipe.  
**Solution:** Added `updated_by` UUID linked to `profiles`.  
**Pattern:** Collaborative data must carry "Epistemic Credit" — who last touched this truth?

---

### LL-020 · Schema Sync Precedence (The Cloud DB Gap)
**Date:** 2026-03-30  
**Type:** 🐛 Bug (procedural)  
**Symptom:** UI updates broke the app (400 Bad Request) because the frontend asked for columns (`is_public`) that didn't exist in the Cloud database yet.  
**Root Cause:** The AI applied code before delivering the manual SQL sync instructions. In Cloud-Supabase environments, the code relies on a human action that MUST happen before or with the local code update.  
**Prevention:** **Sync SQL MUST come first.** Deliver the SQL Sync artifact *before* or alongside the frontend feature that depends on it.

---

### LL-021 · Nutrition Cache Poisoning via Silent USDA Wrong Match
**Date:** 2026-04-04  
**Type:** 🐛 Bug (data quality) — 🔲 Open  
**Symptom:** A recipe ingredient with no entry in `QUERY_BOOSTS` (e.g. an uncommon variant like "clarified butter") is sent to USDA as a raw string. USDA returns a plausible-looking but wrong top result (e.g. "Butter beans" for "butter"). The wrong kcal/100g value is returned to the user and immediately fire-and-forget written to the Supabase `nutrition_cache` with a 90-day TTL. Every subsequent request for that ingredient hits the cache and returns the wrong value. There is no error, no alert, and no flag — the wrong answer is indistinguishable from a correct one in the UI.

```
User requests "butter" → QUERY_BOOSTS MISS → USDA returns "Butter beans" (347 kcal)
→ 347 kcal cached for 90 days → every recipe shows wrong calorie count
→ No error · No alert · No flag
```

**Root Cause:**
- The `QUERY_BOOSTS` map only covers known problem ingredients; ingredient variants not in the map fall through to raw USDA search  
- USDA's free-text ranking is unreliable for ambiguous terms  
- The fire-and-forget cache write has no correctness guard before writing  
- There is no post-write confidence check on the returned item name vs the requested ingredient name  

**Proposed Fix (not yet implemented — tracked as BUG-001 in REQUIREMENTS.md):**  
1. After USDA responds, compute a simple similarity score between the *returned item name* and the *search term* (e.g. check if the search term appears as a substring of the USDA result name)  
2. If the score falls below a threshold → do not cache; return the data with a `lowConfidence: true` flag  
3. The NutritionPanel can show a ⚠ indicator for low-confidence values instead of displaying them as fact  

**References:** ADR-008 § Trade-offs Accepted ("silent failures"), ADR-004 § Consequences

---

### LL-022 · Uncommitted Files Are Invisible to Vercel
**Date:** 2026-04-05  
**Type:** 🐛 Bug (deployment) — ✅ Resolved  
**Symptom:** Production site showed the old nav header design weeks after the new dropdown `AuthStatus.js` was built and working locally. Every Vercel build succeeded, the test suite passed, and `npm run dev` looked correct — but the live site was unchanged.  
**Root Cause:** `AuthStatus.js` (and `ImageCarousel.js`) were modified on disk and visible to the local dev server but were **never staged or committed**. Vercel clones from GitHub and only sees committed code — it faithfully deployed the old committed version every time.  
**Detection:** `git status` showed `modified: src/components/AuthStatus.js` as "Changes not staged for commit".  
**Solution:** `git add src/components/AuthStatus.js src/components/ImageCarousel.js && git commit && git push`  
**Prevention:** Always run `git status` before merging to `main`. The `/publish` workflow now mandates a clean working tree check as Step 0.  

---

### LL-023 · Eager Supabase Admin Client Crashes Vercel Build
**Date:** 2026-04-05  
**Type:** 🐛 Bug (deployment) — ✅ Resolved  
**Symptom:** Vercel build failed with `Error: supabaseKey is required` at `.next/server/app/api/nutrition/route.js:7:3`. Local builds passed because `.env.local` had all keys; Vercel's build environment did not have `SUPABASE_SERVICE_ROLE_KEY` available at bundle evaluation time (it's a runtime secret).  
**Root Cause:** `src/lib/supabase/admin.js` called `createClient(url, key)` at **module-load time** (top-level code), not inside a request handler. When Next.js bundles the route, it evaluates the module — crashing if the env var is absent.  
**Solution:** Replaced eager singleton with a lazy `Proxy`:
```js
let _client = null;
function getInstance() {
    if (!_client) _client = createClient(url, key); // deferred to first request
    return _client;
}
export const supabaseAdmin = new Proxy({}, { get(_, prop) { return getInstance()[prop]; } });
```
`export const dynamic = 'force-dynamic'` was also added to the route as belt-and-suspenders.  
**Pattern:** Any module that reads `process.env` secrets should **defer to first use**, not initialise at import time.  

---

### LL-024 · Next.js 16 Renamed Middleware to Proxy
**Date:** 2026-04-05  
**Type:** 💡 Pattern  
**Symptom:** Build output shows `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` Routes listed as `ƒ Proxy (Middleware)` in the build summary.  
**Context:** Previous versions of Next.js required `src/middleware.js` with `export function middleware()`. Next.js 16 renamed the concept to "Proxy" and prefers `src/proxy.js` with `export function proxy()`. The old `middleware.js` still works (backwards-compat) but is deprecated.  
**Action Required:** Plan migration of `src/middleware.js` → `src/proxy.js` in a future branch. Until confirmed working with the auth allowlist logic, leave as-is — a deprecation warning does not affect functionality.  
**Related:** ADR-011 — this ADR predates Next.js 16 and is now partially outdated; update when migration is complete.  

---


---

### LL-025 · Supabase Email Templates Bypass /auth/callback by Default
**Date:** 2026-04-06
**Type:** 🐛 Bug (auth) — ✅ Resolved
**Symptom:** User clicks magic link or verification email, arrives on the site but is NOT logged in. They see the public page and get redirected to /login. No error is shown.
**Root Cause:** Supabase's default email templates use `{{ .ConfirmationURL }}` which routes through Supabase's own servers and redirects to the bare Site URL (`https://app.com`). The session tokens arrive as URL hash fragments (`#access_token=...`) which Next.js SSR cannot read server-side — the session exchange never happens.
**Solution:** Update all three Supabase email templates (Confirm Signup, Magic Link, Reset Password) to use direct `/auth/callback` links:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
```
The `/auth/callback` route handles `token_hash + type` correctly via `supabase.auth.verifyOtp()`.
**Pattern:** Supabase email templates must be customised to route through your app's auth callback. Never rely on the default `{{ .ConfirmationURL }}` in an SSR Next.js app.

---

### LL-026 · Supabase Built-in Email Service Has a 3-Email/Hour Rate Limit
**Date:** 2026-04-06
**Type:** 🐛 Bug (operations) — ✅ Resolved
**Symptom:** User tries to reset password; Supabase returns `email rate limit exceeded`. User never receives verification, magic link, or reset emails. No error in the app — just silent nothing in the user's inbox.
**Root Cause:** Supabase's free-tier built-in email service caps at **3 emails per hour per project** across all users. In a real incident: signup verification + magic link + password reset = quota exhausted. The error only surfaces if you check Supabase Auth Logs or actually call the API and read the response.
**Solution:** Replace Supabase's built-in mailer with a proper SMTP provider (Resend). One-time setup; zero rate limits on 3,000 emails/month free tier.
**Emergency bypass:** When rate-limited and a user is stuck, set their password directly via the Supabase admin REST API — no email required:
```bash
curl -X PATCH "https://[project].supabase.co/auth/v1/admin/users/[user-uuid]" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password": "TempPass999!"}'
```
**Pattern:** Never ship a production app on Supabase's built-in email service. Configure a real SMTP provider on day one.

---

### LL-027 · Resend SMTP Setup with Cloudflare DNS
**Date:** 2026-04-06
**Type:** 💡 Pattern
**Context:** Setting up transactional email for a production app via Resend + Cloudflare DNS + Supabase SMTP.
**Steps:**
1. Create Resend account → Add domain → Resend provides 3 DNS records (DKIM TXT, MX, SPF TXT)
2. In Cloudflare: DNS → Records → Add each record with **Proxy = DNS only (grey cloud)** — email records CANNOT be proxied
3. Cloudflare propagates in <5 minutes (much faster than other registrars)
4. Resend: API Keys → Create with "Sending access" permission
5. Supabase: Project Settings → Auth → SMTP Settings → Host: `smtp.resend.com`, Port: `465`, Username: `resend`, Password: `re_...`
**Gotcha:** Set Proxy to DNS only on ALL email records. If orange cloud (proxied) is left on, domain verification fails silently.
**Gotcha:** API keys are shown only once in Resend. Paste directly into the Supabase SMTP password field before doing anything else.
**Free tier:** 3,000 emails/month, 100/day. More than sufficient for a small household app.

---

### LL-028 · Magic Link Users Have No Password
**Date:** 2026-04-06
**Type:** 💡 Pattern
**Symptom:** User logged in via magic link. Later tries to log in normally or follow a household invite link — gets redirected to /login. They have no password to enter. Password reset email may not arrive (LL-026). They are stuck.
**Root Cause:** Supabase magic links authenticate a user without setting a password. The user account is valid but passwordless. If the session expires and no SMTP is configured, recovery is very difficult.
**Solution:** After a user logs in via magic link, direct them immediately to `/login/reset-password` to set a permanent password. The page calls `supabase.auth.updateUser({ password })` which works for any authenticated session — no recovery token required.
**Pattern:** The `/login/reset-password` page works for ANY logged-in user, not just those who came via a recovery email link. This is the universal "set password" screen.
**Prevention:** In the welcome/onboarding flow for any new user, add a visible prompt: "Set a password to avoid needing a magic link each time".

---

### LL-029 · Supabase Site URL Default Points to localhost
**Date:** 2026-04-06
**Type:** 🐛 Bug (configuration) — ✅ Resolved
**Symptom:** Production users receive auth emails whose links point to `http://localhost:3000` instead of the live site. Clicking the link either times out or opens the developer's machine (if it happens to be running).
**Root Cause:** Supabase's default Site URL is `http://localhost:3000` — set during initial project creation. It is never automatically updated when you deploy to production.
**Solution:** Supabase Dashboard → Authentication → URL Configuration → Site URL → set to the production URL (e.g. `https://your-app.vercel.app`). Also add both URLs to the Redirect URLs allow list with `/**` wildcard.
**Prevention:** Add Supabase URL Configuration to the production launch checklist. This must be set before any user attempts to verify their email.

## Patterns & Anti-Patterns Emerging

| Pattern | Anti-Pattern |
|---|---|
| Use `SECURITY DEFINER` to break RLS recursion | Never self-reference a table in its own policy |
| Use SSR-aware Supabase client everywhere | Using the static legacy client in any component |
| Use `object-fit: contain` for food photography | Forcing `object-fit: cover` on artistic/food shots |
| Treat 'Public' as a Toggle, not a Category | Forcing users to choose between 'Household' and 'Public' |
| Deliver SQL Sync FIRST in Cloud DB environments | Updating code without providing the manual schema sync |
| Guard fire-and-forget cache writes with a confidence check | Writing any API response to a long-TTL cache without validating it matches the request |
| **Run `git status` before every deploy** | Assuming local dev server = committed code |
| Init Supabase admin client lazily (Proxy / factory) | Calling `createClient()` at module top-level with runtime-only secrets |
| Check `git status --short` as Step 0 of every production deploy | Merging to main without confirming working tree is clean |
| Customise Supabase email templates to use `/auth/callback?token_hash=...` | Using default `{{ .ConfirmationURL }}` in SSR Next.js apps |
| Configure real SMTP (Resend) before first real user | Relying on Supabase built-in email (3/hour rate limit) |
| Direct magic link users to `/login/reset-password` to set a password | Leaving passwordless users with no recovery path |
| Set Supabase Site URL to production domain before launch | Leaving default `http://localhost:3000` in production |

---

### LL-030 · Schema Snapshot FK Ordering
**Date:** 2026-04-06  
**Type:** 🐛 Bug  
**Symptom:** Running `schema_snapshot.sql` on a fresh Supabase project failed with `relation "groups" does not exist` — the `recipes` table references `groups(id)` but `groups` was defined later in the file.  
**Root Cause:** The schema snapshot was documented in a different order than the original tables were created (they were created gradually in the dashboard, so there was no FK ordering constraint at the time).  
**Solution:** Created `supabase/staging_setup.sql` with tables in strict dependency order: `groups` → `profiles` → `recipes` → child tables.  
**Prevention:** Any new setup SQL file must be tested against a blank project before being committed. FK ordering: create referenced tables first.

---

### LL-031 · Supabase Table Editor Creates BIGINT IDs by Default
**Date:** 2026-04-06  
**Type:** 🐛 Bug  
**Symptom:** Schema snapshot documented `recipes.id`, `recipe_ingredients.id` etc. as `UUID` — but real production columns are `BIGINT`. Every attempt to insert UUID-keyed data into staging failed with `invalid input syntax for type uuid: "989"`.  
**Root Cause:** Supabase's table editor (UI-based table creation) defaults to `bigint GENERATED ALWAYS AS IDENTITY` for primary keys. The schema snapshot was written by inspection rather than `pg_dump`, so the type was incorrectly inferred as UUID.  
**Solution:** Updated `staging_setup.sql` with `BIGINT GENERATED ALWAYS AS IDENTITY` for `recipes` and all FK columns referencing it. Seed script remaps IDs via prod→staging Map.  
**Prevention:** Run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'X'` in production to get the true types before documenting schema.

---

### LL-032 · supabase Client Has No Session at Signup Time
**Date:** 2026-04-06  
**Type:** 🐛 Bug  
**Symptom:** Sign-up correctly collected `display_name` and attempted to `upsert` it to `profiles` — but the profiles table was always empty for new users. No error was thrown.  
**Root Cause:** The regular `supabase` client uses the current session cookie. At sign-up time, the user has not confirmed their email yet — so there is no session. The `profiles_insert` RLS policy (`WITH CHECK (id = auth.uid())`) compares against `auth.uid()` which evaluates to `null` → silent rejection.  
**Solution:** Use `supabaseAdmin` (service role) for the profile `upsert` immediately after `signUp()`. The `id` comes from `signUpData.user.id` (Supabase-generated, never user-supplied), so bypassing RLS is safe here.  
**Prevention:** Any DB write at signup time that targets an RLS-protected table must use the admin client. Use auth `options.data` to also store the name in user metadata as a belt-and-suspenders fallback.

---

### LL-033 · PostgREST Schema Cache Doesn’t Auto-Refresh After Schema Changes
**Date:** 2026-04-06  
**Type:** 🐛 Bug  
**Symptom:** After dropping and recreating the `ingredients` table and adding a FK back, the app threw `"Could not find a relationship between 'recipe_ingredients' and 'ingredients' in the schema cache"`.  
**Root Cause:** PostgREST pre-loads the DB schema at startup and caches it. DDL changes (DROP TABLE, ALTER TABLE ADD CONSTRAINT) are not reflected until the cache is reloaded.  
**Solution:** Run `NOTIFY pgrst, 'reload schema';` in the Supabase SQL Editor, or trigger via Supabase Dashboard → API → Reload.  
**Prevention:** After any schema change (migration, staging setup, manual ALTER), reload the PostgREST schema cache before testing the app.

---

### LL-034 · Seed Script Must Be Idempotency-Guarded
**Date:** 2026-04-06  
**Type:** 💡 Pattern  
**Symptom:** Seed script was run twice (second run followed a failed first run that had already inserted recipes). Resulted in 12 recipes (6 with ingredients, 6 without) — a partially-seeded state that was harder to recover from than an empty database.  
**Root Cause:** First run failed mid-way (after inserting recipes but before recipe_ingredients). Second run inserted 6 more recipes. Deleting the duplicate set left orphaned recipe rows with no child data.  
**Solution:** Added a pre-flight check at the top of the seed script: if `recipes` table has any rows, abort with an instructions message to `DELETE FROM recipes` first. Also: fix schema BEFORE running seed — don't iterate on schema and seed simultaneously.  
**Prevention:** All seed scripts must: (1) check for existing data and abort or truncate first; (2) be idempotent via `ON CONFLICT DO NOTHING` or explicit truncate+reseed pattern.

---

## Skill Pipeline

| Skill | Source Entries | Covers |
|---|---|---|
| `supabase-rls-patterns` | LL-001, 002, 015, 032 | SECURITY DEFINER, audit queries, cleaning legacy policies, signup-time RLS bypass |
| `nextjs-supabase-auth` | LL-003, 007, 012, 023, 025, 028, 029 | SSR client, `usePathname` auth tracking, email OTP callback, lazy admin client, email template fix, magic link password, site URL config |
| `food-photo-display` | LL-006, 016 | Aspect ratio strategy, object-fit contain vs cover, future research goals |
| `vercel-deployment-checklist` | LL-020, 022, 023 | Pre-flight git status, eager init crash, env var availability at build time |
| `supabase-staging-setup` | LL-030, 031, 033, 034 | Schema ordering, bigint vs UUID IDs, PostgREST cache reload, idempotent seeds |
