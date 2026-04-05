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

---

## Skill Pipeline

| Skill | Source Entries | Covers |
|---|---|---|
| `supabase-rls-patterns` | LL-001, 002, 015 | SECURITY DEFINER, audit queries, cleaning legacy policies |
| `nextjs-supabase-auth` | LL-003, 007, 012, 023 | SSR client, `usePathname` auth tracking, email OTP callback, lazy admin client |
| `food-photo-display` | LL-006, 016 | Aspect ratio strategy, object-fit contain vs cover, future research goals |
| `vercel-deployment-checklist` | LL-020, 022, 023 | Pre-flight git status, eager init crash, env var availability at build time |
