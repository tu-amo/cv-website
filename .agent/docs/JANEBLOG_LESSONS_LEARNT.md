# 📖 Knowledge Capture Log — janeblog.com

**Purpose:** Capture patterns, bugs, and decisions encountered while building janeblog.com — so they inform future sessions and prevent repeating the same mistakes.

**Entry Types:**
- 🐛 **Bug** — something broken that was diagnosed and fixed
- 🔲 **Gap** — a missing feature or design pattern discovered during work
- 💡 **Pattern** — a deliberate decision worth repeating

---

## Log

---

### LL-001 · Two Projects in One Repo — Vercel Picks Up the Wrong Framework
**Date:** 2026-04-24
**Type:** 🐛 Bug (deployment) — ✅ Resolved
**Symptom:** Pushing a janeblog layout commit caused the Vercel `cv-website` deployment to run `next build` (44 pages) instead of `vite build`. Build succeeded but failed with `No Output Directory named "dist" found` because Next.js outputs to `.next/` and Vite outputs to `dist/`.
**Root Cause:** The Anti repo contains two projects — the root janeblog (Vite) and the `living-cookbook/` subdirectory (Next.js). Both have a `package-lock.json`. Vercel's framework detection scanned the whole repo, found Next.js in the subdirectory, and auto-selected it as the build framework over the root Vite config.
**Fix:**
1. Created `vercel.json` at the Anti root — pins framework to Vite, outputDirectory to `dist`
2. Created `.vercelignore` at the Anti root — excludes `living-cookbook/` from Vercel's scan entirely
**Prevention:** Any repo containing multiple projects must have a root-level `vercel.json` explicitly declaring its own framework, AND a `.vercelignore` excluding subdirectories with competing frameworks. Do this on day one, before the first deploy.

---

### LL-002 · Nav HTML Duplication Across All Pages Creates O(n) Maintenance Cost
**Date:** 2026-04-23
**Type:** 🔲 Gap (architecture) — 🔲 Open (B8)
**Symptom:** Changing a nav link, fixing a typo in the brand name, or adding a new stylesheet requires editing 7 separate HTML files. One missed file causes the live site to be inconsistent.
**Root Cause:** The site was built by adding new pages as copies of existing ones. The nav HTML block (~15 lines), `background-globes` div, and full `<head>` block (CSS imports, font imports, meta tags) were copy-pasted each time rather than extracted to a single source.
**Scale of problem:** 7 HTML files currently affected. Every new article or page adds one more.
**Planned fix (B8):** Create `src/nav.js` — a JavaScript module that injects the nav, skip-link, and background-globes into the DOM at runtime. All pages reference a single `<div id="site-shell">` + `<script src="/src/nav.js">`. Changes propagate instantly site-wide.
**Rule:** On any static HTML multi-page site, extract shared DOM (nav, head, footer) to a JS include before adding the third page. The maintenance cost compounds with every file added after that.

---

### LL-003 · Bibliography Aside in Blog Article Caused Scroll Conflict
**Date:** 2026-04-22
**Type:** 🐛 Bug (layout) — ✅ Resolved
**Symptom:** The `knowledge-sharing-digital-workplace.html` article had a `<aside>` (bibliography/references section) that caused scrolling issues and layout conflicts inside the article — unexpected vertical scroll behaviour, content obscured.
**Root Cause:** The `<aside>` was positioned within the article's main content flow without adequate container scoping. The `document.querySelector("body > main > aside")` selector was affecting the page-level layout shell.
**Fix:** Removed the aside from the article file entirely. Repurposed the content as a "Sources of Inspiration" section on the homepage — 9 reference cards with hover insight tooltips, positioned above Areas of Expertise.
**Lesson:** `<aside>` elements inside full-page article flows need careful positional scoping. When they cause layout issues, consider whether the content belongs on the parent page as a distinct section rather than inside the article document.

---

### LL-004 · Homepage Layout Inconsistency — Per-Page Inline CSS vs Shared Framework
**Date:** 2026-04-22
**Type:** 🔲 Gap (architecture) — ✅ Resolved (M2, M3)
**Symptom:** Homepage sections (Writing, Expertise, Sources) had inconsistent column widths, alignment, heading scales, and visual rhythm. Post cards were pinched to 860px, expertise cards were centred while post cards were left-aligned, section headings competed in scale with the hero h1.
**Root Cause:** Each section was styled with ad-hoc inline CSS in page-specific `<style>` blocks rather than drawing from a shared design system. There was no rule enforcing consistent column width, alignment, or heading hierarchy across sections.
**Fix (M3 — 2026-04-23):**
- Unified all content sections to the same column width (removed 860px constraint)
- Left-aligned all sections below the hero
- Reduced section heading scale to `clamp(1.4rem, 1.75rem)` so they don't compete with h1
- Added `section-eyebrow` pattern (e.g. `❖ WRITING`) and subtitles to each section
- Added `border-top` dividers for visual rhythm between sections
**Rule:** All layout constraints (max-width, padding, alignment) must come from shared CSS framework files (`tokens.css`, `shells.css`), not per-section overrides. New sections should inherit from the framework and only override when there is a documented reason.

---

### LL-005 · `.agent/` Directory Shared Between Two Projects — Context Pollution Risk
**Date:** 2026-04-23
**Type:** 🔲 Gap (architecture) — 🔲 Open
**Symptom:** The `.agent/` directory at `/Users/janescott/Projects/Anti/.agent/` contains skills, workflows, and docs that are almost entirely living-cookbook specific (`nextjs-supabase-auth`, `food-photo-display`, `recipe-seed-data`, ONBOARDING_ARCHITECTURE, PRODUCTION_HEALTH etc.). The CATALOGUE.md is titled "The Living Cookbook". When working on janeblog, an agent reading this directory receives mostly irrelevant context.
**Root Cause:** The `.agent/` was built for living-cookbook but stored at the parent level (Anti root) — either because it predates the living-cookbook subdirectory or for organisational convenience. When janeblog framework docs were added to the same `.agent/`, the two projects' contexts became mixed.
**Current workaround:** Janeblog-specific docs are clearly named (JANEBLOG_LESSONS_LEARNT.md, etc.) and the project_nexus.md at the Anti root serves as the orientation file.
**Long-term fix:** Move all living-cookbook `.agent/` content into `living-cookbook/.agent/`. Create a clean `/Users/janescott/Projects/Anti/.agent/` for janeblog only. Update CATALOGUE.md for each project independently.
**Status:** Deferred — requires coordination to avoid breaking living-cookbook workflow references.

---

### LL-006 · Vercel Deployment Triggered by Push to Shared Repo Root
**Date:** 2026-04-24
**Type:** 💡 Pattern
**Context:** The `cv-website` Vercel project is connected to the `tu-amo/cv-website` GitHub repo (the Anti root). Every push to `main` — including commits that only change janeblog files — triggers a Vercel build. This is expected behaviour.
**What to remember:** The living-cookbook has its own separate Vercel project connected to the same repo with Root Directory set to `living-cookbook/`. A janeblog push will trigger BOTH Vercel projects. Before pushing janeblog changes, confirm no living-cookbook migrations are staged that need `npm run db:push:prod` first.
**Verification command:**
```bash
git rev-parse --show-toplevel   # confirm you're in Anti root, not living-cookbook
git status --short              # confirm only janeblog files are staged
```

---

## Patterns & Anti-Patterns

| Pattern | Anti-Pattern |
|---|---|
| Declare `vercel.json` framework + outputDirectory at repo root on day one | Relying on Vercel auto-detection in a repo with multiple projects |
| Add `.vercelignore` to exclude sibling projects before first deploy | Letting Vercel scan the entire repo including unrelated subdirectories |
| Extract shared nav to a JS include before page 3 | Copy-pasting nav HTML into every HTML file and editing each separately |
| All layout constraints come from `tokens.css` and `shells.css` | Per-section inline CSS overrides in page-specific `<style>` blocks |
| Section content on homepage as named sections (Sources of Inspiration) | `<aside>` inside article flow without careful positional scoping |
| Run `git rev-parse --show-toplevel` before any `git push` | Assuming the terminal is in the right directory |
| Log every bug/decision to JANEBLOG_LESSONS_LEARNT.md in the same session | Assuming you'll remember the root cause next session |
