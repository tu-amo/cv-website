# Changelog — janeblog.com

All notable changes to this site are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com). Versions are dated deploys.

---

## [Unreleased]

- **Shared Navigation Component (B8)**: Extracted redundant navigation and background globes into `src/nav.js`.
    - Automated active state detection based on URL.
    - Page-specific actions (e.g., "Save PDF" on CV page).
    - Reduced architectural technical debt to O(1) for site-wide navigation updates.
- **Head Boilerplate Extraction (B9)**: Created `src/head.js` to manage site-wide font loading, navigation styling, and shared metadata.
    - Refactored all 7+ pages to use the modular "Head Agent" pattern.
    - Standardized injection sequence for global components.
- **CV Professionalization & Availability**:
    - Synchronized notice period to **1 Month** across all CV assets (`cv.html`, `404.html`, `cv-old.html`).
    - Streamlined the interactive CV header for high-density professional presentation.
    - Optimized PDF generation engine (`generate_cv_files.py`) for strict page-limit density (2 pages Executive / 4 pages Master).
    - Hardened CV accessibility with ARIA tablist roles, dynamic states, and improved focus-visible rings.
- **UX & Print Improvements**:
    - Fixed print-version margin clipping issue by adding horizontal padding to `src/print.css` and removing conflicting inline styles.
    - Updated Global Navigation "Save PDF" button to a direct link for the Executive Summary, providing immediate download utility.
    - Removed legacy "Download Word" functionality per user preference to focus on PDF fidelity.

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
