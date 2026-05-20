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
| Deliver SQL Sync FIRST in Cloud DB environments | Updating code before providing the manual schema sync |
| Guard fire-and-forget cache writes with a confidence check | Writing any API response to a long-TTL cache without validating it matches the request |
| **Run `git status` before every deploy** | Assuming local dev server = committed code |
| Init Supabase admin client lazily (Proxy / factory) | Calling `createClient()` at module top-level with runtime-only secrets |
| Check `git status --short` as Step 0 of every production deploy | Merging to main without confirming working tree is clean |
| Customise Supabase email templates to use `/auth/callback?token_hash=...` | Using default `{{ .ConfirmationURL }}` in SSR Next.js apps |
| Configure real SMTP (Resend) before first real user | Relying on Supabase built-in email (3/hour rate limit) |
| Direct magic link users to `/login/reset-password` to set a password | Leaving passwordless users with no recovery path |
| Set Supabase Site URL to production domain before launch | Leaving default `http://localhost:3000` in production |
| **Fix CSS specificity at the source — never add a FIX block** | Adding `!important` to override a rule that already used `!important` |
| **Use `next/font` for all typefaces — never duplicate with CDN `@import`** | Adding `@import url(fonts.googleapis.com/...)` when `layout.js` already loads that font |
| **All UI icon affordances use `Icon.*` from `icons.js`** | Using emoji (🛒, 🗑, 🏠) as button/nav/status icons |
| **Brand docs reference CSS token names, not hardcoded hex values** | Writing `#1a2421` in a brand guide that will become stale after the next palette change |

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


### LL-059 · `sources` Table: Schema/Code Mismatch + Silent Error Swallowing
**Date:** 2026-04-19
**Type:** 🐛 Bug (data) — ✅ Resolved
**Severity:** High — source data feature broken since it was first built
**Symptom:** Saving a recipe with any source fields (Book Title, Author, Publisher, URL) appeared to succeed but stored nothing. Re-opening the recipe showed all source fields empty.
**Root Causes (three compounding):**
1. **Column name mismatch:** `sources` table had legacy columns (`name`, `url`, `page`) from initial dashboard creation. Application code used canonical names (`book_title`, `link`, `page_number`) and a `publisher` column that didn't exist. Postgres silently rejected every insert with HTTP 400, but code never destructured `{error}`.
2. **Missing FK constraint:** `recipes.source_id` had no declared FK to `sources.id`, so PostgREST couldn't auto-resolve the `sources(*)` join in `loadRecipe`. The join returned null on every query.
3. **Silent error swallowing:** All three source save/update paths (`add/page.js` × 2, `RecipeWizard/index.js` × 1) called `await supabase.from('sources').insert(...)` without destructuring `error`. Any failure was completely invisible.

**Fix:**
- Migration `20260419200000_fix_sources_schema.sql`: `ADD COLUMN book_title`, `publisher`, `link`, `page_number`; migrate legacy data; `ADD CONSTRAINT recipes_source_id_fkey`
- All 3 save paths: added `{error: srcErr}` + `showToast()` + `console.error()`
- `loadRecipe`: changed `sources(*)` → `sources!source_id(*)`

**Rule:**
- **Every Supabase mutation must destructure `{error}`.** Fire-and-forget `await supabase.from(...).insert()` without error check is never acceptable.
- **Every FK relationship must have a declared constraint.** Without it, PostgREST cannot resolve joins.
- When a feature silently doesn't work, check in order: (1) does the column exist with the right name? (2) is the FK constraint declared? (3) is the error being surfaced?

---

### LL-060 · PostgREST Join Returns Null When FK Column Name Doesn't Follow Convention
**Date:** 2026-04-19
**Type:** 🐛 Bug (query) — ✅ Resolved
**Symptom:** `loadRecipe` used `.select('*, sources(*)')` but sources always returned `null` even after the FK constraint was added.
**Root Cause:** PostgREST auto-detects FK joins using the convention `tableName_id`. When the FK column is `source_id` (not `sources_id`), auto-resolution fails silently — the join returns null, not an error.
**Solution:** Use an explicit FK hint: `sources!source_id(*)` instead of `sources(*)`.
**Rule:** When a Supabase join returns null and you expect data, add the explicit hint syntax: `related_table!fk_column_name(*)`. Required when: (a) the FK column name doesn't follow `tableName_id` convention, or (b) multiple FKs exist between the same two tables.

---

## Skill Pipeline

| Skill | Source Entries | Covers |
|---|---|---|
| `supabase-rls-patterns` | LL-001, 002, 015, 032 | SECURITY DEFINER, audit queries, cleaning legacy policies, signup-time RLS bypass |
| `nextjs-supabase-auth` | LL-003, 007, 012, 023, 025, 028, 029 | SSR client, `usePathname` auth tracking, email OTP callback, lazy admin client, email template fix, magic link password, site URL config |
| `food-photo-display` | LL-006, 016 | Aspect ratio strategy, object-fit contain vs cover, future research goals |
| `vercel-deployment-checklist` | LL-020, 022, 023 | Pre-flight git status, eager init crash, env var availability at build time |
| `supabase-staging-setup` | LL-030, 031, 033, 034 | Schema ordering, bigint vs UUID IDs, PostgREST cache reload, idempotent seeds |
| `recipe-seed-data` | LL-031, 035, 036, 037 | Correct column names, bigint ids, ingredient_id=null pattern, DO block debugging |
| `css-architecture` | LL-044, 045, 046, 047, 048 | M3 token system, !important elimination, icon library, font double-load, brand doc freshness |

---

### LL-035 · recipe_ingredients Uses bigint FKs, Not UUID (2026-04-07)
**Date:** 2026-04-07
**Type:** 🐛 Bug (schema) — ✅ Resolved
**Symptom:** Seed SQL declared `r1 uuid` to capture `RETURNING id` from recipes, causing FK type mismatch when passed to `recipe_ingredients.recipe_id`.
**Root Cause:** As documented in LL-031, `recipes.id` is `bigint`, and so are all FK columns referencing it in child tables. The schema_snapshot still incorrectly shows these as UUID.
**Canonical column types (verified 2026-04-07):**
- `recipes.id` → `bigint` (identity)
- `recipe_ingredients.recipe_id` → `bigint` nullable
- `recipe_ingredients.ingredient_id` → `bigint` nullable
- `instruction_steps.recipe_id` → `bigint` nullable
- `instruction_steps.instruction_text` → `text` (NOT `instruction`)

---

### LL-036 · Seeding Recipes — Skip ingredient_id, Use display_name (2026-04-07)
**Date:** 2026-04-07
**Type:** 💡 Pattern — ✅ Established
**Context:** Seeding recipes via SQL without knowing `ingredients.id` values.
**Solution:** `recipe_ingredients.ingredient_id` is nullable. The app renders ingredients from `display_name` alone. Skip the catalog JOIN entirely — avoids type mismatches and constraint errors.
```sql
INSERT INTO recipe_ingredients (recipe_id, quantity, unit, sort_order, display_name) VALUES
(r1, 400, 'g', 1, 'Flour'),   -- ingredient_id omitted (NULL)
(r1, 2, 'tsp', 2, 'Salt');
```
**Template:** `supabase/seeds/recipe_seed_template.sql`

---

### LL-037 · DO Block Silent Rollback With No Visible Error (2026-04-07)
**Date:** 2026-04-07
**Type:** 🐛 Bug (debugging) — ✅ Resolved
**Symptom:** `DO $$` block showed "Success" in the SQL editor but no rows appeared in the table.
**Root Cause:** A type mismatch inside the block triggered a rollback. The Supabase SQL editor sometimes swallows mid-block errors and shows "Success" for the outer `DO` statement.
**Debug Method:** Run the failing INSERT outside the DO block as a bare statement to surface the real error.
**Prevention:** Always run `SELECT ... ORDER BY created_at DESC LIMIT 5` immediately after to confirm rows were actually committed.

---

### LL-038 · Null User Guard in Auth Mutation Handlers (2026-04-07)
**Date:** 2026-04-07
**Type:** 🐛 Bug — ✅ Resolved
**Symptom:** `Cannot read properties of null (reading 'id')` at `user.id` immediately after a successful Supabase write (creating a second group right after the first).
**Root Cause:** `supabase.auth.getUser()` returned `{ user: null }` during a brief network hiccup. No guard existed before accessing `user.id`.
**Rule:** Every async mutation handler that calls `getUser()` must null-check before using `user.id`:
```js
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) { setError("Session unavailable — please refresh."); return; }
```
Apply to: createGroup, joinGroup, leaveGroup, and any future mutation handler.

---

### LL-039 · recipe_ingredients Actual Columns (No row_type, No preparation_note) (2026-04-07)
**Date:** 2026-04-07
**Type:** 🐛 Bug (schema drift) — ✅ Resolved
**Symptom:** Editing any recipe threw `Could not find the 'preparation_note' column` on every ingredient save.
**Root Cause:** `add/page.js` used `preparation_note` and `row_type` in its INSERT, but neither column exists. The actual columns are `preparation` and `section`.
**Verified columns for recipe_ingredients (2026-04-07):**

| Column | Type |
|---|---|
| `id` | uuid |
| `recipe_id` | bigint |
| `display_name` | text |
| `quantity` | numeric |
| `unit` | text |
| `preparation` | text |
| `section` | text |
| `sort_order` | integer |
| `ingredient_id` | bigint |

**Pattern for section headers:** No `row_type` column exists. Section headers are saved as ingredient rows with `section = '__header__'`. Regular ingredient rows inherit the `section` label of their nearest preceding header.

---

### LL-040 · PostgREST .neq() Excludes NULL Rows (2026-04-07)
**Date:** 2026-04-07
**Type:** 🐛 Bug (data) — ✅ Resolved
**Symptom:** Stock check page showed "No ingredients found" for all seeded recipes despite the rows existing in the DB.
**Root Cause:** PostgREST `.neq("section", "__header__")` translates to SQL `WHERE section != '__header__'`. In SQL, `NULL != '__header__'` evaluates to `NULL` (not `TRUE`), so rows where `section IS NULL` are silently excluded.
**Solution:** Fetch all rows from Supabase, then filter client-side:
```js
// ❌ Excludes NULL rows:
.neq("section", "__header__")

// ✅ Correct — filter in JS where null !== '__header__' is true:
ings.filter(i => i.section !== "__header__")
```
**Rule:** Never use `.neq()` when the column can be NULL and you want to include the NULL rows. Always filter nullable columns client-side or use `.or("col.is.null,col.neq.value")`.

---

### LL-041 · NutritionPanel Silent Failure When ingredient_id Is NULL (2026-04-08)
**Date:** 2026-04-08
**Type:** 🐛 Bug (data) — ✅ Resolved
**Symptom:** NutritionPanel did not render at all on staging for newly seeded recipes, despite ingredient rows existing in the DB.
**Root Cause:** The recipe page fetches `recipe_ingredients` with `select("*, ingredients(name)")`. When `ingredient_id IS NULL` (all manually-added/seed recipes), the Supabase join returns `ing.ingredients = null`. NutritionPanel then tried `ing.ingredients?.name` (null) then `ing.name` (column doesn't exist — it's `display_name`). All names came back as `""`, so `names.length === 0` → early return → `results` stayed `[]` → panel returned `null`.
**Solution:** Added `ing.display_name` as intermediate fallback in both name-extraction lines:
```js
// Before
ing.ingredients?.name || ing.name || ''

// After
ing.ingredients?.name || ing.display_name || ing.name || ''
```
**Rule:** Always include `display_name` as fallback when reading ingredient names. `ingredient_id` may be null for any recipe not imported via the ingredients master table. Never rely solely on `ing.name` — that column does not exist on `recipe_ingredients`.

---

### LL-042 · Schema Changes Without a Numbered Migration File Are Invisible at Deploy Time (2026-04-08)
**Date:** 2026-04-08
**Type:** 🔧 Process — ✅ Resolved
**Symptom:** After deploying v5.0.0 (Pro Kitchen sprint), a schema comparison revealed that production was missing `groups.group_type`, `recipe_ingredients.section`, and the entire `production_plans` table — all of which had been in dev/staging for weeks.
**Root Cause:** The F-001 migration (`group_type`) and PK1/PK2 schema (`production_plans`, `section`) were implemented directly in the staging init script (`staging_setup.sql`) and never written into a numbered file under `supabase/migrations/`. When deploying, we only check `supabase/migrations/` for new SQL to apply — anything outside that folder is invisible and silently never reaches production.
**Solution:** Applied the missing SQL manually to production and wrote a catch-up migration file `20260408_prod_catchup_group_type_section_plans.sql` for tracking. Updated OBS-009 schema-check snapshot to include the affected columns so future drift is caught by the daily cron.
**Rule:** **Every schema change — no matter how small — must get a numbered migration file in `supabase/migrations/` at the time of implementation.** The `staging_setup.sql` is an init-only convenience script; it is not a migration tracking mechanism. No migration file = no prod deploy.

```
✅ Correct flow:
  1. Write SQL as supabase/migrations/YYYYMMDD_describe_change.sql
  2. Apply to staging
  3. Apply to production at deploy time

❌ Wrong:
  - Edit staging_setup.sql only
  - Run SQL directly in Supabase dashboard without committing a migration file
  - "I'll write the migration file later"
```

---

---

### LL-043 · Delete-Before-Insert on recipe_ingredients Caused Silent Data Wipe (2026-04-08)
**Date:** 2026-04-08
**Type:** 🔴 Data Loss — ✅ Resolved
**Severity:** Critical — affected all 4 production recipes (full ingredient history wiped)
**Symptom:** User moved a recipe to another household and saved. Multiple "⚠️ Could not save ingredient" toasts appeared. On reload, all ingredients were gone. All 4 production recipes found to have empty ingredient lists.
**Root Cause (two layered):**
1. **Schema mismatch**: prod `recipe_ingredients` has `preparation_note` (original schema); code inserts `preparation` (dev schema name). PostgREST returned HTTP 400 on every ingredient row. The `section` column was also missing from prod until 2026-04-08.
2. **Unsafe delete-first pattern**: Save ran `DELETE WHERE recipe_id = editId` *before* the inserts. Once any insert fails, the old rows are gone and no new rows were inserted. The per-ingredient toast fired but did not abort the save.

**Fix:**
- Snapshot existing `recipe_ingredients` *before* delete. If ANY insert fails after the delete: remove partial rows, re-insert the snapshot, abort navigation with ❌ error.
- Applied `ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS preparation TEXT` to production.
- Recovered ingredient data for recipes 2, 5, 6 from staging. Recipe 1 (Classic Lemon Garlic Pasta) required manual re-entry.

**Rule:** Never run DELETE before INSERT on child rows without a snapshot-restore guard. Safe pattern:
```
snapshot → update parent → delete children → insert new children
→ on any insert failure: delete partials, restore snapshot, abort
```

---

### LL-044 · !important Cascade Debt Compounds Until It's Unworkable (2026-04-11)
**Date:** 2026-04-11  
**Type:** 💡 Pattern  
**Symptom:** `globals.css` had 360 `!important` declarations. Adding any new style required adding another `!important` to override an existing one. Small style changes caused unexpected layout regressions across unrelated components.  
**Root Cause:** Every time a style didn't work as expected, a developer added `!important` to force it — rather than identifying which CSS rule was winning the specificity race. Over many sessions, this created a cascade arms-race where the only way to win was to escalate.  
**Fix:** FIX override blocks (blocks of `!important` rules added later to correct earlier rules) must be merged back into their source component rules. Fix the selector hierarchy, not the declaration.  
**Outcome:** 360 `!important` reduced to 23 legitimate uses (94% reduction) over 5 targeted passes. The 23 remaining are all architecturally valid: `@media print`, `@media (prefers-reduced-motion)`, JS-driven animation overrides.  
**Rule:** The presence of a FIX block in CSS is a debt signal. Each one should trigger a source fix within the same session, not deferred.

---

### LL-045 · Font Double-Load via next/font + Google Fonts CDN (2026-04-11)
**Date:** 2026-04-11  
**Type:** 🐛 Bug (performance) — ✅ Resolved  
**Symptom:** Poppins and Nunito were loading twice on every page: once via `next/font` in `layout.js` (self-hosted, optimal) and again via a `@import url('https://fonts.googleapis.com/...')` at the top of `globals.css`. This doubled font request count and caused a flash of unstyled text (FOUT) on the CDN load.  
**Root Cause:** `next/font` handles font self-hosting silently at build time. A developer (or initial CSS scaffold) added an `@import` to `globals.css` without knowing `layout.js` already loaded the same fonts.  
**Solution:** Removed the `@import` from `globals.css`. `next/font` continues to serve self-hosted fonts with no change needed.  
**Rule:** If `layout.js` uses `next/font` for a typeface, that font **must not** appear in any `@import` in `globals.css`. Check `layout.js` font declarations before adding any CDN font import. The comment at the top of `§A — Fonts` in `globals.css` now includes a warning: `Poppins & Nunito are self-hosted via next/font in layout.js — do NOT add @import`.

---

### LL-046 · Emoji as UI Icons Create Accessibility and Consistency Gaps (2026-04-11)
**Date:** 2026-04-11  
**Type:** 💡 Pattern  
**Context:** The app used ~60 UI-visible emoji (🛒, 📋, 🗑, 🏠, 🍳, 👥, 👑, 🔔) as button labels, status indicators, and interactive affordances across all pages.  
**Problems discovered:**  
1. **Cross-platform rendering inconsistency** — emoji render at different sizes, shapes, and colours on macOS vs Windows vs Android. The same 🏠 emoji looks completely different on iOS vs Chrome on Android.  
2. **Cannot be styled** — emoji ignore `color`, `font-size` (inconsistently), `stroke`, `fill`. You cannot change their colour to match a design system token.  
3. **Accessibility gaps** — emoji are read by screen readers in full ("house emoji", "pot of food") with no control over the aria label. An SVG icon with `aria-hidden="true"` defers to the button's text label instead.  
4. **No design system governance** — any developer can add any emoji for any purpose with no shared library to enforce consistency.  
**Solution:** Created `src/components/icons.js` — a shared inline SVG library (28 icons, Lucide paths, MIT). All UI-visible emoji replaced. Toast string emoji (🎉, 📋) intentionally kept — they are content, not affordances.  
**Rule:** Emoji are permitted only in: toast/success/error strings, WhatsApp share text, and the 🥨 brand mark. All interactive icon affordances must use `Icon.*` from `icons.js`.

---

### LL-047 · Escaped Quotes in Import Paths Break the Next.js Parser (2026-04-11)
**Date:** 2026-04-11  
**Type:** 🐛 Bug (build) — ✅ Resolved  
**Symptom:** Build failed with `Parsing ecmascript source code failed` / `Expected unicode escape` pointing to the import line in `add/page.js`. Dev server also refused to compile the file.  
**Root Cause:** An automated sed replacement script used escaped single quotes (`\'`) in the replacement string, which produced `import { Icon } from \'@/components/icons\'` in the file. The Next.js ECMAScript parser (SWC/Babel) rejected this as invalid syntax — it expected a proper string literal, not escaped quotes.  
**Solution:** Replaced the escaped-quote import with a standard double-quoted import: `import { Icon } from "@/components/icons"`  
**Prevention:** Always verify file output immediately after any automated find-replace script with `grep -n "import.*icons" src/app/add/page.js`. If the file uses escaped quotes, the script's quoting logic is wrong. Never use `\'` inside a replacement string that targets JavaScript source code.

---

### LL-048 · Brand Guide Drifts From Implementation When CSS Evolves (2026-04-11)
**Date:** 2026-04-11  
**Type:** 🔲 Gap (documentation)  
**Symptom:** `BRAND_GUIDE.md` listed **DM Sans** as the body font and `#1a2421` (deep olive green) as the background — but the actual app used **Nunito** (body) + **Poppins** (headings) and `#121010` (near-black charcoal). CSS token names were also wrong (`--color-bg-deep-olive` doesn't exist; the token is `--color-bg`). The guide had never been updated since it was first extracted from the codebase in March 2026.  
**Root Cause:** Brand guide hex values and token names were documented at a point in time. The M3 CSS token migration changed the palette (olive → charcoal), renamed tokens, and corrected font choices — but the brand guide was not on the update checklist for that session.  
**Fix:** Updated `BRAND_GUIDE.md` v1.1 to reflect actual tokens, correct fonts, and the new icon system reference.  
**Rule:** The `/update-docs` workflow must include `BRAND_GUIDE.md` as a check whenever the CSS token system or typography changes. Brand docs that reference hex values are inherently fragile — they should reference CSS token names, not hardcoded values, and point to `CSS_ARCHITECTURE.md` as the canonical source.

---

### LL-049 · New Pages Built With Custom Wrapper Classes Diverge From Card-Surface Standard (2026-04-15)
**Date:** 2026-04-15  
**Type:** 🏗 Architecture — ✅ Resolved  
**Symptom:** Tool pages (`/tools/recipe-scaler` etc.) looked flat compared to every other interior page. They used a custom `.page` CSS module class instead of the global `pp-page-card` shell.  
**Root Cause:** No documented rule existed for the outer page shell. Without documentation, the custom class was used as a reasonable default.  
**Fix:** Replaced `styles.page` with `className="pp-page-card"` on all tool pages. Added a "Page Layout Shells" section to `css-architecture/SKILL.md` with DOM path table, examples, and a Page Audit Checklist item.  
**Rule:** All new interior pages must use `pp-page-card` as the outermost JSX div. Audit checklist: `[ ] Outermost JSX div uses pp-page-card — not a custom class or plain div`.

---

### LL-050 · Next.js App Router Requires `metadataBase` for Absolute hreflang and OG URLs (2026-04-15)
**Date:** 2026-04-15  
**Type:** 🐛 Bug (SEO) — ✅ Resolved  
**Symptom:** hreflang alternate URLs in `<head>` were relative paths instead of absolute URLs. Google cannot use relative hreflang.  
**Root Cause:** `metadataBase` not set in `src/app/layout.js`. Without it, Next.js cannot resolve relative paths in `metadata.alternates.languages` to absolute URLs.  
**Fix:** Added `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pretzelprep.com')` to root layout metadata. Fixes all pages site-wide in one change.  
**Rule:** Every Next.js App Router project must set `metadataBase` in root `layout.js`. Read from `NEXT_PUBLIC_SITE_URL` env var so staging and production both work without code changes.

---

### LL-051 · Google Search Console Rejects Sitemap When Root Domain Redirects to www (2026-04-15)
**Date:** 2026-04-15  
**Type:** 🐛 Bug (deployment) — ✅ Resolved  
**Symptom:** GSC rejected `sitemap.xml` with "Invalid sitemap address" even though `pretzelprep.com/sitemap.xml` loaded in the browser and DNS was fully green globally.  
**Root Cause:** Vercel had `www.pretzelprep.com` as Production and `pretzelprep.com` redirecting (307) → www. GSC does not follow redirects when validating sitemaps — it requires a direct HTTP 200 at the exact submitted URL.  
**Fix (immediate):** Submitted `https://www.pretzelprep.com/sitemap.xml` instead. GSC accepted it immediately.  
**Fix (long-term):** Make naked domain (`pretzelprep.com`) the Vercel Primary and `www` the redirect — standard canonical setup.  
**Rule:** Never submit a sitemap URL that involves a redirect. GSC requires a direct 200. Make the naked domain the Vercel Production primary domain.

---

### LL-052 · Production Migration History Was Never Seeded — db:push:prod Replayed All History on Every Run (2026-04-15)
**Date:** 2026-04-15  
**Type:** 🐛 Bug (deployment process) — ✅ Resolved  
**Symptom:** Every `npm run db:push:prod` tried to replay all 18 migrations from day one against the live production database, failing on migration 1 because it referenced a column (`created_at` on `recipe_ingredients`) that had since been removed from that table's structure.  
**Root Cause:** The production Supabase project was built entirely through the dashboard SQL editor — never through the CLI. The migration tracking table (`supabase_migrations.schema_migrations`) was always empty on production, so the CLI treated every migration as unapplied every time.  
**Why it persisted:** Each new migration file was committed to git, but `db:push:prod` was never successfully completed because of the replay failure. Code was deployed to Vercel while the DB remained unmanaged by the CLI.  
**Fix:** Ran `supabase migration repair --status applied <version>` for all 18 historical migrations to seed the tracking table without re-running any SQL. Added `db:repair:prod` npm script to `package.json` for reproducibility.  
**Verification:** `npm run db:status` now shows Local = Remote for all 18 migrations. Future `db:push:prod` runs will only process genuinely new migrations.  
**Prevention:**  
1. Any new project using the Supabase CLI must run `supabase link` and create the first migration via the CLI from day one — never bootstrap schema via the dashboard  
2. After any manual SQL applied to production (emergency fixes), immediately run `supabase migration repair --status applied <version>` to keep tracking in sync  
3. Run `npm run db:status` before every deploy to confirm Local = Remote  
4. ⚠️ Schema gate rule: never commit schema-dependent code to `main` without running `db:push:prod` first — state this explicitly before every git push that includes a migration

---

### LL-053 · Use `grid-template-areas` When Visual Column Order Must Override DOM Order (2026-04-15)
**Date:** 2026-04-15
**Type:** 💡 Pattern — ✅ Resolved
**Symptom:** Reordering ingredient row columns (`checkbox | name | prep | qty | basket` → `checkbox | qty | name | prep | basket`) broke the layout. Changing the DOM order caused the basket button to appear second (right after checkbox) because it had no explicit `order` value and defaulted to `order: 0`, tying with the checkbox. Using CSS `order` alone was unreliable because `.ingredient-item` had three separate conflicting definitions across `globals.css` blocks.
**Root Cause:** The same `.ingredient-item` class was defined three times in `globals.css` — once with `display: flex`, once with `display: grid`, once with only padding overrides. Any approach relying on DOM order or CSS `order` was fragile against this cascade conflict. Specifically: unset `order` values default to `0`, causing the basket button to visually tie with the checkbox and appear second in the row.
**Solution:** Used `grid-template-areas` with explicit `grid-area` on each child:
```css
.ingredient-item {
    display: grid;
    grid-template-columns: 28px auto 1fr auto 36px;
    grid-template-areas: "cb qty name prep cart";
}
.ingredient-item > .checkbox            { grid-area: cb;   }
.ingredient-item > .ingredient-qty      { grid-area: qty;  }
.ingredient-item > .ingredient-name     { grid-area: name; }
.ingredient-item > .ingredient-prep     { grid-area: prep; }
.ingredient-item > .ingredient-cart-btn { grid-area: cart; }
```
**Rule:** When visual column order must differ from DOM order — especially where multiple CSS blocks define the same class — use `grid-template-areas`. It is explicit, immune to cascade conflicts, and does not require all children to have correct `order` values.
**Anti-pattern:** Using CSS `order` without setting it on ALL children. Any child with no explicit `order` defaults to `0` and silently appears at the front of the layout alongside other `order: 0` elements.


---

### LL-054 · CSS Grid `1fr` Columns Require `min-width: 0` on Children to Actually Shrink
**Date:** 2026-04-16  
**Type:** 🐛 Bug (layout) — ✅ Resolved  
**Symptom:** Ingredient names wrapped to multiple lines at narrow viewports (580px) even though the column was `1fr` — every word on its own line, effectively zero width.  
**Root Cause:** Grid items have `min-width: auto` by default — they cannot shrink below the width of their longest word. A `1fr` column only distributes *free space*. If a child's `min-width: auto` claims more space than the `1fr` allocation, the column cannot shrink. Neighbouring `auto` columns then consume all available width.  
**Solution:**
```css
.ingredient-name {
    grid-area: name;
    min-width: 0;  /* allows 1fr to shrink below content minimum */
}
```
**Rule:** Any `1fr` column containing text that must wrap needs `min-width: 0` on the child. This is the most common cause of "1fr doesn't work" layout bugs. Applies to: text columns, flex children inside grid cells, images with natural minimum widths.

---

### LL-055 · Automated CSS Batch Merger "Last Occurrence Wins" Picks the Wrong Canonical
**Date:** 2026-04-16  
**Type:** 🐛 Bug (tooling) — ✅ Resolved  
**Symptom:** After a batch merger eliminated 56 duplicate CSS class definitions, three visual regressions appeared: `.recipe-panels` collapsed from grid to flex (breaking the nutrition sidebar), `.step-number` badge numbers were no longer centred, and ingredient columns appeared in wrong grid positions.  
**Root Cause:** The script kept the "last occurrence in document order." Last position ≠ intended canonical. A file may be structured as:
```
[A] canonical definition (full, correct)    ← position 2800
[B] responsive override (partial)           ← position 3100  ← script kept this ❌
[C] legacy FIX block (obsolete)             ← position 3400
```
The script also failed on **multi-line property values** (e.g. `linear-gradient(...)` spanning 4 lines) — compressing them into broken one-liners that corrupted adjacent rules.  
**Safe automated merge process:**
```
1. Duplicate detector identifies candidates
2. Human reviews and marks the winner: /* CANONICAL */
3. Script keeps /* CANONICAL */, deletes others
4. npm run build → visual spot-check → THEN commit
```
**Potential skill:** `css-automated-cleanup` — safe batch CSS operations, multi-line value preservation, post-run verification.

---

### LL-056 · Orphaned CSS Properties After One-Liner Compression Attach to the Next Rule
**Date:** 2026-04-16  
**Type:** 🐛 Bug (tooling) — ✅ Resolved  
**Symptom:** `.ingredient-text` inherited unexpected `flex-direction: column` despite never declaring it.  
**Root Cause:** The batch merger compressed single-property blocks to one-liners, leaving bare declarations floating:
```css
.recipe-stat-info-group { display: flex; }
flex-direction: column;   /* ← orphaned — browser applies to NEXT rule */
```
**Detection gate (run after any automated CSS transform):**
```bash
grep -n "^[[:space:]]*[a-z-]*:[^/]" globals.css | grep -v "{"
```
Any match is an orphaned declaration. Fail hard — do not commit until clean.

---

### LL-057 · Mixing `grid-area` and `grid-column` on the Same Element Is a Maintenance Trap
**Date:** 2026-04-16  
**Type:** 💡 Pattern — ✅ Resolved  
**Symptom:** Compound rule `.ingredient-item > .ingredient-name { grid-area: name }` placed the cell correctly, but standalone `.ingredient-name { grid-column: 2 }` created invisible ambiguity — anyone reading only the standalone rule saw an incorrect column.  
**Root Cause:** `grid-area` is shorthand for all four grid placement longhands. When both `grid-area` (compound) and `grid-column` (standalone) exist on the same element, the declared intent is contradictory, regardless of which wins specificity.  
**Rule:** When a compound selector uses `grid-area`, ALL standalone rules for the same class must also use `grid-area`. Never mix the two placement mechanisms:
```css
/* ❌ Mixed — invisible conflict */
.ingredient-item > .ingredient-name { grid-area: name; }
.ingredient-name { grid-column: 2; }

/* ✅ Consistent */
.ingredient-item > .ingredient-name { grid-area: name; }
.ingredient-name { grid-area: name; min-width: 0; }
```

---

### LL-058 · Technical Debt Compounds When Planning Documents Are Fragmented
**Date:** 2026-04-16  
**Type:** 🔲 Gap (process) — ✅ Resolved  
**Symptom:** Backlog items existed in 3 places: `REQUIREMENTS.md` (B1 only), a brain artifact (B1–B5, not in git), and inline in `project_nexus.md`. B2–B5 were invisible to anyone opening the repository.  
**Root Cause:** No documented rule for WHERE to log a backlog item. Brain artifacts are convenient in-session but live outside version control — invisible in git history and to collaborators.  
**Fix:** Created `docs/ROADMAP.md` as the single source of truth. Added Step 2 to `/update-docs` workflow. Codified in `CATALOGUE.md`: *"All B-series items go in ROADMAP.md first, then a summary row in REQUIREMENTS.md. Never in a brain artifact only."*  
**The consolidation hierarchy:**
```
docs/ROADMAP.md      ← full detail + notes (single source of truth)
REQUIREMENTS.md      ← summary rows (P2) with link → ROADMAP.md
project_nexus.md     ← catalog entry + active plan status
brain artifacts      ← scratch/working notes ONLY — always mirrored before session end
```
**Potential skill:** `documentation-hygiene` — single-source-of-truth rules for backlog, active plan tracking, brain artifact mirroring.

---

## Patterns & Anti-Patterns Emerging

| Pattern | Anti-Pattern |
|---|---|
| Use `SECURITY DEFINER` to break RLS recursion | Never self-reference a table in its own policy |
| Use SSR-aware Supabase client everywhere | Using the static legacy client in any component |
| Use `object-fit: contain` for food photography | Forcing `object-fit: cover` on artistic/food shots |
| Treat 'Public' as a Toggle, not a Category | Forcing users to choose between 'Household' and 'Public' |
| Deliver SQL Sync FIRST in Cloud DB environments | Updating code before providing the manual schema sync |
| Guard fire-and-forget cache writes with a confidence check | Writing any API response to a long-TTL cache without validating it |
| **Run `git status` before every deploy** | Assuming local dev server = committed code |
| Init Supabase admin client lazily (Proxy / factory) | Calling `createClient()` at module top-level with runtime-only secrets |
| Customise Supabase email templates to use `/auth/callback?token_hash=...` | Using default `{{ .ConfirmationURL }}` in SSR Next.js apps |
| Configure real SMTP (Resend) before first real user | Relying on Supabase built-in email (3/hour rate limit) |
| Direct magic link users to `/login/reset-password` to set a password | Leaving passwordless users with no recovery path |
| Set Supabase Site URL to production domain before launch | Leaving default `http://localhost:3000` in production |
| **Fix CSS specificity at the source — never add a FIX block** | Adding `!important` to override a rule that already used `!important` |
| **Use `next/font` — never duplicate with CDN `@import`** | Adding `@import url(fonts.googleapis.com/...)` when layout.js already loads that font |
| **All UI icon affordances use `Icon.*` from `icons.js`** | Using emoji (🛒, 🗑, 🏠) as button/nav/status icons |
| **Brand docs reference CSS token names, not hardcoded hex values** | Writing `#1a2421` in a brand guide that will become stale |
| **Add `min-width: 0` to any `1fr` grid child containing text** | Assuming `1fr` will shrink below `min-width: auto` — it won't |
| **Mark canonical CSS with `/* CANONICAL */` before any automated merge** | Running "last occurrence wins" scripts on files with mixed canonical/override blocks |
| **Validate CSS output for orphaned properties after any transform** | Committing batch-merged CSS without running a bare-declaration grep check |
| **Use `grid-area` consistently — never mix with `grid-column` on the same element** | Compound selector uses `grid-area`; standalone uses `grid-column` — silent conflict |
| **Always destructure `{error}` from every Supabase mutation** | `await supabase.from().insert()` without error check — silent data loss |
| **Use explicit FK hint `table!fk_col(*)` when PostgREST join returns null** | Assuming `related_table(*)` will auto-resolve for non-conventional FK names |
| **All B-series backlog items go in `docs/ROADMAP.md` first, then REQUIREMENTS.md** | Logging backlog only in brain artifacts or inline in another document |
| **`position: fixed` is its own containing block — never add `position: relative` to the same rule** | Adding `position: relative` after `position: fixed` in the same CSS rule (last declaration wins, fixed is lost) |
| **Give SVG overlays `pointer-events: none` whenever interactive children sit behind them in the DOM** | Rendering an SVG above clickable buttons without `pointer-events: none` — the SVG silently swallows all clicks |

---

### LL-061 · `position: relative` Silently Overrides `position: fixed` When Both Appear in the Same Rule
**Date:** 2026-05-20
**Type:** 🐛 Bug (CSS) — ✅ Resolved
**Symptom:** The timer widget disappeared from its fixed bottom-right position after a CSS fix was applied. The widget was no longer overlaid on the page — it appeared inline in the document flow.
**Root Cause:** `position: fixed` was declared at line 1679 of `.timer-widget`. A subsequent fix added `position: relative` at line 1692 of the **same rule block** with the comment `/* ← required: anchors .timer-close absolute positioning */`. CSS last-declaration-wins: `position: relative` silently overrode `position: fixed`, removing the viewport-relative positioning entirely. The mistake was compounded by a well-intentioned but incorrect assumption that `position: relative` is needed to establish a containing block for `position: absolute` children.
**Why the assumption was wrong:** `position: fixed` elements already act as containing blocks for `position: absolute` children in all modern browsers (Chrome 90+, Firefox, Safari). No additional `position: relative` is needed or correct on a `position: fixed` element.
**Fix:** Removed `position: relative` from `.timer-widget`. The SVG click-swallow bug (LL-062) was the actual cause of the close button not working — not a missing containing block.
**Rule:** Never add `position: relative` to an element that already has `position: fixed` or `position: absolute`. `fixed` and `absolute` are self-sufficient containing blocks. If two `position` declarations exist in the same rule block, only the last one applies — search for duplicates before adding any `position` declaration.

---

### LL-062 · SVG Overlay Without `pointer-events: none` Silently Swallows All Clicks
**Date:** 2026-05-20
**Type:** 🐛 Bug (CSS/interactivity) — ✅ Resolved
**Symptom:** The timer widget's ✕ close button appeared visually correct and had `z-index: 1` and `e.stopPropagation()` in its `onClick`, but clicking it had no effect — the timer neither closed nor paused. The `onClose is not a function` TypeError later confirmed the click never reached the React handler at all on the public page; on the authenticated page the SVG swallowed the click before `stopPropagation` could fire.
**Root Cause:** `.timer-ring-svg` was `position: absolute; inset: 12px` — covering nearly the full card face. By default SVG elements receive pointer events (`pointer-events: auto`). The SVG sat above the `timer-close` button in the paint order (rendered after it in the DOM, same stacking context), so every click on the close-button area was intercepted by the SVG and discarded.
**Why `z-index: 1` and `stopPropagation` didn't help:** `stopPropagation` only stops event *bubbling up* the DOM tree. It cannot prevent the SVG from capturing a click that never reached the button in the first place. `z-index` on the close button was `1` — the same as the SVG's stacking level — so paint order (DOM order) determined the winner, and SVG won.
**Fix:**
```css
.timer-ring-svg {
    pointer-events: none; /* SVG must not swallow clicks meant for close button or card body */
}
.timer-close {
    z-index: 10; /* safely above SVG and timer-inner */
}
```
**Also found:** The `TimerWidget` component was used in two places (`/recipe/[id]/page.js` and `PublicRecipeClient.js`). The authenticated page had never been updated to the new prop API (`onToggle`, `onClose`, `totalSeconds`); it still passed the old `onClick` with no `onClose`, causing a separate TypeError. Both issues were fixed in the same commit.
**Rule:** Any decorative SVG, canvas, or overlay element rendered above interactive children must have `pointer-events: none`. Default `pointer-events: auto` on layered SVGs is the most common invisible interactivity killer in card-based UIs.

---

## Skill Pipeline

| Skill | Source Entries | Covers |
|---|---|---|
| `supabase-rls-patterns` | LL-001, 002, 015, 032 | SECURITY DEFINER, audit queries, cleaning legacy policies, signup-time RLS bypass |
| `nextjs-supabase-auth` | LL-003, 007, 012, 023, 025, 028, 029 | SSR client, email OTP callback, lazy admin client, email template fix, magic link, site URL config |
| `food-photo-display` | LL-006, 016 | Aspect ratio strategy, object-fit contain vs cover |
| `vercel-deployment-checklist` | LL-020, 022, 023 | Pre-flight git status, eager init crash, env var availability at build time |
| `supabase-staging-setup` | LL-030, 031, 033, 034 | Schema ordering, bigint vs UUID IDs, PostgREST cache reload, idempotent seeds |
| `recipe-seed-data` | LL-031, 035, 036, 037 | Correct column names, bigint ids, ingredient_id=null pattern, DO block debugging |
| `css-architecture` | LL-044, 045, 046, 047, 048, 053, 054, 057, 061, 062 | M3 token system, !important elimination, icon library, font double-load, grid-area canonical, min-width:0 grid children, position:fixed containing block, SVG pointer-events |
| **`supabase-schema-hygiene`** *(new — draft)* | **LL-059, 060, 042, 033** | **Schema/code mismatch patterns, silent error swallowing, PostgREST FK hints, FK constraint requirements, migration file discipline** |
| **`css-automated-cleanup`** *(new — draft)* | **LL-055, 056** | **Safe batch CSS operations: canonical marking, multi-line value preservation, orphaned-property detection, post-transform verification gate** |
| **`documentation-hygiene`** *(new — draft)* | **LL-058** | **Single-source-of-truth rules for backlog, active plans, brain artifact mirroring, cross-document linking** |
