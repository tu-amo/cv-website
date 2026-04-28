# Changelog — janeblog.com

All notable changes to this site are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com). Versions are dated deploys.

---

## [Unreleased]

### Added
- **Shared Navigation Component (B8)**: Extracted redundant navigation and background globes into `src/nav.js`.
    - Automated active state detection based on URL.
    - Page-specific actions (e.g., "Save PDF" on CV page).
    - Reduced architectural technical debt to O(1) for site-wide navigation updates.
- Standardized blog articles (`unified-knowledge-software.html`, `knowledge-sharing-digital-workplace.html`) to use the shared framework CSS and Nav.

---

## [2026-04-24] — Repo Separation & Vercel Isolation

### Fixed
- Vercel build failure caused by Next.js framework detection hijacking janeblog builds — living-cookbook's `package.json` and `package-lock.json` were visible to Vercel's scanner (LL-001)

### Added
- `vercel.json` at repo root — explicitly pins framework to Vite, output to `dist/`, preventing Vercel auto-detection from ever selecting Next.js again
- `.vercelignore` — excludes all non-janeblog directories from Vercel's build scanner

### Changed
- Removed living-cookbook from `tu-amo/cv-website` git tracking — the project now lives exclusively at `tu-amo/living-cookbook` (locally: `/Users/janescott/Projects/LivingCookbook/`)
- Both projects now deploy from independent GitHub repos with no shared tracking

### Infrastructure
- Janeblog framework docs committed to repo for the first time: `project_nexus.md`, `CHANGELOG.md`, `docs/ROADMAP.md`, `.agent/docs/JANEBLOG_LESSONS_LEARNT.md`, `.agent/workflows/janeblog-publish.md`
- `.agent/workflows/janeblog-update-docs.md` created — janeblog-specific session close workflow (5 steps, replaces the living-cookbook `update-docs.md` which is not applicable to a static site)
- Vercel `cv-website` project Root Directory cleared — was set to `living-cookbook` which broke once that directory was removed from the repo; now empty so Vite builds from the repo root

---

## [2026-04-23]

### Changed
- Homepage layout refactor: unified content column width — removed 860px constraint on post cards so all sections align to same grid
- All sections below hero are now left-aligned (Writing, Sources of Inspiration, Expertise)
- Section title scale reduced from `clamp(2–3rem)` to `clamp(1.4–1.75rem)` — headings no longer compete with h1
- Expertise cards changed from centre-aligned to left-aligned, matching post card editorial style
- `❖ WRITING` and `❖ EXPERTISE` eyebrow labels added to respective sections
- Subtitle lines added below section headings for context
- Border-top dividers added between page sections for visual rhythm

### Added
- "Sources of Inspiration" section on homepage — 9 reference cards with hover insight tooltips, positioned above Areas of Expertise

### Fixed
- Removed bibliography `<aside>` from `knowledge-sharing-digital-workplace.html` which was causing scrolling and layout conflicts inside the article modal/iframe

---

## [2026-04-22] — CSS Architecture Standardisation

### Changed
- Consolidated all per-page `:root` and layout CSS into shared framework files
- All pages now load `src/tokens.css` → `src/nav.css` → `src/shells.css` in this order
- Removed 500+ lines of duplicate inline CSS from `index.html`, `blog.html`, `booking.html`, `cv.html`
- Standardised DOM structure across all pages: `body` → `skip-link` → `background-globes` → `site-nav` → `main.page-shell`

### Added
- `src/tokens.css` — single source of truth for all design tokens
- `src/shells.css` — canonical `.page-shell` layout wrapper
- `src/nav.css` — global sticky navigation styles

---

## [2026-03-12] — Booking Page

### Added
- `/booking` page with Calendly widget integration
- Booking link added to main navigation and CV page

---

## [2026-02-27] — Blog & CV Launch

### Added
- `blog.html` — writing index page with article cards
- `cv.html` — printable curriculum vitae
- `knowledge-sharing-digital-workplace.html` — first long-form article
- Main navigation with Home / Writing / Booking / CV links
- Custom 404 page
