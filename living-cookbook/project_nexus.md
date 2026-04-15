# Project Nexus: Living Cookbook
**Version:** 4.5 | **Updated:** 2026-04-15 | **Branch:** `main`  
**Status:** Tier A complete — Recipe Scaler live (6 languages, EN/DE/ES/FR/IT/NL), UX-4 empty state shipped. Next: UX-2 mobile audit, then Tier B (Stripe + onboarding — requires legal clearance).

---

## 🎯 What This App Is

A secure, household-aware recipe manager with AI-powered photo generation, dual-moment photography, and granular visibility controls. Multi-user, invite-based households. Recipes can be personal, shared within a household, and/or published to a public global gallery — these are independent settings.

---

## 🏗 Architecture

| Layer | Technology | Key Files |
|---|---|---|
| Framework | Next.js 14 (App Router) | `src/app/` |
| Database | Supabase (PostgreSQL + RLS) | `supabase/migrations/`, `supabase/schema_snapshot.sql` |
| **Migration Management** | **Supabase CLI v2.88.1** | **`package.json` (`db:new`, `db:push:prod`, `db:push:staging`, `db:status`, `db:diff`)** |
| Auth | `@supabase/ssr` + middleware | `src/lib/supabase/middleware.js`, `src/app/auth/callback/route.js` |
| Secure Media | Supabase Storage (private bucket) | `src/components/SecureImage.js` |
| **Household State** | **React Context + Supabase Realtime** | **`src/lib/HouseholdContext.js`** |
| AI Scanning | Gemini Vision via `/api/scan` | `src/app/api/scan/route.js` |
| AI Image Gen | Gemini Flash via `/api/generate-image` | `src/app/api/generate-image/route.js` |
| AI Brief | Two-image brief generator | `src/app/api/brief/route.js` |
| **Nutrition Proxy** | **USDA FoodData Central — L1+L2 cache-aside** | **`src/app/api/nutrition/route.js`** |
| Rules Engine | Custom parsing + scaling utilities | `src/lib/recipe-utils.js` |
| **Unit Conversion** | **Weight + volume + countable → grams** | **`src/lib/ingredient-to-grams.js`** |
| **Admin DB Client** | **Service role client for server-only writes** | **`src/lib/supabase/admin.js`** |
| **Usage Gating** | **Tier-based AI feature limits — atomic increment via Postgres RPC** | **`src/lib/usageGate.js`, `src/lib/tiers.js`** |
| Styling | Vanilla CSS — M3 design token system | `src/app/globals.css` (tokens), `src/app/themes/pretzelprep.css` (palette) |

---

## 🗂 Active File Map

### Pages
| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.js` | Library / recipe gallery |
| `/add` | `src/app/add/page.js` | Add/Edit recipe + AI brief + visibility |
| `/recipe/[id]` | `src/app/recipe/[id]/page.js` | Recipe detail (auth required) |
| `/public/recipe/[id]` | `src/app/public/recipe/[id]/page.js` | Public recipe view (no login) |
| `/shopping` | `src/app/shopping/page.js` | Market list + budget |
| `/household` | `src/app/household/page.js` | Household management |
| `/join/[code]` | `src/app/join/[code]/page.js` | Invite link handler |
| `/login` | `src/app/login/page.js` | Login + signup |
| `/profile` | `src/app/profile/page.js` | Display name update |
| **`/tools/`** | **`src/app/tools/page.js`** | **Free tools index — public, no auth** |
| **`/tools/recipe-scaler`** | **`src/app/tools/recipe-scaler/page.js`** | **Recipe Scaler — EN** |
| **`/tools/rezept-skalieren`** | **`src/app/tools/rezept-skalieren/page.js`** | **Recipe Scaler — DE** |
| **`/tools/escalar-receta`** | **`src/app/tools/escalar-receta/page.js`** | **Recipe Scaler — ES** |
| **`/tools/convertir-recette`** | **`src/app/tools/convertir-recette/page.js`** | **Recipe Scaler — FR** |
| **`/tools/scalare-ricetta`** | **`src/app/tools/scalare-ricetta/page.js`** | **Recipe Scaler — IT** |
| **`/tools/recept-omrekenen`** | **`src/app/tools/recept-omrekenen/page.js`** | **Recipe Scaler — NL** |

### Key Components
| Component | Purpose | Last Reviewed |
|---|---|---|
| `HouseholdContext.js` | Global active-kitchen state + Realtime subscription. Wrap in `layout.js`. | 2026-03-31 |
| `ImageCarousel.js` | Gallery + hero carousel (`objectFit: contain`, 2.5s rotation) | 2026-03-30 |
| `SecureImage.js` | Supabase Storage signed URL resolver | 2026-03-30 |
| `RecipeHeader.js` | Title + source + "Last modified by" credit | 2026-03-30 |
| `ImageManager.js` | AI brief generation + image upload manager | 2026-03-31 |
| `AuthStatus.js` | Branding ('The Living Cookbook') + Nav + switcher pill/dropdown | 2026-03-31 |
| `NutritionPanel.js` | Per-serving calorie + macro display; expandable ingredient breakdown | 2026-04-03 |
| `PretzelNav.js` | Global nav sidebar (drawer + icon items). Uses `Icon.*` from `icons.js`. | 2026-04-11 |
| **`tools/RecipeScaler.js`** | **Shared free tool component — paste → parse → scale → output. Client-side only. Uses `smartParseIngredient` + `formatQuantity`.** | **2026-04-15** |
| `icons.js` | Shared SVG icon library — 28 icons, 24×24 viewBox, Lucide paths, zero npm dep. `Icon.{name}` static 18px; `makeIcon()` for custom sizes. | 2026-04-11 |

### Database
| File | What it does |
|---|---|
| `supabase/schema_snapshot.sql` | Canonical reference of the full live DB state |
| `supabase/migrations/20260325103000_add_groups_and_household_sharing.sql` | Groups + group_members schema |
| `supabase/migrations/20260330120000_add_profiles.sql` | Profiles table + trigger |
| `supabase/migrations/20260330140000_refine_visibility.sql` | `is_public` + `updated_by` + FK constraint |
| `supabase/migrations/20260403232959_add_nutrition_cache.sql` | `nutrition_cache` table + public SELECT RLS |
| `supabase/migrations/20260404220000_allow_anon_read_recipe_images.sql` | Anon SELECT on `storage.objects` (recipe-images bucket) |
| `supabase/migrations/20260404221500_allow_anon_read_public_recipe_data.sql` | Anon SELECT on `recipe_ingredients`, `instruction_steps`, `recipe_notes`, `ingredients`, `sources` for public recipes |

---

## 📁 Document & Workflow Map

This is the single reference for every artifact in the project. **If you don't know which document to use, start here.**

### Project Documents (in `living-cookbook/`)

| Document | Location | Use It When... | Last Reviewed |
|---|---|---|---|
| **This file** — Project Nexus | `project_nexus.md` | You need a fast orientation to the project: architecture, file map, what everything is | 2026-04-03 |
| **Requirements** | `REQUIREMENTS.md` | You want to see what features are done, pending, or out of scope | 2026-04-10 |
| **Changelog** | `CHANGELOG.md` | You're deploying — log every change before merging to `main` | 2026-04-10 |
| **Schema Snapshot** | `supabase/schema_snapshot.sql` | You need to check what the database should look like, or run a drift check | 2026-04-03 |
| **README** | `README.md` | Onboarding a new dev — setup steps, env vars, scripts | 2026-04-03 |
| **Architecture Decision Records** | `docs/ADR-*.md` | You need to understand *why* a decision was made, its trade-offs, and when to revisit. ADR-001 through ADR-018. | 2026-04-11 |
| **CSS Architecture Guide** | `docs/CSS_ARCHITECTURE.md` | You are making any styling change. Token system, heading map, icon library, utility classes, decision tree. | 2026-04-11 |

### Agent Docs (in `.agent/docs/`)

| Document | Use It When... | Last Reviewed |
|---|---|---|
| `LESSONS_LEARNT.md` | A bug is fixed or a pattern is discovered — log it immediately | 2026-03-30 |
| `CATALOGUE.md` | A new document is added or retired — update this index | 2026-03-27 |
| `ONBOARDING_ARCHITECTURE.md` | You're touching auth, invite links, or the signup flow | 2026-03-30 |
| `META_ANALYSIS.md` | Reviewing developer skill gaps, collaboration patterns, or planning a learning sprint | 2026-03-30 |
| `BRAND_GUIDE.md` | Design principles, palette, and imagery mood | 2026-03-31 |
| `FLOW_PROMPT_GUIDE.md` | AI image generation templates for Google Flow | 2026-03-31 |

### Workflows (in `.agent/workflows/`)

| Workflow | Run It When... | Last Reviewed |
|---|---|---|
| `/regression` | You're about to commit or deploy. Full QA gate — see below. | 2026-04-10 |
| `/cloud-db-sync` | You're making a code change that needs a new DB column or policy — **run this first** | 2026-04-10 |
| `/db-migration` | Full safety checklist for any schema change (now CLI-based) | 2026-04-10 |
| `/publish` | Final production deploy (only after `/regression` passes) | 2026-04-10 |
| `/update-docs` | After any deployment — keeps REQUIREMENTS, CHANGELOG, project_nexus in sync | 2026-04-10 |
| `/restart` | Local dev server is broken or port 3000 is stuck | 2026-04-10 |

### Skills (in `.agent/skills/`)

| Skill | Use It When... | Last Reviewed |
|---|---|---|
| `food-photo-display` | Adding or debugging image display — thumbnails, hero, aspect ratios | 2026-04-10 |
| `nextjs-supabase-auth` | Touching auth, sessions, middleware, email confirmation, or invite flows | 2026-04-10 |
| `ui-ux-designer` | Designing new components or reviewing layout decisions | 2026-04-10 |
| `seo-meta-optimizer` | Adding or editing any public-facing page | 2026-04-04 |
| `css-architecture` | Making ANY styling change — tokens, icons, fonts, heading levels, utility classes | 2026-04-11 |

---

### Business Plan & Strategy (in `.gemini/antigravity/brain/ad6a946e-f5c8-4097-b608-65c09a182a2d/`)

> **15-sprint structured programme** to validate, price, and launch Pretzel Prep as a sustainable micro-SaaS.
> Sprints 1–7 complete. Sprint 8 (Launch Strategy) is next.

| Document | Use It When... | Status |
|---|---|---|
| `pretzel_prep_business_plan.md` | **Start here** — full 15-sprint plan, progress tracker, sequencing diagram | 🟡 Active — 7/15 done |
| `sprint2_market_opportunity.md` | Reviewing TAM/SAM/SOM or pitching market size to investors | ✅ Done |
| `pretzel_full_potential.md` | Preparing a bank loan or investor pitch — 5-year model + valuation | ✅ Done |
| `sprint3_business_model.md` | Reviewing the freemium model design, upgrade triggers, business model canvas | ✅ Done |
| `sprint4_pricing_strategy.md` | Confirming prices, packaging, annual billing, Founding Member deal | ✅ Done |
| `sprint5_financial_projections.md` | 3-year model, unit economics, 3 scenarios, ad budget sensitivity (€100–€1k), phased spend plan | ✅ Done |
| `sprint6_metrics_framework.md` | North Star metric, 5 weekly KPIs, AARRR funnel, 3 Red Alert tripwires, model vs actuals tracker | ✅ Done |
| `sprint7_free_tool_strategy.md` | Recipe Scaler tool spec (2-day build, logic exists), Cost Calculator (M3), German SEO-first strategy | ✅ Done |
| `cost_scaling_analysis.md` | Understanding AI infrastructure costs at different user scales | ✅ Done |

**Key decisions locked (Sprints 1–4):**
- 🇮🇨🇿🇦🇪🇸 Markets: Germany (primary), South Africa, Spain
- 👥 ICP: The Scaling Cook (family cook, community volunteer, micro food entrepreneur)
- 💰 Model: Hybrid freemium + subscription — 3 tiers at launch
- 💶 Prices: Free | Kitchen+ €9.99/mo | Pro Kitchen €29.99/mo
- 🎁 Founding Member: €49 lifetime Kitchen+ for first 50 customers
- 🚀 Full suite vision: Pretzel Prep → Plan → Pay → Press (5-year path to €2.1M ARR)

---

## 🧪 QA Pipeline — How It All Fits Together

The regression system has **two parts** that work as one gate:

```
grandmaster_regression_v3.js        regression.md workflow
─────────────────────────────       ──────────────────────────────
Automated JavaScript test file       The full QA checklist

Tests pure logic:                   Wraps the JS file + adds:
• Visibility flags                  • Pre-flight DB sync check
• Audit (updated_by) rules          • Manual UI browser walkthrough
• Household data scoping            • Feature-by-feature checklist
• RLS isolation logic               • Commit to feature branch
• Metric aggregation                • Merge to main (production)
• Recipe scaling
• Shopping list lifecycle
• Budget calculation
• Share text format

Run with:                           Run with:
node --input-type=module < ...      /regression
Expected: 18/18 PASS
```

**Rule:** The JS file is the engine. The workflow is the complete pre-flight checklist. Both must pass before merging to `main`.

---

## 🚦 Milestone Roadmap (Path to v1.0)

| Milestone | What | Status |
|---|---|---|
| **M1** | Household Context Engine — nav switcher + data scoping | ✅ Done (2026-03-31) |
| **M2** | Library Tabs — My Recipes / Household / Public | ✅ Done (2026-03-31) |
| **M3** | Regression Gate + Merge to `main` + Vercel deploy | ✅ Done (2026-04-04) |

---

## 🚧 Known Open Issues

| Issue | Notes |
|---|---|
| **Image framing** | `contain` shows full photo but adds bars in grids. Adaptive Framing deferred. See `food-photo-display` skill. |
| **Email branding** | Supabase confirmation email still uses default template. Fix in Supabase Dashboard before production. |
| **NutritionPanel missing on public page** | `PublicRecipeClient` was rewritten to match the logged-in layout. NutritionPanel was not included (requires auth for shopping-list integration). Revisit if nutrition data is needed on public page. |
| **ADR-017 gap: instruction_steps guard** | ADR-017 claims the snapshot-restore guard applies to both `recipe_ingredients` AND `instruction_steps`. Code review suggests the steps save (line 405 in `add/page.js`) may not have its own pre-delete snapshot. Requires verification and fix or explicit documentation as a known gap. |

---

## 🗺️ Long-Term Stability & Deployment Roadmap

> **Current reality:** Active `feature/collab-kitchen-v2` branch. Production (`main`) is behind current dev state. The goal is a structured path from fast development cycles to a stable, tiered, production-grade delivery system.

### Phase Overview

```
Phase 0 (DONE)      → Stabilise localhost dev, close all critical gaps ✅
M1 → M2 → v1.0     → Ship to production via feature branch merge (current focus)
Phase 2 (POST-SHIP) → CI/CD pipeline, automated testing, deployment gates
Phase 1 (BETA)      → Tiered environments — only if user base grows (deferred)
Phase 3 (LATER)     → Performance & security hardening, monitoring
Phase 4 (LAUNCH)    → Phased marketing rollout
```

---

### Phase 0 — Development Stabilisation ✅ Complete

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

### Phase 1 — Tiered Environments *(Deferred — revisit after Beta)*

> **Decision (2026-03-30):** Phase 1 is not necessary at the current solo-developer, pre-beta stage. The feature branch workflow provides sufficient safety. Separate environments introduce double schema maintenance overhead for minimal gain until real users exist in production.

**Trigger conditions to revisit:**
- Beta users are in production and need protection from dev changes
- A second developer joins and their changes could conflict
- A risky migration needs to be tested before touching real data
- Playwright e2e tests require a real database environment

**When triggered, implement:**

| Environment | URL | Supabase Project | Branch |
|---|---|---|---|
| **Development** | `localhost:3000` | `living-cookbook-dev` (new) | `develop` |
| **Staging** | `staging.living-cookbook.vercel.app` | `living-cookbook-staging` (new) | `staging` |
| **Production** | `living-cookbook.vercel.app` | `living-cookbook-prod` (current) | `main` |

---

### Phase 2 — CI/CD Pipeline

**Goal:** No code reaches production without passing automated checks.

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

### Phase 3 — Hardening

- **Performance:** lazy loading, bundle audit, DB indexes on `user_id`/`group_id`/`invite_code`
- **Security:** full `pg_policies` audit, rate-limiting on `/api/scan` + `/api/brief`, OWASP ZAP scan
- **Monitoring:** Vercel Analytics, Supabase Dashboard, UptimeRobot, optional Sentry

**Rollback procedure:**
```
Vercel: Dashboard → Deployments → Previous → Redeploy
DB:     Run inverse SQL from last migration file
```

---

### Phase 4 — Phased Rollout

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

### Tech Debt / Security Backlog

| Priority | Item | Context |
|---|---|---|
| 🟡 Medium | **Replace `supabaseAdmin` profile upsert in signup with a DB trigger** | Current: service role used in `signup()` server action to bypass RLS (user has no session pre-confirmation). Better: `AFTER INSERT ON auth.users` trigger with `SECURITY DEFINER`. Low risk as-is — `id` is Supabase-generated, not user-supplied. See `src/app/login/actions.js`. |
| 🟡 Medium | **Replace RLS bypass in household join flow** | `group_members` INSERT uses service role during join. Should be a proper `INSERT` policy on `group_members`. |
| 🟠 Low | **Add `display_name` length validation on signup** | No max-length check — very long names stored unchecked. Add 100-char server-side limit in `signup()`. |

