# Changelog — janeblog.com

All notable changes to this site are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com). Versions are dated deploys.

---

## [Unreleased]

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
