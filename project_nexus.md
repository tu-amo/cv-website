# Project Nexus: janeblog.com
**Version:** 1.0 | **Updated:** 2026-04-23 | **Branch:** `main`  
**Status:** Homepage layout refactor complete. Framework docs being established. Next: Writing page layout standardisation (B2).

---

## 🎯 What This Site Is

A personal portfolio and writing site for Jane Petra Scott — Senior SAP Retail Architect & Digital Transformation Leader. Static HTML/CSS/JS site. No backend, no database, no auth. Deployed via Cloudflare Pages.

**Live domain:** https://janeblog.com  
**Local dev:** http://localhost:5173 (`npm run dev` from `/Users/janescott/Projects/Anti/`)

---

## 🏗 Architecture

| Layer | Technology | Key Files |
|---|---|---|
| Framework | Static HTML/CSS/JS (no framework) | `index.html`, `blog.html`, `cv.html`, `booking.html` |
| Dev Server | Vite (port 5173) | `package.json`, `vite.config.js` (if present) |
| Design Tokens | Vanilla CSS — token system | `src/tokens.css` |
| Layout | Page shell + nav framework | `src/shells.css`, `src/nav.css` |
| Hosting | Cloudflare Pages | `cv-website.pages.dev` → `janeblog.com` |
| DNS | Cloudflare | See `DNS_SETUP_GUIDE.md` |
| Deploy | `git push` to `main` → Cloudflare auto-deploys | No CI pipeline yet |

**CSS loading order (mandatory — do not reorder):**
```html
<link rel="stylesheet" href="/src/tokens.css" />
<link rel="stylesheet" href="/src/nav.css" />
<link rel="stylesheet" href="/src/shells.css" />
<!-- page-specific <style> block AFTER shells.css -->
```

---

## 🗂 Active File Map

### Pages

| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Homepage — hero, writing previews, sources of inspiration, expertise |
| `blog.html` | `/blog` | Writing index — all articles |
| `cv.html` | `/cv` | Curriculum vitae (also at `cv.janeblog.com`) |
| `booking.html` | `/booking` | Calendly booking integration |
| `knowledge-sharing-digital-workplace.html` | `/knowledge-sharing-digital-workplace` | Article: Knowledge Sharing in Digital Workplace |
| `unified-knowledge-software.html` | `/unified-knowledge-software` | Article: Unified Knowledge Systems |
| `404.html` | — | Custom 404 error page |

### CSS Framework

| File | Purpose |
|---|---|
| `src/tokens.css` | **Source of truth** — all design tokens (colours, fonts, spacing, radii, shadows) |
| `src/nav.css` | Sticky site nav — `.site-nav`, `.site-nav__brand`, `.site-nav__links`, `.site-nav__link` |
| `src/shells.css` | Layout wrappers — `.page-shell` (max-width, padding, grid) |

### Design & Docs

| File | Purpose |
|---|---|
| `design/cartographic-mind.md` | Cartographic Mind design system — palette, typography, mood, visual language |
| `project_nexus.md` | **This file** — single orientation for every session |
| `CHANGELOG.md` | History of every production change |
| `docs/ROADMAP.md` | Backlog (B-series), milestone plan |
| `DNS_SETUP_GUIDE.md` | Cloudflare DNS configuration reference |

### Images

| Directory | Contains |
|---|---|
| `images/blog/` | Blog post cover images |
| `public/` | Static assets served directly |

---

## 📐 DOM Structure — Mandatory on All Pages

Every page must follow this exact structure. Deviating from it breaks nav and shell alignment:

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="background-globes" aria-hidden="true">…</div>
  <nav class="site-nav" aria-label="Site navigation">…</nav>
  <main class="page-shell" id="main-content">
    <!-- page content here -->
  </main>
</body>
```

---

## 📁 Document & Workflow Map

**If you don't know which document to use, start here.**

### Project Documents (in `/Users/janescott/Projects/Anti/`)

| Document | Location | Use It When... | Last Reviewed |
|---|---|---|---|
| **This file** — Project Nexus | `project_nexus.md` | You need a fast orientation: architecture, file map, what everything is | 2026-04-23 |
| **Changelog** | `CHANGELOG.md` | You're deploying — log every change before pushing | 2026-04-23 |
| **Roadmap & Backlog** | `docs/ROADMAP.md` | New backlog items, feature planning, milestone tracking | 2026-04-23 |
| **DNS Guide** | `DNS_SETUP_GUIDE.md` | Cloudflare DNS or domain routing questions | 2026-04-23 |
| **Design System** | `design/cartographic-mind.md` | Palette, typography, visual language decisions | 2026-04-23 |

### Agent Docs (in `.agent/docs/`)

> ⚠️ Note: The `.agent/` directory at this level is currently shared with the living-cookbook project. Living-cookbook-specific docs (ONBOARDING_ARCHITECTURE, PRODUCTION_HEALTH) apply to that project only.

| Document | Use It When... | Project |
|---|---|---|
| `BRAND_GUIDE.md` | Design principles, palette, imagery mood | Both |
| `LESSONS_LEARNT.md` | A bug is fixed — log it immediately | Both |
| `CATALOGUE.md` | Adding or retiring any document | Both |

### Skills (in `.agent/skills/`)

| Skill | Use It When... | Project |
|---|---|---|
| `css-architecture` | Making **any** styling change — tokens, layout, heading levels | **janeblog** |
| `seo-fundamentals` | Editing any public-facing page | Both |
| `seo-meta-optimizer` | Writing meta titles/descriptions | Both |
| `accessibility-compliance-accessibility-audit` | Accessibility audit or fix | Both |
| `ui-ux-designer` | New component or layout decision | Both |

### Workflows (in `.agent/workflows/`)

| Workflow | Run It When... |
|---|---|
| `/publish` | Before every git push to production |
| `/update-docs` | After every deployment — update CHANGELOG, ROADMAP, this file |

---

## 🚧 Known Open Issues

| Issue | Notes |
|---|---|
| **No `/publish` pre-flight workflow** | Currently pushing directly without a checklist. B3 — create workflow. |
| **Writing page not layout-standardised** | `blog.html` has not yet received the eyebrow/section treatment applied to homepage. B2. |
| **CV and Booking pages** | Layout consistency with homepage needs verification after homepage refactor. |
| **No CSS_ARCHITECTURE.md** | `cartographic-mind.md` + `css-architecture` skill partially cover this. Should be consolidated. B5. |
| **No ADRs** | Key architectural decisions not documented. B4. |

---

## 🚀 Deployment

**How to push to production:**
```bash
cd /Users/janescott/Projects/Anti  # NOT inside living-cookbook
git add -A
git commit -m "type: description"
git push
```

Cloudflare Pages automatically deploys on push to `main`. No CI pipeline currently — changes go live immediately.

**Verify which repo you're in before pushing:**
```bash
git rev-parse --show-toplevel   # must return /Users/janescott/Projects/Anti, not .../living-cookbook
```

**Live site:** https://janeblog.com  
**Local dev:** `npm run dev` → http://localhost:5173

---

## 📋 Active Backlog Summary

> Full backlog with context in `docs/ROADMAP.md`.

| ID | Item | Priority |
|---|---|---|
| B1 | Responsive breakpoints audit — mobile nav + layout | Medium |
| B2 | Writing page (blog.html) layout standardisation | Medium |
| B3 | `/publish` pre-flight workflow | Low |
| B4 | ADRs — document CSS tokens, static HTML, Cloudflare deploy decisions | Low |
| B5 | `CSS_ARCHITECTURE.md` — consolidate cartographic-mind + skill | Low |
