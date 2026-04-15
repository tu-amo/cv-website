# The Living Cookbook — Requirements Document
**Version:** 3.1  
**Last Updated:** 2026-04-14 (Session: Monetisation — usage tracking gate, tier config, UsageCard, migration 20260414210000)
**Status:** Active — Pre-launch

---

## 1. Product Overview

The Living Cookbook is a personal and collaborative recipe manager. Users can create, organise, and share recipes privately, within a household group, or publicly. The platform supports household formation, invite-based membership, AI-powered image generation, and a shared market (shopping) list.

---

## 2. Functional Requirements

### 2.1 User Identity

| ID | Requirement | Status |
|----|-------------|--------|
| U1 | Users can register with display name, email, and password | ✅ Done |
| U2 | Users can log in and log out | ✅ Done |
| U3 | Display name is collected at sign-up (not inferred from email) | ✅ Done (2026-03-30) |
| U4 | Logged-in user's display name shown in the top nav | ✅ Done (2026-03-30) |
| U5 | Password reset via email | ✅ Done (2026-03-30) |
| U6 | User can update display name and email from profile page | ✅ Done (2026-03-30) |
| U7 | Login page shows inline "resend confirmation email" button when error is "Email not confirmed" | ✅ Done (2026-04-06) |
| U8 | Email confirmation link redirects to `/login?confirmed=true` with a green success banner | ✅ Done (2026-04-06) |
| U9 | Display name entered at sign-up is persisted to `profiles` table immediately (before email confirmation) | ✅ Done (2026-04-06) — uses `supabaseAdmin` to bypass pre-confirmation RLS |

---

### 2.2 Recipes

| ID | Requirement | Status |
|----|-------------|--------|
| R1 | Users can create a recipe (title, source, ingredients, method, tags, images) | ✅ Done |
| R2 | Users can edit their own recipe | ✅ Done |
| R3 | Users can delete their own recipe | ✅ Done |
| R4 | Recipes have a Sharing Scope: Personal or Household | ✅ Done (2026-03-30) |
| R5 | A recipe can be simultaneously in a household AND be public | ✅ Done (2026-03-30) |
| R6 | Visibility stored as two independent flags: `is_public` (bool) + `group_id` (UUID) | ⏳ Pending Supabase Sync |
| R7 | Recipe detail page shows ingredients, method, scaling, timer, and notes | ✅ Done |
| R8 | Recipe images support multi-photo carousel | ✅ Done |
| R9 | Recipes are accessible at a public shareable `/public/recipe/[id]` URL | ✅ Done |
| R10 | Recipe "Last modified by" display name appears on the detail page | ✅ Done (2026-03-30) — pending Supabase sync |
| R11 | AI Magic Brief generates two images (Mise + Hero) from recipe context | ✅ Done (2026-03-30) |
| R12 | AI Brief prompt uses "Modernist Cinematic Editorial" aesthetic with Geometric/Artful plating language | ✅ Done (2026-03-31) |
| R13 | AI Brief includes ingredient prep states (sliced, crushed) and full method steps in Hero prompt | ✅ Done (2026-03-31) |
| R14 | AI Brief API returns clear user-facing toast on 429/503 quota/overload errors | ✅ Done (2026-03-31) |
| R15 | AI Magic Brief end-to-end visual quality testing | ✅ Done (2026-04-04) — confirmed generating successfully in v4.0.0 regression |
| R16 | Cinematic Detail View: Hero image touches metadata bar with editorial text overlay | ✅ Done (2026-03-31) |
| R17 | Metadata Utility Strip: Unified row for Prep, Cook, Serve, and Conversion | ✅ Done (2026-03-31) |
| R18 | Calorie + macro counter on recipe detail page (per serving, expandable breakdown) | ✅ Done (2026-04-03) |
| R19 | Nutrition data sourced from USDA FoodData Central via batched server-side proxy | ✅ Done (2026-04-03) |
| R20 | Nutrition results cached: L1 in-memory + L2 Supabase `nutrition_cache` (90-day TTL) | ✅ Done (2026-04-03) |
| R21 | Users can flag incorrect USDA ingredient matches from the NutritionPanel breakdown table | ✅ Done (2026-04-06) — 🚩 button on hover; writes to `nutrition_flags` table; deduplicates per user+ingredient |
| R22 | Recipe method steps can be reordered via press-hold-and-drag (grip handle replaces ▲▼ buttons) | ✅ Done (2026-04-10) — HTML5 drag API; ghost + amber drop indicator; `reorderSteps` splice logic |
| R23 | Visibility edit section shows toggle-style rows (Personal + one per household + Public) — no dropdown | ✅ Done (2026-04-10) — independent pill switches; Personal clears all others; `selectedGroupIds` Set |

---

### 2.3 Recipe Library (Homepage)

| ID | Requirement | Status |
|----|-------------|--------|
| L1 | Library shows 3 views: "My Recipes" \| "Household" \| "Public" — selected via the left-nav dropdown | ✅ Done (2026-04-08 — tab buttons removed; view driven by `activeView` in HouseholdContext, persisted in localStorage) |
| L2 | "My Recipes" tab shows only recipes owned by the current user | ✅ Done (2026-03-31) |
| L3 | "Household" tab filters by active household context (group_id) | ✅ Done (2026-03-31) |
| L4 | "Public" tab shows all public recipes from all users | ✅ Done (2026-03-31) |
| L5 | "Public" tab is accessible without a login (discovery surface) | ✅ Done (2026-03-31) |
| L6 | Library supports search/filter across visible recipes | ✅ Done |
| L7 | Global branding: "The Living Cookbook" with solid-color refined typography | ✅ Done (2026-03-31) |
| L8 | All interior pages wrapped in `.pp-page-card` — `1200px` max, `20px` radius, consistent shadow and border | ✅ Done (2026-04-10) — Profile, Households, Market, System Info, Edit Recipe |

---

### 2.4 Households

| ID | Requirement | Status |
|----|-------------|--------|
| H1 | Users can create a household with just a name | ✅ Done |
| H2 | Creating a household auto-enrolls the creator as owner | ✅ Done |
| H3 | An invite code is generated on household creation | ✅ Done |
| H4 | A shareable invite link is generated alongside the code | ✅ Done |
| H5 | Users can join a household by entering an invite code | ✅ Done |
| H6 | Clicking a shareable link auto-joins after login | ✅ Done (2026-03-30) |
| H7 | Users can belong to multiple households simultaneously | ✅ Done |
| H8 | Active household selected via a persistent switcher in the top nav | ✅ Done (2026-03-31) |
| H9 | Active household context controls which recipes and market list are shown | ✅ Done (2026-03-31) |
| H10 | Members can leave a household | ✅ Done |
| H11 | Nav switcher updates in real-time when a new household is created (no page refresh) | ✅ Done (2026-03-31) |
| H12 | Owners can remove specific members from their household | ✅ Done (2026-04-08) |
| H13 | Member list is visible to all household members | ✅ Done (2026-04-08) |

---

### 2.5 Market List (Shopping)

| ID | Requirement | Status |
|----|-------------|--------|
| M1 | Users have a personal shopping list (RLS-protected, user-scoped) | ✅ Done + RLS fixed 2026-03-30 |
| M2 | Market list has tabs: Personal / per-Household (one per joined household) | ✅ Done (2026-03-31) |
| M3 | Household list scoped to items with matching group_id | ✅ Done (2026-03-31) |
| M4 | Ingredients aggregate intelligently (e.g. 500g + 1.5kg = 2kg) | ✅ Done |
| M5 | Estimated budget is calculated per session | ✅ Done |
| M6 | List supports copy-to-clipboard and WhatsApp share | ✅ Done |
| M7 | Items can be checked off and deleted | ✅ Done |
| M8 | Items can be reassigned between lists (Personal ↔ Household) via inline ⇄ control | ✅ Done (2026-03-31) |
| M9 | New items added via Quick Add always go to the currently-viewed tab | ✅ Done (2026-03-31) |

---

### 2.6 Monetisation & Usage Gating

| ID | Requirement | Status |
|----|-------------|--------|
| MON-1 | Tier configuration (`src/lib/tiers.js`) — single source of truth for all 4 tiers (free / kitchen_plus / chef / pro_kitchen) with prices, limits, and Stripe price ID placeholders | ✅ Done (2026-04-14) |
| MON-2 | `profiles.tier` column — defaults to `'free'`; updated by Stripe webhook on subscription purchase | ✅ Done (2026-04-14) — migration 20260414210000 |
| MON-3 | `usage_tracking` table — tracks `briefs_used` + `scans_used` per user per calendar month; atomic upsert via `increment_usage()` RPC | ✅ Done (2026-04-14) — migration 20260414210000; RLS verified clean |
| MON-4 | `src/lib/usageGate.js` — server-side gate: auth check → tier read → limit check → atomic increment → standardised error shape (`NOT_AUTHENTICATED` / `LIMIT_REACHED`) | ✅ Done (2026-04-14) |
| MON-5 | `/api/brief` gated — free users: 0 briefs/month (biggest upgrade lever); Kitchen+: 5/month; Chef/Pro Kitchen: unlimited | ✅ Done (2026-04-14) |
| MON-6 | `/api/scan` gated — free users: 5 scans/month; Kitchen+: 30/month; Chef/Pro Kitchen: unlimited | ✅ Done (2026-04-14) |
| MON-7 | Profile page `UsageCard` — shows current tier badge, animated progress meters (normal/warning/full/blocked states) for scans + briefs, monthly reset date, and upgrade CTA | ✅ Done (2026-04-14) |
| MON-8 | `/pricing` page with tier comparison table and Stripe Checkout integration | 🗂 Backlog — Sprint 9 |
| MON-9 | Stripe webhook updates `profiles.tier` automatically on subscription purchase / cancellation | 🗂 Backlog — Sprint 9 |
| MON-10 | Upgrade modal triggered client-side when API returns `429 + code: LIMIT_REACHED` | 🗂 Backlog — Sprint 9 |

---

## 3. Non-Functional Requirements

### 3.1 Security

| ID | Requirement | Status |
|----|-------------|--------|
| S1 | All database access is protected by Row Level Security (RLS) | ✅ |
| S2 | Every table with RLS must have at least one SELECT policy | ✅ |
| S3 | Cross-table RLS lookups must use `SECURITY DEFINER` functions | ✅ |
| S4 | Storage bucket (`recipe-images`) is private; served via signed URLs only | ✅ |
| S5 | Service Role Key must never appear in client-side code | ✅ |
| S6 | All routes except `/public/*`, `/join/*`, `/login`, and `/api/nutrition` require auth | ✅ |
| S7 | New user sign-up is open (no invite required) | ✅ |
| S8 | `supabaseAdmin` (service role) used only in server-only API routes — never in client components | ✅ |
| S9 | Middleware MUST be at `src/middleware.js` with `export function middleware` — Next.js silently ignores any other filename or export name | ✅ Done (2026-04-04 — fixed from `proxy.js` which was silently skipped for the entire feature branch lifecycle) |

### 3.2 Data Integrity

| ID | Requirement | Status |
|----|-------------|--------|
| D1 | Leaving a household immediately revokes access to its shared content | ✅ |
| D2 | Deleting a group cascades and removes all group_members rows | ✅ |
| D3 | `user_id` must be set on all recipes and shopping list items at creation | ✅ |
| D4 | `updated_by` must be set on every recipe save | ✅ Done (2026-03-30) — pending Supabase sync |
| D5 | Invite codes are unique and auto-generated on household creation | ✅ |
| D6 | Recipe ingredient save must use snapshot-restore guard: snapshot existing rows before DELETE; if any INSERT fails, restore snapshot and abort navigation | ✅ Done (2026-04-08) — LL-043; see `src/app/add/page.js` |

### 3.3 Performance

| ID | Requirement | Status |
|----|-------------|--------|
| P1 | Images compressed to ≤1200px / 80% JPEG before upload | ✅ |
| P2 | Recipe and ingredient data fetched in parallel (Promise.all) | ✅ |
| P3 | Skeleton loaders shown during all async data loads | ✅ |
| P4 | All Supabase clients use SSR-aware `createClient()` | ✅ |
| P5 | Public recipe page is an SSR Server Component with 5-minute ISR (`revalidate = 300`) | ✅ Done (2026-04-03) |
| P6 | Nutrition API uses batched request (N ingredients → 1 HTTP call) to avoid N+1 problem | ✅ Done (2026-04-03) |
| P7 | Nutrition data served from Supabase L2 cache on warm requests — no USDA API call | ✅ Done (2026-04-03) |

### 3.4 Scalability & Maintainability

| ID | Requirement | Status |
|----|-------------|--------|
| SC1 | Every migration must include RLS + policies in the same file | ✅ |
| SC2 | Grep for legacy client before any auth change | ✅ (workflow active) |
| SC3 | No unauthenticated Supabase client in codebase | ✅ |
| SC4 | Regression suite must pass 100% before production deployment | ✅ Done (2026-04-04) — 18/18 PASS at v4.0.0 |
| SC5 | SQL sync must be delivered BEFORE code changes that depend on new schema | ✅ (added to /cloud-db-sync workflow 2026-03-30) |
| SC6 | Post-deploy CI health checks automatically run against live URL after every successful Vercel Production deployment | ✅ Done (2026-04-05) — 4 checks via GitHub Actions + `scripts/vercel-checks.js` |
| SC7 | `/system` page (auth-protected) shows build SHA, deploy timestamp, env var health, and Vercel deployment info for rapid deployment diagnostics | ✅ Done (2026-04-05) — accessible from avatar dropdown |
| SC8 | Working tree must be clean (`git status --short` returns empty) before any merge to `main` | ✅ Done (2026-04-05) — mandatory Step 0 in `/publish` and `/deployment-checklist` workflows |
| SC9 | Staging environment (`living-cookbook-dev`) provisioned and isolated from production | ✅ Done (2026-04-06) — separate Supabase project; `.env.local` → staging; prod creds in `.env.local.production` |
| SC10 | `scripts/seed-from-prod.js` available to populate staging from production data | ✅ Done (2026-04-06) — copies nutrition_cache, recipes + child tables; remaps user_id to staging user |
| SC11 | Supabase CLI (`supabase` v2.88.1) manages all schema migrations — `npm run db:new`, `db:push:prod`, `db:push:staging`, `db:status`, `db:diff` | ✅ Done (2026-04-08) — all 16 migrations registered; no more manual SQL editor for schema changes |
| SC12 | CSS styling follows the M3 token system documented in `docs/CSS_ARCHITECTURE.md` — no hardcoded colour hex values; new tokens added to `:root` only | ✅ Done (2026-04-11) — CSS Modernization Phases 1–3; 360 → 23 `!important`; token system fully operative |
| SC13 | All UI-visible icon affordances use `src/components/icons.js` — no emoji as interactive icons; emoji permitted only in toast strings, share text, brand mark | ✅ Done (2026-04-11) — 28-icon library; all pages migrated; see `docs/CSS_ARCHITECTURE.md` §4 |

---

## 4. Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Recipe visibility model | `is_public` (bool) + `group_id` (UUID) | Two independent flags support simultaneous public + household |
| Public toggle | Independent of sharing scope | A recipe can be in a household AND publicly discoverable |
| Audit tracking | `updated_by` UUID → `profiles` | Epistemic credit in shared households |
| Active household state | React context / localStorage | No DB hit on every page load |
| RLS recursion prevention | `SECURITY DEFINER` functions | Breaks circular policy chains |
| Image storage | Private Supabase bucket + signed URLs | Prevents unauthorized photo access |
| Image display | `object-fit: contain` with themed bg | Full composition preserved; no cropping |
| Auth client | `createClient()` from `@supabase/ssr` everywhere | Session cookies passed to all RLS queries |
| Schema sync protocol | SQL artifact first, code second; enforced via Supabase CLI `db:push` | Prevents Cloud DB drift from breaking the app (LL-043) |
| Nutrition data source | USDA FoodData Central (SR Legacy + Foundation) | Ingredient-level lab data vs. Open Food Facts product database |
| Nutrition cache | L1 (in-memory Map) + L2 (Supabase `nutrition_cache`) | Survives cold starts; shared across all Vercel instances |
| Server-only admin client | `src/lib/supabase/admin.js` (Lazy Proxy) | Fire-and-forget DB writes from API routes; lazy init prevents Vercel build crash (LL-023) |
| Public API exemption | `/api/nutrition` excluded from auth middleware | Non-sensitive USDA data; required by unauthenticated public recipe page |
| Admin auth | `SUPABASE_SERVICE_ROLE_KEY` as Bearer token on `/api/admin/*` | No separate ADMIN_SECRET needed — reuses existing runtime-only secret |
| Build-time constants | `NEXT_PUBLIC_BUILD_TIME` + `NEXT_PUBLIC_APP_VERSION` injected via `next.config.mjs` | Enables `/system` page to show accurate build SHA regardless of env vars |
| Architecture Decision Records | `docs/ADR-*.md` (flat, no subdirectory) — ADR-001 through ADR-018 | Formal record of significant decisions with context, trade-offs, and revisit triggers |
| CSS Architecture | `docs/CSS_ARCHITECTURE.md` | M3 token system; typography scale; icon library; heading map; inline style policy |

---

## 5. Prioritised Backlog

> **Sprint hold note (2026-04-14):** Business plan sprints paused at Sprint 7 (Free Tool Strategy complete).
> The Recipe Scaler tool build is the immediate highest-priority item — identified as €0 CAC organic lead generation with 2-day build time (logic already exists). **Sprint 8 (Launch Strategy) resumes after tool is live.**

---

### 🔴 Tier A — Build NOW (this sprint, ~1 week)

*The Recipe Scaler tool + essential conversion infrastructure.*

| Priority | ID | Feature | Effort | Notes |
|---|---|---|---|---|
| 🔴 P0 | TOOL-1 | **Recipe Scaler — shared component** (`src/components/tools/RecipeScaler.js`) — paste input, serving spinners, scaled output using `formatQuantity()` | 1 day | ✅ Done (2026-04-15) |
| 🔴 P0 | TOOL-2 | **Recipe Scaler — English page** (`/tools/recipe-scaler`) — public, no auth, full SEO metadata | 2 hrs | ✅ Done (2026-04-15) |
| 🔴 P0 | TOOL-3 | **Recipe Scaler — German page** (`/tools/rezept-skalieren`) — DE copy + hreflang | 3 hrs | ✅ Done (2026-04-15) |
| 🔴 P0 | TOOL-4 | **Recipe Scaler — Spanish page** (`/tools/escalar-receta`) — ES copy + hreflang | 2 hrs | ✅ Done (2026-04-15) |
| 🔴 P0 | TOOL-5 | **Recipe Scaler — French page** (`/tools/convertir-recette`) — FR copy + hreflang | 2 hrs | ✅ Done (2026-04-15) |
| 🔴 P0 | TOOL-6 | **Recipe Scaler — Italian page** (`/tools/scalare-ricetta`) — IT copy + hreflang | 2 hrs | ✅ Done (2026-04-15) |
| 🔴 P0 | TOOL-7 | **Recipe Scaler — Dutch page** (`/tools/recept-omrekenen`) — NL copy + hreflang | 2 hrs | ✅ Done (2026-04-15) |
| 🔴 P0 | TOOL-8 | **SEO infrastructure** — Schema.org `WebApplication` markup, tools index page at `/tools/` | 3 hrs | ✅ Done (2026-04-15) — sitemap pending |
| 🔴 P0 | TOOL-9 | **Middleware update** — add `/tools/*` to public path exceptions | 30 min | ✅ Done (2026-04-15) |
| 🔴 P0 | TOOL-10 | **CTA: "Save recipe" → pre-fill `/add`** — serialise scaled ingredients to sessionStorage, redirect to `/login?redirect=/add` | 3 hrs | ✅ Done (2026-04-15) — post-login pre-populate `/add` is Tier B |
| 🔴 P0 | **UX-4** | **Empty state for new users** — when `recipes.length === 0`, show guided first-use state with 3 action buttons (Type / Scan / Browse Public) | **2 hrs** | ✅ Done (2026-04-15) |
| 🟠 P1 | **UX-2** | **Mobile experience audit** — verify tool pages + main app on 375px; fix touch targets, textarea sizing, nav accessibility | **1–2 days** | ✅ Done (2026-04-15) |

---

### 🟠 Tier B — Build within 4 weeks (before active promotion)

*Must be live before you post TikToks about the tool or run paid ads.*

| Priority | ID | Feature | Effort | Notes |
|---|---|---|---|---|
| 🔴 P0 | **MON-8** | **Stripe + `/pricing` page** — tier comparison table + Stripe Checkout. Without this, zero revenue from tool signups. | 5–7 days | Sprint 9 |
| 🔴 P0 | **MON-9** | **Stripe webhook** — updates `profiles.tier` on subscription purchase / cancellation | 2–3 days | Sprint 9 |
| 🔴 P0 | **MON-10** | **Upgrade modal** — client-side modal on `429 + LIMIT_REACHED`; links to `/pricing`. Currently shows raw error. | 1–2 days | Sprint 9 |
| 🔴 P0 | **MON-11** | **Nutrition Tier Lock** — restrict USDA nutrition API display and functionality to Kitchen+ tier only. | 0.5 days | Sprint 9 |
| 🔴 P0 | **UX-1** | **User onboarding flow** — 3-step guided first use. Prevents 85%+ bounce from tool-sourced signups who know nothing about the app. | 3–4 days | Pre-advertising P0 |
| 🟠 P1 | **UX-3** | **Error states for AI downtime** — what does a user see if Gemini is unavailable? | 1 day | Pre-advertising |
| 🟠 P1 | **UX-5** | **Email confirmation UX audit** — verify sign-up → confirm → first login flow is frictionless | half day | Pre-advertising |
| 🟠 P1 | **MON-12** | **Party Planner (Kitchen+)** — bridging feature allowing users to stitch together multiple recipes and generate a unified prep list (excludes supplier export). | 3 days | Next Phase |
| 🟠 P1 | **TOOL-12** | **Nutrition SEO Tool** (`/tools/nutrition-calculator`) — public-facing calculator using existing USDA API. Anonymous flagging + rate limiting. | 1.5 days | Sprint 7 Tool 3 |
| 🟠 P1 | **RV1-4** | **Recipe Version Control (Pro Kitchen context)** — snapshotting ingredients+steps on save, version history tab, and one-click rollback. | 4 days | Next Phase |

---

### 🟡 Tier C — Build within 3 months (SEO compound phase)

*Add progressively as tool traffic from each language market grows.*

| Priority | ID | Feature | Effort | Notes |
|---|---|---|---|---|
| 🟡 P2 | **i18n-1** | **German app translation (full)** — German users from the DE tool who sign up deserve a German app. Tool can launch in DE before full app i18n is done. | 3–5 days | After Stripe live |
| 🟡 P2 | **i18n-2** | **Spanish app translation** — Same pattern as German. Much lower effort once i18n infrastructure is set up. | 1–2 days | After DE |
| 🟡 P2 | **TOOL-11** | **Recipe Cost Calculator** (`/tools/recipe-cost-calculator` + DE/ES variants) — targets Pro Kitchen ICP, €0 CAC | 1 week | Sprint 7 Tool 2 |
| 🟡 P2 | **R6** | Apply Supabase sync for `is_public` + `updated_by` fields | half day | Data integrity |
| 🟡 P2 | **R10** | Author/modifier name on recipe card thumbnail | 1 day | Minor UX |
| 🟡 P2 | **B1** | Multi-household sharing — needs `recipe_groups` junction table; UI toggles already done | 2 days | Feature backlog |
| 🟢 P3 | — | Email template branding (Supabase Dashboard) | 1 hr | Pre-deploy, low impact |
| 🟢 P3 | — | Adaptive Thumbnail Research (contain bars) | Future sprint | Low priority |
| 🟢 P3 | **i18n FR/IT/NL** | French, Italian, Dutch **app** i18n — add as tool traffic grows | 2 hrs ea | Language-by-language |

---

### ❌ Deprioritised — Do not build until €5K MRR

*Build on demand from real user requests, not speculation.*

| ID | Feature | Reason |
|---|---|---|
| SL1–4 | Scheduled shopping list templates | Pro Kitchen Phase 2 — no users asking yet |
| SC1–4 | Supplier catalog + price list import | Pro Kitchen Phase 2 — overkill for Phase 1 users |
| PK-Ph2 | Pro Kitchen Phase 2 generally | Wait for real Pro Kitchen user feedback |



---

## 6. Pro Kitchen Requirements

> **Architecture:** A Pro Kitchen is a `group_type = 'pro_kitchen'` group — it inherits all household features as a baseline and unlocks professional workflows on top.
> **ADR:** Decision record TBD (ADR-016 proposed)

### 6a. Foundation — Group Type Gating

These items must be built before any PK feature work. They are the infrastructure that separates household and pro kitchen contexts.

| ID | Requirement | Status |
|----|-------------|--------|
| F-001 | Add `group_type text DEFAULT 'household' CHECK (group_type IN ('household', 'pro_kitchen'))` column to `groups` table | ✅ Done (2026-04-07) |
| F-002 | `HouseholdContext` exposes `isPro` boolean (`activeGroup?.group_type === 'pro_kitchen'`) | ✅ Done (2026-04-07) |
| F-003 | "Manage Households" creation flow branches: **Create Household** vs **Create Pro Kitchen** | ✅ Done (2026-04-07) |
| F-004 | Header switcher pill shows a visual indicator distinguishing households (house SVG icon, amber) from pro kitchens (chef-hat SVG icon, green) | ✅ Done (2026-04-07; icons updated to SVG 2026-04-11) |

### 6b. Pro Kitchen Phase 1 — Production Planning

> Full implementation plan: [task.md](/.gemini/antigravity/brain/ad6a946e-f5c8-4097-b608-65c09a182a2d/task.md)
> **Prerequisite:** F-001 to F-004 complete. PK features gate on `isPro`.

| ID | Requirement | Status |
|----|-------------|--------|
| PK1 | A recipe's detail page has a "Plan Production" button — visible only when active group is a Pro Kitchen | ✅ Done (2026-04-07) |
| PK2 | User can set planned servings, planned date, and assigned team member for a production run | ✅ Done (2026-04-07) |
| PK3 | Stock check screen shows all recipe ingredients scaled to planned servings | ✅ Done (2026-04-07) |
| PK4 | User can enter on-hand quantity for each ingredient (session only — not persisted); quantities can be shown in grams via toggle | ✅ Done (2026-04-07) |
| PK5 | App calculates shortfall per ingredient; rows require manual tick-confirmation before highlight (green = covered, amber = shortfall) | ✅ Done (2026-04-07) |
| PK6 | User can add confirmed shortfall ingredients to the group's kitchen shopping list (tagged `source='plan'`) | ✅ Done (2026-04-07) |
| PK7 | Pro Kitchen shopping list groups items by supplier; each item has a `+ supplier` assignment control with autocomplete | ✅ Done (2026-04-07) |
| PK8 | Each supplier order group has an `Order by` date picker (scheduling) — stored in `supplier_orders.order_date` | ✅ Done (2026-04-07) |
| PK9 | Each supplier order group has `📋 Copy` (email-ready text with user name) + `📄 PDF` (print-to-PDF window) + `Mark as Sent →` (records `ordered_at` timestamp) | ✅ Done (2026-04-07) |
| PK10 | Order list page groups items by supplier; each group has an "Email [Supplier]" button | ✅ Superseded by PK7–PK9 (more complete implementation) |

### Design decisions — Phase 1

| Decision | Choice |
|---|---|
| Stock values | Session-only — on-hand quantities are not persisted |
| Supplier mapping | On-the-fly — built organically from usage, no admin page in Phase 1 |
| Order list | Persistent — one active draft per group across sessions via `supplier_orders` table |
| Activities | Informational label only — `assigned_to` is display-only, no task inbox |
| Access control | All group members equal — no role-based restrictions in Phase 1 |
| Order email | Copy-to-clipboard + PDF download (print-to-PDF) — server never contacts supplier |
| Order attribution | `ordered_by` user's `display_name` included in copy text and PDF header |

### 6b-ii. Pro Kitchen Profile Parameters

A Pro Kitchen can maintain a business profile used in order headers and PDFs.

| ID | Requirement | Status |
|----|-------------|--------|
| PKP1 | Pro Kitchen stores `company_name`, `company_address`, `contact_email` on the `groups` record | ✅ Done (2026-04-08) |
| PKP2 | A Pro Kitchen settings page (accessible from the household management page) allows editing these fields | ✅ Done (2026-04-08) |
| PKP3 | `company_name` and `company_address` appear in the PDF order header | ✅ Done (2026-04-08) |
| PKP4 | `contact_email` (order contact's email) appears in the PDF and copy text | ✅ Done (2026-04-08) |

### 6c. Pro Kitchen Phase 2 — Advanced Features *(Backlog — not yet scheduled)*

> These features extend the Pro Kitchen workspace. Sequencing TBD based on user demand.

#### Scheduled Shopping Lists
| ID | Requirement | Status |
|----|-------------|--------|
| SL1 | A Pro Kitchen can create named shopping list **templates** (e.g. "Monthly dry goods") | 🗂 Backlog |
| SL2 | Each template has a set of items with quantity and unit | 🗂 Backlog |
| SL3 | Templates can be triggered manually to generate a real shopping list | 🗂 Backlog |
| SL4 | Templates have an optional recurrence setting (weekly / monthly) — generates a draft list on schedule | 🗂 Backlog |

#### Supplier Catalog
| ID | Requirement | Status |
|----|-------------|--------|
| SC1 | A Pro Kitchen can add named suppliers with contact email | 🗂 Backlog |
| SC2 | A supplier CSV/PDF price list can be uploaded and parsed into catalog items (ingredient name, unit, price) | 🗂 Backlog |
| SC3 | When building an order list, catalog items are matched to ingredients by name — price is pre-filled | 🗂 Backlog |
| SC4 | Ingredients with no supplier mapping are flagged in the order list | 🗂 Backlog |

#### Recipe Version Control
| ID | Requirement | Status |
|----|-------------|--------|
| RV1 | Every time a recipe is saved inside a Pro Kitchen, a version snapshot (full ingredients + steps JSON) is stored | 🗂 Backlog |
| RV2 | Recipe detail page shows a "History" tab (Pro Kitchen only) with a list of versions and timestamps | 🗂 Backlog |
| RV3 | User can view a specific past version (read-only) | 🗂 Backlog |
| RV4 | User can revert to a past version (replaces current recipe ingredients and steps) | 🗂 Backlog |

---

## 7. Observability Requirements (ADR-010)

> Decision record: [ADR-010](docs/ADR-010-observability-error-tracking.md)

| ID | Requirement | Status |
|----|-------------|--------|
| OBS-001 | Run `npx @sentry/wizard@latest -i nextjs` and commit generated Sentry config files | ✅ Done (2026-04-06) — sentry.server.config.js, sentry.edge.config.js, instrumentation.js, instrumentation-client.js, global-error.jsx committed; tracesSampleRate=0.1, PII disabled |
| OBS-002 | Add `SENTRY_DSN` to Vercel environment variables | ✅ Done (2026-04-06) |
| OBS-003 | Configure Sentry alert rule: notify on error spike (>10 errors/hour) | ✅ Done (2026-04-06) |
| OBS-004 | Create `src/lib/observability.js` with `logNutritionLookup` and `logNutritionAnomaly` functions | ✅ Done (2026-04-06) — also added `logLowConfidenceSkip` |
| OBS-005 | Instrument `/api/nutrition/route.js` — call `logNutritionLookup` on origin hits, `logNutritionAnomaly` after kcal is extracted | ✅ Done (2026-04-06) — all three cache levels (L1/L2/origin) now log; low-confidence skips also logged |
| OBS-006 | Admin cache-flush: `DELETE /api/admin/cache-flush` with Bearer `SUPABASE_SERVICE_ROLE_KEY` guard and `supabaseAdmin` cache clear | ✅ Done (2026-04-05) — endpoint live at `/api/admin/cache-flush`; use: `curl -X DELETE $URL -H "Authorization: Bearer $KEY"` |
| OBS-007 | ~~Add `ADMIN_SECRET` to Vercel env vars~~ | ✅ Superseded — `SUPABASE_SERVICE_ROLE_KEY` is reused as the Bearer token; no separate secret needed |
| OBS-008 | Add `no-restricted-imports` ESLint rule for `@/lib/supabase/admin` to `eslint.config.mjs` | ✅ Done (2026-04-06) — warns on every import with ADR-007 reminder message |
| OBS-009 | Add Supabase schema drift check SQL to a scheduled Vercel cron job | ✅ Done (2026-04-08) — `GET /api/admin/schema-check`; cron runs 06:00 UTC daily via `vercel.json` |

---

## 8. Out of Scope (Current Version)

- Real-world grocery pricing API (currently uses mock pricing)
- AI-driven household meal planning
- Pantry / inventory tracking *(Phase 2 of Pro Kitchen — deferred)*
- Household disbanding by owner
- Real-time market list sync (Supabase Realtime) *(note: nav switcher uses realtime — this refers to live multi-user list co-editing)*
- Focal-point / blurred-backdrop adaptive framing (deferred research)
- Pro Kitchen role-based access control (all members equal in Phase 1)
- **Pretzel Pay** (transaction platform) — Phase 3 of the Pretzel Suite; planned post-€10K MRR
- **Pretzel Press** (cookbook publishing) — Phase 4 of the Pretzel Suite
- SA Retailer API integration — strategic partnership milestone, post-seed funding
