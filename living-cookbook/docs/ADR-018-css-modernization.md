# ADR-018 — CSS Architecture Modernization & M3 Token System

**Status:** Accepted  
**Date:** 2026-04-11  
**Author:** Jane Scott  
**Phases:** 1–7 (completed across April 2026 CSS Modernization sprint)

---

## Context

Living Cookbook's original CSS (`globals.css`) grew organically across multiple development sprints without a cohesive architecture. By early April 2026 the file had:

- **360 `!important` declarations** creating a cascade arms-race
- **Hardcoded colour values** (`#C7A96A`, `rgba(235,220,178,0.1)`) scattered across 100+ rules
- **Duplicate font loading** — Google Fonts CDN + `next/font` both loading Poppins simultaneously
- **~60 UI-visible emoji** used as icon affordances (🛒, 📋, 🗑, etc.)
- **No shared icon library** — PretzelNav had 89 lines of local SVG definitions
- **No design token system** — no single place to change the brand colour
- Several FIX override blocks that applied corrections via `!important` layers on top of existing rules, rather than fixing the source
- Heading levels assigned visually (`<h3>` because it "looks right") rather than semantically

---

## Decision

Implement a Material Design 3-inspired semantic token system and a systematic CSS governance layer across 7 phases:

### Phase 1 — Critical Fixes
- Fixed `outline: none` on base `input` (accessibility) → moved to `:focus-visible` only
- Removed duplicate Google Fonts CDN import (font was already loaded via `next/font`)
- Added CSS Table of Contents comment block to globals.css

### Phase 2 — Unified Token System
Replaced the `:root` block with an M3-structured token hierarchy:

```
Layer 0 — Primitives    e.g. --md-ref-palette-neutral-10: #1a1a1f
Layer 1 — Semantic roles e.g. --md-sys-color-surface-container
Layer 2 — Brand aliases  e.g. --color-bg: var(--md-sys-color-background)
Layer 3 — PP aliases     e.g. --pp-surface: var(--color-surface)
```

The backward-compatibility alias system (Layers 2 and 3) allowed all page-level JSX to continue working without changes.

### Phase 3 — Token Migration
- Replaced 138 old token usages and 31 hardcoded `rgba()` brand values throughout globals.css via automated migration scripts
- All colour references now point to design tokens

### Phase 4 — !important Elimination (360 → 23)
- Phase 4a: Removed 148 `!important` from base/layout rules; fixed font double-load
- Phase 4b: Merged 6 FIX override blocks into their source component rules
- Phase 4c: Fixed home-wrapper/form-container source cascade; removed carousel overrides
- Phase 4d: Merged nutrition bar-graph and USER CSS blocks; removed 83 more `!important`
- Phase 4e: Resolved recipe-detail-wrapper card + hero-text layout conflicts; reduced to **23 legitimate uses**

The 23 remaining `!important` declarations are all in legitimate categories:
- 13× `@media print` (unavoidable)
- 3× `@media (prefers-reduced-motion)` (accessibility mandate)
- 1× `.hidden` utility class
- 3× JS-driven cart animation overrides
- 1× Login panel inline style override
- 2× JS drag-interaction overrides

### Phase 5 — Emoji → SVG Icon System
Created `src/components/icons.js` — a shared inline SVG library (28 icons, MIT-licensed Lucide paths):

- All icons: 24×24 viewBox, `stroke="currentColor"`, `fill="none"`, `aria-hidden="true"`
- Static `Icon.{name}` for 18px label/button use; `makeIcon()` factory for custom sizes
- Refactored PretzelNav from 89 lines of local SVG to `import { Icon } from '@/components/icons'`
- Migrated all UI-visible emoji across: `shopping/page.js`, `add/page.js`, `page.js`, `NutritionPanel.js`, `household/page.js`

**Intentional emoji keeps:** Toast message personality (🎉, 📋 in strings), WhatsApp message content, 🥨 pretzel brand mark in CTA.

### Phase 6 — Inline Style Extraction
Analysed 503 inline style blocks. Identified 3 repeating patterns (appearing 3+ times across 2+ files):

| Class | Properties | Uses |
|---|---|---|
| `.pp-overline` | `0.7rem + uppercase + muted + letterSpacing` | 8 |
| `.pp-hint` | `block + 0.75rem + muted` | 4 |
| `.pp-flex-col` | `flex column + gap:16px` | 3 |

**Decision:** Extract only these 3 classes. The remaining **488 inline styles are correctly contextual** (dynamic JS values, unique one-offs, or single-file patterns). Forcing CSS classes on all 503 would reduce readability without improving maintainability.

**Rule:** A pattern must appear 3+ times across 2+ files with no dynamic variation to warrant extraction.

### Phase 7 — Governance & Heading Audit

**7e — Heading Hierarchy Fix:** Audited all 20 pages/components. Found 3 violations:
- `add/page.js`: `<h3>Source Reference</h3>` under h1 → changed to `<h2 className="pp-overline">`
- `ImageManager.js`: `<h3>Photos & Visuals</h3>` under h1 → changed to `<h2>`
- `ImageCarousel.js`: `<h3>{title}</h3>` (caption text) → changed to `<p className="font-heading">`

All other headings confirmed correct. Multiple conditional h1s (login, join, forgot-password pages) are semantically valid — only one renders at a time.

**7d+7f — Architecture docs:** Created `docs/CSS_ARCHITECTURE.md` — canonical reference for token usage, icon system, heading map, utility classes, governance rules, and developer onboarding.

---

## Consequences

### Positive
- **Single colour change = 1 line edit** in the `:root` primitives block
- **Icon change = 1 line edit** in `icons.js` — all usages update automatically
- **`!important` count** reduced from 360 to 23 (94% reduction)
- **CSS specificity conflicts** eliminated at source rather than layered
- **Heading structure** is now WCAG-compliant across all pages
- **Developer onboarding** has a documented reference covering all styling decisions
- **No visual regressions** (smoke tested across all pages before each phase commit)

### Negative / Trade-offs
- `globals.css` is still a single large file (~5,100 lines). A future migration to CSS Modules or a component-level style system remains a larger-scope refactor not attempted here
- The M3 three-layer token system adds alias indirection — good for maintainability, slightly verbose when reading `:root`
- 488 inline styles remain (correctly) inline — the codebase is not "zero inline styles"

---

## Alternatives Considered

| Alternative | Rejected because |
|---|---|
| TailwindCSS | Breaking change to existing class-based components; team unfamiliar; no clear migration path |
| CSS Modules per component | Major refactor; globals.css already works; deferred to future sprint |
| Remove all inline styles | 490 of 503 are correctly dynamic or contextual; blanket removal causes state-binding regressions |
| Third-party icon library (Lucide React) | Adds ~40KB bundle; inline SVG achieves same result at zero cost |

---

## Related ADRs

- ADR-010: Observability / error tracking — Sentry integration
- ADR-011: Middleware naming conventions

## References

- `docs/CSS_ARCHITECTURE.md` — full developer reference
- `src/app/globals.css` — canonical CSS source (Section comments mark boundaries)
- `src/components/icons.js` — shared SVG icon library
- Commits: `b996a85` (Phase 3) · `031c26e` (Phase 4e) · `9d99026` (Phase 5) · `bc93ebd` (Phase 6) · `2016169` (Phase 7e)
