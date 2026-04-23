# 🗺️ Long-Term Stability & Deployment Roadmap
## The Living Cookbook

**Created:** 2026-03-30 | **Last Updated:** 2026-04-21 | **Stack:** Next.js 16 · Supabase · Vercel

> **Current reality:** Solo-developer, pre-beta stage. Feature branch workflow (`feature/xxx → main`) provides sufficient safety. Separate environments are deferred until real users exist in production.

---

## Phase Overview

```
Phase 0 (DONE)      → Stabilise localhost dev, close all critical gaps ✅
M1 → M2 → v1.0     → Ship to production via feature branch merge (current focus)
Phase 2 (POST-SHIP) → CI/CD pipeline, automated testing, deployment gates
Phase 1 (BETA)      → Tiered environments — revisit when beta users exist
Phase 3 (LATER)     → Performance & security hardening, monitoring
Phase 4 (LAUNCH)    → Phased marketing rollout
```

---

## Phase 0 — Development Stabilisation ✅ Complete

| Item | Status |
|---|---|
| Auth callback, `/join/[code]`, profiles built | ✅ |
| Image upload working end-to-end | ✅ |
| Recipe save with full RLS | ✅ |
| Regression suite (18/18 PASS) | ✅ |
| `schema_snapshot.sql` canonical and current | ✅ |
| `REQUIREMENTS.md` up to date | ✅ |
| Feature branch strategy adopted | ✅ |

---

## Phase 1 — Tiered Environments *(Deferred — revisit after Beta)*

> **Decision (2026-03-30):** Not necessary at the current solo-developer, pre-beta stage. The feature branch workflow provides sufficient safety. Separate environments introduce double schema maintenance overhead for minimal gain until real users exist in production.

**Trigger conditions to revisit:**
- Beta users are in production and need protection from dev changes
- A second developer joins
- A risky migration needs to be tested before touching real data

**When triggered, implement:**

| Environment | URL | Supabase Project | Branch |
|---|---|---|---|
| **Development** | `localhost:3000` | `living-cookbook-dev` (new) | `develop` |
| **Staging** | `staging.living-cookbook.vercel.app` | `living-cookbook-staging` (new) | `staging` |
| **Production** | `living-cookbook.vercel.app` | `living-cookbook-prod` (current) | `main` |

---

## Phase 2 — CI/CD Pipeline & Automated Testing *(Post-Ship)*

| Gate | Checks |
|---|---|
| PR to `develop` | Lint · Unit tests · Build check · Regression suite |
| Merge to `staging` | All above + Playwright e2e + DB migration dry-run |
| Merge to `main` | All above + Manual approval + Migration + Smoke test |

**Testing strategy:**

| Type | Tool | When |
|---|---|---|
| Unit | Jest | Every PR |
| Regression | `grandmaster_regression_v3.js` | Every PR |
| Integration | Jest + Supabase test client | PRs to staging |
| End-to-end | Playwright | Staging only |
| Performance | Lighthouse CI | Staging only |

---

## Phase 3 — Hardening: Performance, Security & Monitoring

- **Performance:** lazy loading, bundle audit, DB indexes on `user_id`/`group_id`/`invite_code`
- **Security:** full `pg_policies` audit, rate-limiting on `/api/scan` + `/api/brief`, OWASP ZAP scan
- **Monitoring:** Vercel Analytics, Supabase Dashboard, UptimeRobot, optional Sentry

**Rollback procedure:**
```
Vercel: Dashboard → Deployments → Previous → Redeploy
DB:     Run inverse SQL from last migration file
```

---

## Phase 4 — Phased Marketing Rollout

| Tier | Who | Goal |
|---|---|---|
| **Alpha** | Developer + household | Dogfooding, real-world bugs |
| **Beta** | 5–15 invited users | Real feedback, edge cases |
| **Early Access** | Food community | Growth signal, testimonials |
| **General Launch** | Public | Full launch |

**Pre-launch blockers:**
- [ ] Email templates branded
- [ ] Mobile responsive verified (key flows on iPhone)
- [ ] Custom domain configured
- [ ] Privacy policy + Terms of service pages
- [ ] Contact email set up

---

## Milestone Roadmap (Path to v1.0)

| Milestone | What | Status |
|---|---|---|
| **M1** | Household Context Engine — nav switcher + data scoping | ✅ Done (2026-03-31) |
| **M2** | Library Tabs — My Recipes / Household / Public | ✅ Done (2026-03-31) |
| **M3** | Regression Gate + Merge to `main` + Vercel deploy | ✅ Done (2026-04-04) |
| **M4** | Recipe Scaler tools live (6 languages) | ✅ Done (2026-04-10) |
| **M5** | Stripe + subscription tiers | ⏳ Blocked on legal clearance |
| **v1.0** | Beta invite send, monitoring live | ⏳ After M5 |

---

## Tech Debt / Security Backlog

| Priority | Item | Context |
|---|---|---|
| ✅ Done | **Replace `supabaseAdmin` profile upsert in signup with a DB trigger** | **Resolved 2026-04-19** — `on_auth_user_created` trigger (migration 20260419090000) now handles profile creation with `SECURITY DEFINER`. Service role removed from signup. |
| ✅ Done | **Replace RLS bypass in household join flow** | **Resolved 2026-04-21** — `join_household_by_invite_code(p_invite_code)` SECURITY DEFINER function (migration 20260421180000) handles lookup + membership insert atomically using `auth.uid()`. `supabaseAdmin` import removed from `/join/[code]/page.js`. |
| ✅ Done | **Add `display_name` length validation on signup** | **Resolved 2026-04-21** — 100-char server-side guard added to `signup()` in `actions.js`. `maxLength={100}` added to the form input. |

---

## Feature Backlog

Items logged for future implementation — not yet scheduled into a sprint.
**Single source of truth:** This file. `REQUIREMENTS.md` references these IDs in the prioritised feature table.

| # | Feature | Notes | Added |
|---|---|---|---|
| B1 | **Multi-household recipe sharing** | Recipes save one `group_id`. Need a `recipe_groups` junction table (recipe_id, group_id) for sharing to multiple households. UI toggles already done — save/load logic needs updating once schema is migrated. | 2026-04-10 |
| ~~B2~~ | ~~**Source references on recipe & library pages**~~ | **DONE 2026-04-19** — Source block added to recipe detail right panel (book title, author, publisher, page #, last updated by). `sources` table schema fixed (migration 20260419200000). Sources now save and load correctly from both `/add` and `/create`. | 2026-04-16 |
| ~~B3~~ | ~~**Nutrition panel width consistency**~~ | **DONE** — `.recipe-panels` uses `grid-template-columns: 2fr 1fr` which correctly gives the right panel 1/3 width aligned with the Servings triptych cell. | 2026-04-16 |
| ~~B4~~ | ~~**Carousel autoplay speed — increase to 5 seconds**~~ | **DONE 2026-04-19** — Hero carousel `setInterval` bumped from 4000ms → 5000ms in `ImageCarousel.js`. | 2026-04-16 |
| ~~B5~~ | ~~**Recipe edit authorisation guard**~~ | **DONE 2026-04-21** — Three-layer guard in `add/page.js`: (1) `loadRecipe()` verifies auth + ownership via `getUser()` and redirects non-owners before the form renders; (2) `handleSubmit()` re-verifies at save time; (3) `handleDelete()` re-verifies before delete. RLS UPDATE/DELETE policies remain as the DB-level backstop. | 2026-04-16 |
| B6 | **Free Tool: Unit Converter (Imperial → Metric primary)** | New free public tool at `/tools/unit-converter` (+ multilingual slugs). **Metric is the primary system** — metric always shown as the base/left field; imperial converts into it. Imperial side has a **UK / US toggle** since their volume units differ (UK pint = 568 ml, US pint = 473 ml; UK tbsp = 17.76 ml, US tbsp = 14.79 ml). Sections: **Weight** (oz/lb ↔ g/kg — same in UK & US), **Volume** (fl oz/pint/cup/tbsp/tsp ↔ ml/l — UK/US toggle), **Temperature** (°F ↔ °C). Live two-way input (type in either field, metric anchors the default). Follow RecipeScaler multilingual pattern. SEO: `cups to grams`, `ounces to ml`, `fahrenheit to celsius`. | 2026-04-17 |
| B7 | **Dev tooling: Playwright smoke-test script for form verification** | Browser subagent is consistently slow and unreliable for form-heavy flows (`/add` edit, `/create` wizard). Root causes: Next.js dev server cold start, multi-step auth, Supabase round-trips, subagent tool overhead. Proposed fix: `scripts/smoke-test-add.js` (Playwright headless, assumes dev server already running on port 3000) covering the 5 critical add/edit flows in < 30s. Replace subagent usage in refactoring verification checklists. | 2026-04-19 |
| B8 | **`useRecipeForm.js` custom hook** | ⚠️ **Requires B5 (auth guard) + Phase 1 extractions verified stable first.** Lift all data-loading logic out of `add/page.js` (`loadGroups`, `loadRecipe` useEffects) into a reusable hook. Leaves `AddRecipeForm` as a pure rendering coordinator. Defined in `implementation_plan.md` Phase 2. | 2026-04-20 |
| B9 | **`handleSubmit` decomposition** | ⚠️ **Requires integration tests first.** The 180-line snapshot-restore save function (ADR-017) cannot be safely split without test coverage. Blocked until B7 (Playwright) or equivalent test harness exists. Defined in `implementation_plan.md` Phase 2. | 2026-04-20 |
| B10 | **`shopping/page.js` God component decomposition** | 885-line shopping list page — same extraction playbook as `add/page.js` Phase 1. Deferred until Phase 1 verified stable. Defined in `implementation_plan.md` Phase 2. | 2026-04-20 |
| B11 | **`household/page.js` God component decomposition** | 620-line household CRUD page — same playbook. Lowest priority of the Phase 2 items. Defined in `implementation_plan.md` Phase 2. | 2026-04-20 |


---

## Active Engineering Plans

Plans currently in progress — linked documents contain detailed task tracking.

| Plan | Document | Status | Notes |
|---|---|---|---|
| **CSS Architecture Audit** | `.gemini/antigravity/.../implementation_plan.md` (brain artifact) | 🟡 Phases 1–5 complete — **Phase 6 (@media consolidation) next**. AC-4 line count (4,092 → target ≤2,000) outstanding. | AC-4 line count still needs @media consolidation |
| **Business Implementation Plan** | `.gemini/antigravity/brain/.../pretzel_prep_business_plan.md` | 🟡 7/15 sprints complete — Sprint 8 (Launch Strategy) next | Blocked on legal clearance for Stripe |
| **`add/page.js` God Component Decomposition** | `brain/ad6a946e.../implementation_plan.md` | 🟡 **Phase 1 in progress — 1/4 extractions done. `/add` and `/create` source save/load verified ✅ 2026-04-20.** Next: `VisibilityToggle` extraction. Pending after: `IngredientsEditor`, `StepsEditor`. Phase 2 (B8–B11) logged to backlog. | Next: `VisibilityToggle` extraction |


---

## Legal Compliance Cluster (L-series)

**Status:** L1–L4 building now (2026-04-17). L5 (AGB payment terms) blocked until Stripe sprint.  
**Requirement:** German TMG §5 / GDPR / DSGVO / TTDSG.

| # | Item | Requirement | Priority | Added |
|---|---|---|---|---|
| L1 | **Impressum (`/impressum`)** | German TMG §5 — mandatory. Owner name, address, email. Two-click rule via footer. | ✅ Done (2026-04-21) | 2026-04-17 |
| L2 | **Datenschutzerklärung (`/datenschutz`)** | GDPR/DSGVO — mandatory since personal data collected. Disclose: what data, why, processors (Supabase, Vercel, OpenAI, Resend, USDA), user rights. | ✅ Done (2026-04-21) | 2026-04-17 |
| L3 | **SiteFooter with legal links** | Two-click rule — footer on every page via layout.js. Links: Impressum · Datenschutz · AGB · Kontakt. | ✅ Done (2026-04-21) | 2026-04-17 |
| L4 | **Cookie disclosure** | TTDSG/ePrivacy — only essential Supabase auth cookies used, so NO opt-in banner required. Disclose in Datenschutz. | ✅ Done (2026-04-17) | 2026-04-17 |
| L5 | **AGB / Terms of Service (`/agb`)** | Required before Stripe. Payment terms, Widerrufsrecht §312g BGB, liability limits, German governing law. Placeholder live — fill before M5. | 🟠 Before Stripe (M5) | 2026-04-17 |

> ✅ **L1 complete (2026-04-21):** Impressum placeholders replaced with real owner details.
