# Changelog

All notable changes to The Living Cookbook are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — since 2026-04-15

### Added
- **`docs/ROADMAP.md`** — canonical versioned home for the long-term phase plan, milestone tracker, full feature backlog (B1–B5), tech debt log, pre-launch checklist, and active engineering plan status. Replaces inline roadmap that was duplicated across `project_nexus.md` and a brain artifact.
- **Feature backlog B2–B5** — logged in `docs/ROADMAP.md` and summarised in `REQUIREMENTS.md`: source references on recipe page (B2), nutrition panel width alignment (B3), carousel speed increase to 5s (B4), recipe edit authorisation guard (B5).
- **Ingredient row reorder** — columns now display as `qty → name → prep → basket` (previously `name → prep → qty → basket`) using `grid-template-areas` for explicit, conflict-free placement. *(LL-053)*
- **B2 — Source reference block in recipe detail** — new right-panel block (below description) showing Book Title (linked if URL set), Author, Publisher, Page #, and Last Updated By. Conditional — only renders when source or attribution data exists. Uses canonical M3 tokens. *(Session: 2026-04-19)*
- **B7 — Dev tooling backlog: Playwright smoke-test script for form verification** — browser subagent approach is slow and unreliable for form-heavy pages (`/add`, `/create`). Proposed fix: `scripts/smoke-test-add.js` (Playwright headless, assumes dev server on port 3000) covering the 5 critical add/edit flows in < 30s. Use instead of subagent in refactoring checklists. *(Session: 2026-04-19)*
- **`src/components/recipe-form/SourceReferenceFields.js`** — first extraction from the `add/page.js` God component (1 of 4). Presentational: 5 controlled source inputs. State stays lifted in parent (needed by `handleSubmit`). *(Session: 2026-04-19)*
- **Migration `20260422000002_security_linter_fixes.sql`** — Resolves all 5 Supabase Security Linter warnings: (1) `increment_usage()` `search_path` pinned to `public`; (2) orphaned `create_profile_on_signup` trigger dropped (superseded by `on_auth_user_created`); (3) permissive anon INSERT policies on `adaptation_notes` and `ingredients` tables replaced with auth-only policies. *(Session: 2026-04-22)*
- **Migration `20260422000003_performance_advisor_fixes.sql`** — Comprehensive performance hardening addressing all Supabase Performance Advisor warnings: (1) 22 missing B-tree indexes added on FK columns across 9 tables; (2) unused `nutrition_cache_fetched_at_idx` dropped; (3) 40+ RLS policies refactored from `auth.uid()` to `(SELECT auth.uid())` — hoist from per-row to per-statement evaluation; (4) redundant permissive policies consolidated into single canonical policies per table/role/action. Guarded with `IF EXISTS` blocks for staging compatibility. *(Session: 2026-04-22)*
- **Migration `20260422000004_index_advisor_sort_indexes.sql`** — Adds B-tree indexes on the two highest-cost `ORDER BY` columns identified by the Supabase Index Advisor query stats: `idx_recipes_created_at` (DESC) and `idx_recipe_ingredients_sort_order` (ASC). These queries accounted for ~65% of total application DB query time. Planner cost: `recipes(created_at)` 62.62 → 27.75 (~56%↓); `recipe_ingredients(sort_order)` 43.92 → 8.97 (~80%↓). *(Session: 2026-04-22)*

### Fixed
- **CSS — `.recipe-panels` layout collapse** — Batch merger (phase 5b) incorrectly retained a `display: flex` responsive override instead of the canonical `display: grid`. Restored two-column grid (ingredients left, nutrition right). *(LL-055)*
- **CSS — `.step-number` badge alignment** — Batch merger replaced `display: flex` (M3 canonical, centres number inside badge) with legacy `display: inline-block`. Badge numbers no longer centred. Restored. *(LL-055)*
- **CSS — Ingredient name wrapping at narrow viewports** — Ingredient names wrapped to one word per line at ~580px. Root causes: (1) `.ingredient-name` had `grid-column: 2` conflicting with compound selector `grid-area: name`; (2) `min-width: auto` (CSS grid default) prevented the `1fr` column from shrinking. Fixed: `grid-area: name` on standalone rule + `min-width: 0`. *(LL-054, LL-057)*
- **CSS — Orphaned `flex-direction: column` on `.ingredient-text`** — Batch merger one-liner compression left a bare `flex-direction: column;` declaration floating after a compressed block; browser attached it to the next rule. Removed. *(LL-056)*
- **🔴 `sources` table — schema/code mismatch (feature broken since launch)** — `sources` table had legacy columns (`name`, `url`, `page`) while application code uses canonical names (`book_title`, `link`, `page_number`) and a `publisher` column that didn't exist. Every source insert was silently rejected by Postgres. The `recipes.source_id → sources.id` FK constraint also never existed, so PostgREST couldn't resolve the join in `loadRecipe`. Fixed by migration `20260419200000_fix_sources_schema.sql`: adds `book_title`, `publisher`, `link`, `page_number` columns; migrates existing legacy data; adds FK constraint. *(LL-059, Session: 2026-04-19)*
- **`sources` — silent error swallowing in save path (`add/page.js` + `RecipeWizard/index.js`)** — all three source save/update paths had no `error` destructuring; any failure was invisible to the user and the developer. Added `{error: srcErr}` + `showToast()` on all three paths in both components. *(LL-059, Session: 2026-04-19)*
- **`sources` — `loadRecipe` join resolution via explicit FK hint** — Changed `sources(*)` → `sources!source_id(*)` so PostgREST resolves the join correctly regardless of auto-detection ambiguity. Added `recipe.sources?.page_number` fallback. *(LL-060, Session: 2026-04-19)*

### Changed — CSS Audit (globals.css — Phases 1–5)
*Context: `globals.css` was 5,302 lines / 150KB with 50+ duplicate class definitions, 183 legacy `--pp-*` tokens, and 27 `!important` declarations. Audit target: ≤2,000 lines, 0 duplicates, 0 legacy tokens.*

- **Phase 1 — Legacy token replacement** — 183 `--pp-*` and `§B` alias usages replaced with canonical `--color-*` / `--font-*` equivalents. 23 pre-existing `));` CSS syntax errors removed simultaneously.
- **Phase 2 — Duplicate consolidation (priority 10)** — 10 highest-duplication classes manually merged to single canonical definitions (`.ingredient-item` 10×, `.recipe-left` 7×, `.pp-auth-left` 6×, etc.).
- **Phase 3 — Dead code removal** — 34 dead CSS classes deleted; 541 lines saved. Classes verified against all `.js` source files before deletion.
- **Phase 4 — `!important` audit** — 27 → **12** `!important` declarations (target was ≤23). 15 illegitimate overrides removed; specificity fixed at source.
- **Phase 5a — Structural reorganisation** — Table of Contents added, file restructured into 11 documented sections (§0 Reset → §11 Print/A11y). Deferred merges completed, banner blocks compressed.
- **Phase 5b — Batch merge remaining duplicates** — 56 remaining duplicate base class definitions merged. AC-1 (zero duplicates) and AC-2 (zero legacy tokens) now passing.
- **B4 — Hero carousel autoplay 4000ms → 5000ms** — `ImageCarousel.js` interval bumped so hero images are readable before advancing. *(Session: 2026-04-19)*
- **B2 — Removed duplicate source/attribution from recipe hero overlay** — `sourceLine` variable deleted; source data is now displayed only in the right-panel source reference block. Single source of truth. *(Session: 2026-04-19)*

### Documentation
- **`CATALOGUE.md`** — Added `docs/ROADMAP.md` as entry #3; added "Active Engineering Plans" section tracking CSS audit and business plan status.
- **`project_nexus.md`** — Added `docs/ROADMAP.md` to document catalog; added "Active Engineering Plans" section; replaced 100-line inline roadmap with a summary + link.
- **`/update-docs` workflow** — Added Step 2: explicit backlog and active-plans consolidation check every session. Updated git commit command to include `docs/ROADMAP.md` and corrected branch to `main`.
- **`LESSONS_LEARNT.md`** — Added LL-054–058 from CSS audit meta-analysis (min-width:0, batch merger failure mode, orphaned properties, grid-area/grid-column mixing, document fragmentation). Added LL-059–060 from sources schema post-mortem. Two new draft skills identified: `css-automated-cleanup`, `documentation-hygiene`.
- **`REQUIREMENTS.md`, `ROADMAP.md`, `project_nexus.md`, `CHANGELOG.md`** — Updated after DB hardening session (2026-04-22): security linter + performance advisor + index advisor migrations logged; Tech Debt backlog in `project_nexus.md` and `ROADMAP.md` cleared (all 3 items resolved prior sessions); new S10/P8/P9 requirements added; migration file map updated.

---

## [5.1.0] — 2026-04-15


### Added & Changed
- **Manage Kitchens UI Refinement** — Converted the active kitchen list into a responsive, symmetric grid. Standardized all data points into `InfoRow` key-value pairs (matching System Info page). Members list auto-caches and renders natively inside the card. "Share Link" and "Leave" actions isolated neatly into a stacked footer action bar. Invite Code pill moved to the header right. Free-tier Pro Kitchen preview card transformed into a clickable "EARLY ACCESS" waitlist link. (2026-04-15)
- **Multilingual Recipe Scaler — full build (TOOL-1 through TOOL-10)** — `/tools/recipe-scaler` (EN), `/tools/rezept-skalieren` (DE), `/tools/escalar-receta` (ES), `/tools/convertir-recette` (FR), `/tools/scalare-ricetta` (IT), `/tools/recept-omrekenen` (NL). Shared `RecipeScaler.js` component — paste input → `smartParseIngredient()` → `formatQuantity()` → animated output list. Copy-to-clipboard. Save CTA → sessionStorage → `/login?redirect=/add`. Schema.org `WebApplication` JSON-LD. Full hreflang x-default+6 on all pages. `/tools/` index page as internal linking hub. All routes return HTTP 200 without auth (middleware updated). All CSS via `RecipeScaler.module.css` using §A canonical tokens only. (2026-04-15)
- **UX-4: Guided first-run empty state** — When a user has 0 recipes, homepage shows "Welcome to Pretzel Prep" with 3 action buttons (Type a Recipe / Scan a Recipe Photo / Browse Public Library) instead of generic empty message. Generic "no results" empty state retained for search and kitchen-empty contexts. (2026-04-15)
- **CSS Architecture: Page Layout Shells rule (LL-049)** — New "Page Layout Shells" section in `css-architecture/SKILL.md`. Documents the three shell classes (`pp-page-card`, `home-wrapper`, `recipe-detail-wrapper`), their DOM paths, the mandatory rule (all new interior pages use `pp-page-card`), a what-pp-page-card-provides reference block, and bad/good code examples. Added shell check to Page Audit Checklist. (2026-04-15)
- **`src/lib/tools/recipe-scaler-copy.js`** — All 6-language copy strings in a single file. Add new language tool pages by adding an entry here + creating a page file. (2026-04-15)

### Fixed
- **Mobile layout for Recipe Scaler (UX-2)** — Servings inputs were positioned side-by-side on 375px screens with small touch targets. Updated `RecipeScaler.module.css` media query to stack inputs `flex-direction: column` and set Scale button to `width: 100%` for better Fitts' Law compliance.
- **Tool pages: wrong page shell** — `RecipeScaler.js` and `tools/page.js` were using a custom `.page` module class and inline styles for the outer wrapper. Replaced with `pp-page-card` global class so tool pages match the visual treatment of all other interior pages (card surface, border, shadow, standard max-width). (2026-04-15)

- **Business Plan — Sprints 5–7 complete** — Sprint 5: 3-year financial model, €10K/mo at Month 21, LTV:CAC 38.8×, ad budget sensitivity table (€100–€1K/mo), phased spend plan. Sprint 6: Metrics framework — North Star metric, 5 weekly KPIs, AARRR funnel, 3 Red Alert tripwires. Sprint 7: Free tool strategy — Recipe Scaler (37/40 score, 2-day build) + Cost Calculator (Month 3). Business plan paused at Sprint 7 to build the tool immediately; Sprint 8 resumes after tool is live.
- **Multilingual Recipe Scaler — Implementation plan** — Full spec for `/tools/recipe-scaler` in 6 languages (EN/DE/ES/FR/IT/NL). Public, no auth, reuses `formatQuantity()` from `recipe-utils.js`. Includes hreflang SEO, Schema.org markup, sitemap, "Save recipe" CTA → sessionStorage pre-fill → `/add`. Parallel tasks: UX-4 empty state + UX-2 mobile audit.
- **REQUIREMENTS.md — Backlog restructured** — Tool-first priority framework: Tier A (build now: TOOL-1 through TOOL-10 + UX-4), Tier B (4 weeks: Stripe + onboarding), Tier C (3 months: full app i18n + Recipe Cost Calculator). Pro Kitchen Phase 2 features deprioritised until €5K MRR.
- **project_nexus.md** — Updated to v4.4, sprint progress 7/15 done, sprint8 Launch Strategy is next.

- **Monetisation: Tier config (`src/lib/tiers.js`)** — single source of truth for 4 subscription tiers (Home Cook / Kitchen+ / Chef / Pro Kitchen). Includes monthly usage limits, feature lists, pricing, and Stripe price ID placeholders for Sprint 9.
- **Monetisation: Usage gate (`src/lib/usageGate.js`)** — server-side middleware that enforces monthly AI feature limits. Auth check → tier read → limit check → atomic increment. Returns standardised error codes (`NOT_AUTHENTICATED` / `LIMIT_REACHED`) for consistent UI handling.
- **Monetisation: Migration `20260414210000_add_usage_tracking_and_tier.sql`** — adds `profiles.tier` column (default `'free'`, CHECK constraint), `usage_tracking` table (PK: user_id + month), RLS (users read own rows only), and `increment_usage()` Postgres RPC (atomic UPSERT prevents race conditions). Applied to production 2026-04-14; RLS audit confirmed clean (zero silent blackouts).
- **Monetisation: `/api/brief` gated** — free users get `429 LIMIT_REACHED` (0 briefs/month); Kitchen+: 5/month; Chef/Pro Kitchen: unlimited.
- **Monetisation: `/api/scan` gated** — free: 5 scans/month; Kitchen+: 30/month; Chef/Pro Kitchen: unlimited.
- **Profile page: `UsageCard` component** — tier badge + animated progress meters for Recipe Scans and AI Briefs. States: normal (lavender) / warning at 80% (amber) / full (red) / blocked (empty bar + italic label). Monthly reset date shown. Upgrade CTA links to `/pricing` (Sprint 9). Built as a CSS Module (`UsageCard.module.css`) using §A canonical tokens per CSS architecture skill.
- **`npm run db:link:prod` + `db:link:staging`** — convenience scripts for switching the linked Supabase project between environments (workaround for `--project-ref` flag not supported in CLI v2.88.x).
- **Sprint 2 — Market Opportunity Analysis** — Full TAM/SAM/SOM analysis: bottom-up across 3 segments (DE/ZA/ES), top-down validation, 5-year revenue projections, €10K/month path (1,000 paying users at Month 18–24), full suite valuation (€25M at Year 5). Documented in `sprint2_market_opportunity.md` and `pretzel_full_potential.md`.
- **Navigation redesign** — The left-nav dropdown is now the primary navigation. Renamed "Global View" → "Public View". Added "All Your Recipes" section. Replaced emoji icons with semantic SVG icons (building for Pro Kitchens, house for Households). Homepage tab buttons removed; recipe view is now driven entirely by `activeView` in `HouseholdContext` (persisted in localStorage).
- **Supabase CLI migration management** — `supabase` installed as a dev dependency (v2.88.1). Linked to production (`hiuhjnodzodcgwltweoc`). All 16 existing migrations registered via `migration repair`. New `npm run db:*` scripts: `db:status`, `db:diff`, `db:new`, `db:push:prod`, `db:push:staging`. Schema changes now go through `db:new` → `db:push` — no more manual SQL editor sessions.
- **Migration: `20260408120000_add_preparation_to_recipe_ingredients.sql`** — Documents the `preparation` column fix applied to production as part of LL-043 resolution.
- **Unified page card layout** — `.pp-page-card` CSS class established as the standard container for all interior pages (Edit Recipe, Profile, Households, Market, System Info). Matches `1200px` max-width, `20px` border-radius, and box-shadow treatment of the recipe detail and homepage cards.
- **Homepage card layout** — `.home-wrapper` card with cinematic gradient hero (half-height) and `.home-content` recipe grid area — visually consistent with the recipe detail page.
- **Market list `StandardList` container** — Personal and household shopping lists now render inside a supplier-card-style container with a header strip (label + item count + clear button) matching the Pro Kitchen list view.
- **Step drag-to-reorder** — Up/down arrow buttons on recipe method steps replaced with a 6-dot grip handle (⠿). Uses HTML5 drag API: ghost fades dragged row to 35% opacity; amber top border highlights the drop target. `reorderSteps` function handles array splice-and-insert.
- **Visibility section redesign (Edit Recipe)** — Personal/Household button toggles and household `<select>` dropdown removed. Replaced with toggle-style rows identical to the Public toggle: each option (Personal + one per joined household) is an independent pill switch with label and description text.
- **Visibility multi-select logic** — `selectedGroupId` (string) replaced with `selectedGroupIds` (Set). `isPrivate` is derived (`selectedGroupIds.size === 0 && !isPublic`). Clicking Personal clears all households and Public. Each household toggles independently on/off. Public remains independent. Status line shows "Shared with N households".
- **Feature backlog section** — `living_cookbook_roadmap.md` now has a formal backlog table. First entry: B1 — multi-household recipe sharing (UI done, needs `recipe_groups` junction table).
- **CSS Modernization — M3 Token System (Phases 1–3)** — `:root` replaced with a Material Design 3-structured 3-layer token hierarchy (primitives → semantic roles → brand aliases → backward compat aliases). 138 old token usages + 31 hardcoded `rgba()` values replaced via automated migration scripts. Google Fonts CDN `@import` removed (Poppins/Nunito were already self-hosted via `next/font`). CSS Table of Contents comment block added. *(Commits: b996a85, c227727)*
- **CSS Modernization — !important Elimination (Phase 4)** — 360 `!important` declarations reduced to **23 legitimate uses** (94% reduction). Six FIX override blocks merged into their source component rules. Recipe detail and hero layout specificity wars resolved at source. The 23 remaining are all in valid categories: print, reduced-motion, `.hidden`, JS-driven animation overrides. *(Commits: 7b5efbd, 1786a77, 4e94d68, 4532a76, 031c26e)*
- **CSS Modernization — SVG Icon Library (Phase 5)** — `src/components/icons.js` created: 28 inline SVG icons (24×24 viewBox, Lucide paths, zero npm dependency). `Icon.{name}` for 18px use; `makeIcon()` factory for custom sizing. `PretzelNav.js` refactored from 89 lines of local SVG to shared imports (-89 lines). All UI-visible emoji replaced across `shopping/page.js`, `add/page.js`, `page.js`, `NutritionPanel.js`, `household/page.js`. *(Commits: 9d99026, dba9283)*
- **CSS Modernization — Utility Class Extraction (Phase 6)** — Audited 503 inline style blocks; 3 repeating patterns extracted to `globals.css`: `.pp-overline` (eyebrow labels), `.pp-hint` (helper text), `.pp-flex-col` (vertical form stacks). 15 inline style blocks replaced; 488 correctly retained as dynamic/unique. *(Commit: bc93ebd)*
- **CSS Modernization — Heading Hierarchy Audit (Phase 7e)** — All 20 pages/components audited for h1→h6 hierarchy. Three violations fixed: `add/page.js` h3→h2, `ImageManager.js` h3→h2, `ImageCarousel.js` h3→`<p>`. All remaining heading structures confirmed semantically correct.
- **docs/CSS_ARCHITECTURE.md** — 337-line developer reference: M3 token system, typography scale, heading map per page, icon library reference (28 icons), inline style decision tree, `!important` policy, 7 architectural lessons. *(Commit: 7d7af20)*
- **docs/ADR-018-css-modernization.md** — Formal ADR documenting all 7 phases: context, decisions, consequences, alternatives considered, and cross-references. *(Commit: dba9283)*

### Fixed
- **LL-043 — Ingredient data loss on save (critical)** — Production `recipe_ingredients` was missing the `preparation` column (prod used `preparation_note`; code used `preparation`). Every ingredient INSERT failed with HTTP 400 after the DELETE had already run, leaving recipes with no ingredients. Fixed: (1) added `preparation` column to production; (2) added pre-save snapshot-restore guard in `add/page.js` — if any ingredient INSERT fails, deleted rows are restored and navigation is aborted with a clear error; (3) recovered ingredient data for recipes 2, 5, 6 from staging.
- **OBS-009 — Schema drift check had 7 wrong column names** — The EXPECTED snapshot checked phantom columns that don't exist (`recipes.updated_at`, `instruction_steps.instruction`, `recipe_notes.note`, `profiles.user_id`, `nutrition_cache.id`, `nutrition_flags.user_id/created_at`). The daily cron was effectively inert. Fixed: corrected all column names, added `sources` and `ingredients` tables, added `preparation` to `recipe_ingredients` check.
- **Migration file timestamps** — 6 migration files had duplicate date-only prefixes (e.g. `20260407_*`) which caused Supabase CLI to fail. Renamed to fully unique `YYYYMMDDHHMMSS` format.
- **Market list nav bar removed** — Redundant "Back to Library" `<nav>` removed from the Market List (`/shopping`) page; the global PretzelNav handles navigation.
- **CSS Build error — escaped quote in import** — `import { Icon } from \'@/components/icons\'` (escaped single quotes) caused Next.js ECMAScript parser to fail during Phase 5 icon migration. Fixed: replaced with standard double-quoted import string.
- **Heading hierarchy violations** — `add/page.js`, `ImageManager.js` (h1→h3 skip), `ImageCarousel.js` (decorative `<h3>` caption) — all corrected in Phase 7e.

### Changed
- **Profile page** — Replaced two-div flex-centering wrapper + 560px max-width div with `.pp-page-card`.
- **Household page** — Replaced `view-gallery` + inline 860px style with `.pp-page-card`.
- **System Info page** — Replaced bespoke inline 860px/5% padding wrapper with `.pp-page-card`.
- **Shopping page** — Replaced inline 860px wrapper with `.pp-page-card`.
- **Household page icons** — Type selector cards (🏠/🍳 at 1.8rem) replaced with 36px inline SVG; card header and member role indicators replaced with `Icon.*` components.

### Infrastructure
- Production ingredient data recovered for recipes 5 (Cabbage Soup) and 6 (Sweet & Sour Pork) from staging; recipe 2 (Cucumber & Shiitake) recovered; recipe 1 (Lemon Garlic Pasta) requires manual re-entry
- Staging schema alignment SQL documented (sources, ingredients, recipe_ingredients, recipes, shopping_list)
- `/db-migration` workflow rewritten to reflect CLI-based migration management
- `LL-043` logged in LESSONS_LEARNT.md

---

## [5.0.0] — 2026-04-08

### Added
- **Pro Kitchen: Foundation (F-001–F-004)** — `group_type` column on `groups` table gates household vs pro_kitchen. `HouseholdContext` exposes `isPro`. Creation flow branches into Household / Pro Kitchen. Header switcher shows 🏠 / 🍳 indicator.
- **Pro Kitchen: Production Planning (PK1–PK2)** — "Plan Production" button on recipe detail (Pro Kitchen only). Modal to set planned servings, date, and assigned team member.
- **Pro Kitchen: Stock Check (PK3–PK5)** — Stock check page with scaled ingredient quantities, on-hand entry, manual row confirmation, green/amber shortfall highlight, and grams conversion toggle.
- **Pro Kitchen: Order List (PK6)** — Shortfall items pushed to the group's shared shopping list with `source='plan'` and "From Plan" badge.
- **Pro Kitchen: Supplier Tagging (PK7)** — Shopping list groups items by supplier. Autocomplete supplier field creates `supplier_orders` records dynamically.
- **Pro Kitchen: Order Scheduling (PK8)** — "Order by" date picker on each supplier card, stored in `supplier_orders.order_date`.
- **Pro Kitchen: Order Communication (PK9)** — 📋 Copy (email-ready text, includes user display_name), 📄 PDF (print-to-PDF window), "Mark as Sent" (records timestamp + user ID).
- **Pro Kitchen: Business Profile (PKP1–PKP4)** — `company_name`, `company_address`, `contact_email` columns on `groups`. Owner-editable profile panel on Kitchens page. Company name, address, and contact email appear in PDF order headers and clipboard copy text.
- **H13 — Member list** — Collapsible "Members" panel on each kitchen card. Lazy-loaded on first toggle. Shows display name, role badge (👑 owner / 👤 member), highlights current user.
- **H12 — Remove member (owner only)** — "Remove" button on each non-self member inside the members panel. Deletes `group_members` row and updates the panel immediately.
- **OBS-009 — Schema drift cron** — `GET /api/admin/schema-check` compares `information_schema.columns` against a hardcoded 11-table snapshot. Drift reported via Sentry at `error` level + HTTP 500. `vercel.json` cron runs at 06:00 UTC daily.
- **Migration: `20260407_add_supplier_orders.sql`** — Creates `supplier_orders` table with RLS (SELECT / INSERT / UPDATE); adds `supplier_order_id` + `source` columns to `shopping_list`.
- **Migration: `20260408_pro_kitchen_profile.sql`** — Adds `company_name`, `company_address`, `contact_email` to `groups`.

### Fixed
- **NutritionPanel silent failure (LL-041)** — Panel was invisible for all seed/manually-added recipes where `ingredient_id IS NULL`. Join returned `ing.ingredients = null`; fallback read `ing.name` which doesn't exist (column is `display_name`). All names resolved to `""` → `names.length === 0` → early return. Fixed: added `ing.display_name` as intermediate fallback in both name-extraction lines.

### Infrastructure
- Regression suite: **18/18 PASS** at v5.0.0
- Both migrations applied to staging (`hbgxotjjpapdqlqrofqz`) and production (`hiuhjnodzodcgwltweoc`)
- `vercel.json` created with daily schema-drift cron
- `REQUIREMENTS.md` bumped to v2.8
- `LESSONS_LEARNT.md` updated with LL-041

---

## [4.2.0] — 2026-04-06

### Added
- **Nutrition flagging system** — 🚩 flag button on each ingredient row in `NutritionPanel` breakdown table (visible on hover). Calls `POST /api/nutrition/flag` to record bad USDA matches for maintenance review. Deduplicates by user+ingredient. Status lives in new `nutrition_flags` table (`open` → `resolved` | `wont_fix`). Button turns to muted ✓ after flagging. `recipeId` prop added to `NutritionPanel`.
- **Staging environment** — Provisioned `living-cookbook-dev` Supabase project (`hbgxotjjpapdqlqrofqz`). `.env.local` now points to staging; production credentials backed up to `.env.local.production`. Both files covered by `.env*` gitignore rule.
- **`supabase/staging_setup.sql`** — Correct-order, correct-type schema init script for fresh staging projects. Fixes two schema_snapshot bugs: `groups` created before `recipes` (FK ordering), and `recipes.id` documented as `BIGINT` (Supabase table-editor default), not UUID. All FK columns referencing `recipes(id)` also `BIGINT`.
- **`scripts/seed-from-prod.js`** — Node.js script that copies production data into staging: `nutrition_cache` (41 rows, direct upsert), `recipes` (all, user_id remapped to staging user), `recipe_ingredients` / `instruction_steps` / `recipe_notes` (child tables, recipe_id remapped via prod→staging ID map). Safety guard aborts if staging already has data.
- **Resend confirmation email on login** — When login returns "Email not confirmed", the error block now shows an inline "resend the confirmation email" link. Email input is controlled so the resend fires without a form submit. States: idle → sending → sent (green ✓) | error (retry prompt). Calls `supabase.auth.resend({ type: 'signup', email })`.
- **Email confirmed success banner** — After clicking a confirmation link, `/auth/callback` now redirects to `/login?confirmed=true` instead of silently going to the homepage. Login page shows a green "✓ Email confirmed! Sign in below" banner.
- **Tech Debt / Security Backlog** — Added formal backlog table to `project_nexus.md` tracking: DB trigger replacement for admin profile upsert, household join RLS bypass, display_name length validation.
- **OBS-001 — Sentry error tracking** — `@sentry/nextjs` installed via wizard. Server, edge, and client configs committed. `tracesSampleRate` set to `0.1` (free tier safe); Session Replay disabled; PII capture disabled. `global-error.jsx` catches root layout crashes.
- **OBS-004 — `src/lib/observability.js`** — Three structured logging helpers: `logNutritionLookup`, `logNutritionAnomaly`, `logLowConfidenceSkip`.
- **Resend SMTP** — Custom SMTP configured in Supabase via Resend (janeblog.com domain, verified). All auth emails now delivered via `noreply@janeblog.com`.

### Fixed
- **React key collision in household groups dropdown** — `group_members` join returned duplicate rows per group (one per membership event). Added defensive deduplication in `src/app/add/page.js` groups fetch: `Map` keyed on `g.id`, then `Array.from(map.values())`. Prevents "Encountered two children with the same key" warning during recipe edit.
- **signup display_name not saved to profiles** — Profile `upsert` in `signup()` used the regular `supabase` client which has no session before email confirmation — RLS silently blocked the insert. Fixed: use `supabaseAdmin` for the upsert. Also added `display_name` to `auth.signUp({ options: { data: ... } })` so it lives in `raw_user_meta_data` immediately (accessible from JWT before the profiles row is needed).
- **Nutrition kcal column misalignment** — Adding the flag column broke the last-child CSS selector used for right-aligning the kcal column. Fixed in `globals.css` by targeting the kcal column explicitly instead of via `:last-child`.
- **BUG-001 — Nutrition cache poisoning (permanent fix)** — 3-tier confidence guard; low-confidence results served from L1 only, never written to L2.
- **Supabase email templates** — Templates updated to route through `/auth/callback` so all email links hit the Next.js session exchange handler.
- **Email rate limit incident** — User confirmed manually; `scripts/set-user-password.js` used for recovery.

### Changed
- **OBS-002–005, 008** — Sentry DSN, alert rule, nutrition route instrumentation, ESLint admin import guard.
- **Production Auth URL config** — `http://localhost:3000` removed from production project redirect URL allowlist. Staging project is now the correct home for localhost redirects.

---

## [4.1.0] — 2026-04-05

### Added
- **System Info page** (`/system`) — server-rendered diagnostic page accessible from the avatar dropdown. Shows git commit SHA, build timestamp, Vercel environment, deployment ID, Node.js version, and ✓/✗ presence check for all 5 required environment variables. Designed to immediately surface LL-022-type deployment mismatches.
- **Post-deploy CI health checks** — GitHub Actions workflow (`.github/workflows/post-deploy-checks.yml`) triggers automatically on every successful Vercel Production deployment. Runs 4 checks via `scripts/vercel-checks.js`: auth middleware redirect (CHK-001), nutrition API data quality (CHK-002), public recipe RLS rendering (CHK-003), admin endpoint protection (CHK-004).
- **Admin cache-flush endpoint** — `DELETE /api/admin/cache-flush` with `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` guard. Clears the `nutrition_cache` table for manual recovery from BUG-001 (nutrition cache poisoning). Double-guarded: middleware redirect + route-level Bearer check.
- **Build-time constants** — `NEXT_PUBLIC_BUILD_TIME` (ISO timestamp) and `NEXT_PUBLIC_APP_VERSION` (from `package.json`) injected at build time via `next.config.mjs`. Used by the System Info page and the nav dropdown mini-badge.
- **LL-022, LL-023, LL-024** — Three new lessons learned entries added to `LESSONS_LEARNT.md`: uncommitted files invisible to Vercel, eager supabaseAdmin init crash, Next.js 16 middleware rename.

### Fixed
- **Deployment version mismatch (LL-022)** — `AuthStatus.js` and `ImageCarousel.js` had been modified on disk but never committed. Vercel correctly deployed the old committed version every time; `npm run dev` read from disk and appeared correct. Root cause confirmed via `git status`. Files committed and pushed; production now shows the new dropdown nav header.
- **supabaseAdmin lazy Proxy** — refactored `src/lib/supabase/admin.js` from eager singleton to a lazy `Proxy`. Prevents `Error: supabaseKey is required` Vercel build crash when `SUPABASE_SERVICE_ROLE_KEY` is a runtime-only secret not available at bundle evaluation time (LL-023).
- **Nutrition route build crash** — added `export const dynamic = 'force-dynamic'` to `/api/nutrition/route.js` as belt-and-suspenders against build-time evaluation.

### Changed
- **`/publish` workflow** — hardened with mandatory Step 0: `git status` / `git diff HEAD` clean check before every commit and every production deploy merge.
- **`/deployment-checklist` workflow** — 5 errors corrected: jq field (`.butter.per100g.kcal`), admin endpoint path, HTTP status codes (307 not 302/401), and `ADMIN_SECRET` replaced with `SUPABASE_SERVICE_ROLE_KEY`.
- **ADR docs reorganised** — all 12 ADRs moved from `docs/architecture/` to `docs/` flat structure. `docs/README.md` index updated to include ADR-011 and ADR-012.
- **ADR-007** — updated to document the lazy Proxy implementation with `[!CAUTION]` callout referencing LL-023.
- **ADR-011** — updated status to "Partially Superseded" with LL-024 note and Next.js 16 → `proxy.js` migration checklist.
- **OBS-006** — implemented as `/api/admin/cache-flush` (was spec'd as `/api/nutrition/cache`); OBS-007 superseded (using `SUPABASE_SERVICE_ROLE_KEY` instead of a separate `ADMIN_SECRET`).

---

## [4.0.0] — 2026-04-04

### Added
- **Public Recipe Page** — `/public/recipe/[id]` now fully accessible to unauthenticated users. Full-width hero, Prep/Cook/Serves strip, scaled ingredients, method steps, and kitchen notes (read-only). Layout now matches the logged-in recipe detail page exactly.
- **ADR-010 (Observability Strategy)** — Three-layer observability plan: Sentry error tracking, structured JSON logging for USDA cache anomalies, admin-gated cache invalidation endpoint. OBS-001–009 added to backlog.
- **Pro Kitchen Production Planning** — Formalized PK1–PK10 feature backlog in `REQUIREMENTS.md`.

### Fixed
- **Middleware naming bug** — `src/proxy.js` renamed to `src/middleware.js` with correct `export function middleware` — Next.js was not running the middleware at all, meaning all route protection was not enforced at the middleware layer.
- **Public recipe RLS** — Added anon-read policies for `recipe_ingredients`, `instruction_steps`, `recipe_notes`, `ingredients`, `sources` and `storage.objects` (recipe-images bucket) so public recipe pages load fully for unauthenticated users.
- **`SecureImage` fallback** — Fixed `fallbackImage` scope error (ReferenceError); changed `console.error` to `console.warn` for private bucket access failures; now sets Unsplash placeholder directly on failure instead of setting `src=null` (which doesn't trigger `onError` reliably in all browsers).
- **`RecipeNotes` hydration mismatch** — `toLocaleDateString(undefined)` replaced with `toLocaleDateString('en-GB')` — system locale differs between Node.js server and browser, causing React hydration errors.
- **`PublicRecipeClient` layout** — Complete rewrite to use the same CSS class hierarchy as the logged-in recipe page (`recipe-hero-block`, `recipe-stat-strip`, `recipe-panels`). Previous version used non-existent CSS classes.
- **Print layout** — Hero image hidden (`recipe-hero-block: display:none`), panels collapse to full-width single column. Prep/Cook/Serves stat strip remains visible with interactive buttons hidden.
- **Homepage householddropdown removed** — Redundant "Viewing: Select a household" selector removed from homepage; header nav is the single source of truth for household context.

### Changed
- **Regression workflow updated** — Manual UI checklist rewritten to match the current header design (avatar dropdown, dynamic cookbook title, three-tab layout).


### Added
- **Nutrition Panel** — Per-serving calorie and macro display (`~450 kcal · 18g protein · 22g fat · 38g carbs`) on the recipe detail page. Expandable to show a per-ingredient breakdown table with gram weights and USDA match confidence.
- **USDA FoodData Central integration** — `/api/nutrition` route proxies the USDA SR Legacy + Foundation databases for ingredient-level lab-measured nutrition data (calories, protein, fat, carbs, fiber per 100g).
- **Two-tier nutrition cache** — L1 in-memory `Map` (instant, per-instance) + L2 Supabase `nutrition_cache` table (persistent, shared across all Vercel serverless instances). 90-day TTL. Writes are fire-and-forget — never block the response.
- **Batched nutrition API** — `GET /api/nutrition?ingredients=butter|flour|egg` resolves N ingredients in one browser request. Internally deduplicates by cleaned name and fans out USDA calls in parallel for cache misses only. Solves N+1.
- **`ingredient-to-grams.js`** — Unified converter: handles weight units (g/kg/oz/lb), volumetric via existing density table, and countable items (eggs, cloves, cans, whole vegetables).
- **`src/lib/supabase/admin.js`** — Service role Supabase client for server-only API routes that need to write to the DB without a user session.
- **`supabase/migrations/20260403232959_add_nutrition_cache.sql`** — Migration for the `nutrition_cache` table with public SELECT RLS policy.
- **Architecture Decision Records** — `docs/ADR-001` through `docs/ADR-004` + `docs/RE-01_Context_Model.md` added as formal architectural documentation.
- **SSR + ISR for public recipe page** — `/public/recipe/[id]` converted to a Next.js Server Component with `revalidate = 300` (5-minute ISR). Supabase signed URLs resolved server-side. Eliminated client-side double round-trip, improving LCP.

### Fixed
- **Hero/metadata gap** — `recipe-stat-strip` relocated from inside `recipe-left` to a DOM sibling between the hero block and panels. Closed the visual seam between hero image and the metadata bar.
- **Hero image LCP** — Added `fetchpriority="high"` and `loading="eager"` to the first carousel image. `SecureImage` now renders a skeleton shimmer immediately on mount.

### Changed
- `/api/nutrition` exempted from auth middleware — required for the public recipe page and because USDA data is non-sensitive.
- `SUPABASE_SERVICE_ROLE_KEY` is now also used in `supabaseAdmin` for nutrition cache writes (was previously only used in the scan route).

- **Nav Household Switcher** — Top nav now displays active kitchen as an amber pill (1 household) or dropdown (2+ households). Visible on every page. Persisted to `localStorage`.
- **Realtime Nav Refresh** — Supabase Realtime subscription on `group_members` ensures the household dropdown updates instantly when a new household is created or joined — no page refresh needed.
- **Market List Household Tabs** — Shopping page now has scoped tabs: 🧑 Personal + one tab per joined household. Each tab loads only items with the matching `group_id` (or `null` for Personal).
- **Market List Item Reassign** — A subtle ⇄ icon on each shopping item opens an inline "Move to…" dropdown to reassign it to any other list. Dismissed cleanly on blur.
- **AI Brief Aesthetic Pivot** — `heroPrompt` and `misePrompt` updated to "Modernist Cinematic Editorial" style: Geometric/Artfully arranged plating, material palette (stone, slate, crystal, glass, silver, copper, wood), full ingredient prep states and method steps included in Hero context.
- **AI Brief Error Toast UI** — Toast notification component added to the Add Recipe page; 429/503 Gemini API errors now surface a clear user-facing message instead of silent failure.
- **Global Branding: The Living Cookbook** — Shifted brand identity from "The Living Kitchen" to "The Living Cookbook" with solid refined typography (amber/papyrus) and increased font size for a cleaner, editorial header presence.
- **Cinematic Detail View** — Recipe detail page hero carousel now expands to 85vh on desktop, eliminating "dead space" and creating a seamless vertical flow that touches the metadata strip.
- **Unified Metadata Row** — Refactored the serving and conversion controls into a single, cohesive text row ("Prep · Cook · Serve · Convert") that matches the brand's minimalist architectural style.

### Fixed
- **Silent brief failure** — `ImageManager` was missing `useEffect` import; `lastBrief` state change was never reactive. Added `useEffect` to auto-open brief card and scroll to it.
- **Toast never rendered** — The `showToast` function in Add Recipe page existed but the toast JSX was not in the return tree. Added toast UI to the component.
- **Reassign click triggers item toggle** — Clicking ⇄ to open the reassign dropdown, then clicking away, caused the `<li>` click handler to fire `toggleItem` (strikethrough). Fixed by guarding: `if (reassigningId !== null) return` at the top of the onClick.
- **Add form went to wrong list** — New items were assigned via a separate dropdown; replaced with implicit scoping: items always go to the currently-viewed tab.
- **API 429 error was silent** — Supabase `group_members` Realtime and Gemini API 429/503 responses now both checked by `error.status` (not just `error.message`) for more reliable detection.
- **Desktop Title Overflow** — Resolved a layout regression where the recipe title and action buttons were falling to the bottom of the page on desktop; fixed by wrapping the hero and text in a dedicated relative-positioned anchor container.

### Changed
- Shopping list "Clear" button now labelled dynamically (e.g., "Clear J&J's Cookbook List") and only clears the currently-viewed tab — not the entire table.
- Copy/WhatsApp share text now includes the active list name (e.g., "🛒 J&J's Cookbook Shopping List").
- `page.js` (library) refactored to consume `HouseholdContext` — removed two duplicate `useEffect` hooks (auth check + group loading).

---

## [3.0.0] — 2026-03-25

### Added
- Multi-user household architecture (`groups` + `group_members` tables)
- Invite code generation on household creation
- Sign Up mode on login page ("Claim Apron")
- `signup` server action in `login/actions.js`
- SSR-aware Supabase client migration across all pages
- `user_id` and `group_id` columns on `recipes` and `shopping_list`
- Row Level Security enabled on all 10 public tables
- `/household` page — create and join households

### Fixed
- Metric aggregation precision increased to 3 decimal places (preventing data loss during g→kg conversion)
- All pages migrated to `@supabase/ssr` client to pass auth tokens to RLS-protected endpoints

### Changed
- Grandmaster Regression Suite updated to v3.0 (household metadata and metric precision tests added)
- `/restart` workflow created for emergency server recovery

---

## [2.0.0] — 2026-03-20

### Added
- Private Supabase Storage bucket (`recipe-images`) for secure image uploads
- `SecureImage` component — resolves storage paths to 1-hour signed URLs
- `ImageCarousel` — multi-image carousel with Ken Burns hover effect and auto-advance
- Image upload with client-side compression (max 1200px, 80% JPEG quality)
- AI image generation via Magic Brief (Google Flow prompt)
- Chef badge (`AuthStatus` component) in top-right nav with logout
- Route protection via Supabase middleware (all routes except `/public/*` and `/login`)

### Changed
- Supabase SDK migrated to `@supabase/ssr` with middleware session refreshing

---

## [1.0.0] — 2026-03-14

### Added
- Recipe creation with AI-assisted scanning (`/api/scan` Vision AI endpoint)
- Ingredient parser (`smartParseIngredient`) with metric normalization
- Recipe scaling and unit conversion engine (`formatQuantity`, `scaleText`)
- Shopping list with intelligent aggregation (`aggregateShoppingList`)
- Mock pricing engine and estimated budget badge
- Printable recipe card (`@media print` layout)
- Public recipe view at `/public/recipe/[id]`
- Recipe notes (add, delete)
- Timer widget and step-by-step cooking mode
- Glossary modal for culinary terms
