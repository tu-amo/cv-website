# Roadmap & Backlog — janeblog.com
**Last Updated:** 2026-04-29 (session 4)

---

## Feature Backlog

New ideas and improvements that are not yet being built. All backlog items must be logged here — never only in chat or a brain artifact.

| ID | Feature | Notes | Added |
|---|---|---|---|
| B1 | Responsive breakpoints audit | Mobile nav and layout needs testing across iPhone viewport sizes | 2026-04-23 |
| B2 | Writing page layout standardisation | `blog.html` needs eyebrow labels, section subtitles, and border dividers applied — same treatment as homepage | 2026-04-23 |
| B3 | `/publish` pre-flight workflow | Simple checklist: verify correct repo, check for uncommitted changes, confirm branch is `main`, push | 2026-04-23 |
| B4 | Architecture Decision Records (ADRs) | Document 3–4 key decisions: CSS token architecture, static HTML vs framework choice, Cloudflare Pages deployment, Vite dev server | 2026-04-23 |
| B5 | CSS_ARCHITECTURE.md | Consolidate `design/cartographic-mind.md` + `css-architecture` skill into one canonical reference doc | 2026-04-23 |
| B6 | Accessibility audit | Run full WCAG 2.1 AA audit across all pages. **Partially Done**: Added ARIA tablist roles and focus-visible rings to CV. | 2026-04-23 |
| B7 | `unified-knowledge-software.html` layout | New article page needs the same nav/shell structure as the main pages | 2026-04-23 |
| B8 | **Extract shared nav to a single JS component** | One change = instant site-wide propagation. | ✅ Done (2026-04-28) |
| B9 | Extract shared `<head>` to a Vite Head Agent | Created `src/head.js` to centralize site-wide fonts, secondary CSS, and shared metadata. | ✅ Done (2026-04-28) |
| B10 | Split `.agent/` directory — janeblog vs LivingCookbook | Janeblog `.agent/` should contain only janeblog-relevant context. | 2026-04-24 |
| B11 | CV PDF Fidelity & Density | Optimize PDF generation for 2-page/4-page strict limits and professional whitespace. | ✅ Done (2026-04-29) |

---

## Milestone Tracker

| Milestone | What | Status |
|---|---|---|
| **M1** | Core site live — homepage, CV, blog, booking | ✅ Done (2026-02) |
| **M2** | CSS architecture standardisation — shared tokens/nav/shells | ✅ Done (2026-04-22) |
| **M3** | Homepage layout refactor — unified alignment, hierarchy, sections | ✅ Done (2026-04-23) |
| **M4** | Framework docs established — nexus, changelog, roadmap | ✅ Done (2026-04-23) |
| **M5** | Writing page standardised | 🔲 Pending — B2 |
| **M6** | Accessibility audit passing | 🔲 Pending — B6 |
| **M7** | ADRs + CSS_ARCHITECTURE.md complete | 🔲 Pending — B4, B5 |
| **M8** | Shared nav component extracted — site-wide single source of truth | ✅ Done (2026-04-24) |
| **M9** | Repo separation complete — janeblog and LivingCookbook fully independent | ✅ Done (2026-04-24) |

---

## Active Engineering Plans

| Plan | Status | Notes |
|---|---|---|
| Framework bootstrap (nexus, changelog, roadmap, workflows) | ✅ Done 2026-04-23 | Session 2 |
| Repo separation — extract living-cookbook to its own directory + fix Vercel | ✅ Done 2026-04-24 | Session 3 |

---

## ⚠️ Technical Debt

### B8 — Nav HTML duplication (highest priority)

**The problem:** The site nav block (~15 lines of HTML) is manually copy-pasted into every HTML file. The same is true for the `background-globes` div and the full `<head>` block (font imports, CSS links, meta tags).

**Affected files (known):**
- `index.html`
- `blog.html`
- `cv.html`
- `booking.html`
- `knowledge-sharing-digital-workplace.html`
- `unified-knowledge-software.html`
- `404.html`

**Cost of the current approach:**

| Change | Files to edit manually |
|---|---|
| Add a nav link | 7 |
| Rename a nav item (e.g. "Writing" → "Blog") | 7 |
| Fix a typo in "Jane Petra Scott" | 7 |
| Add a new stylesheet to `<head>` | 7 |
| Add a new article page | 1 new file + must copy entire boilerplate |

**The fix (B8):** Create `src/nav.js` — a single JavaScript module that injects the nav, background-globes, and skip-link into the DOM at runtime. Every HTML page replaces the copy-pasted blocks with a single `<script src="/src/nav.js">` tag and a `<div id="site-shell"></div>` anchor. Works within the existing Vite setup. Zero migration risk.

**Why this is the biggest architectural win available:** Every future page or article automatically gets the correct nav. Structural changes propagate instantly across the entire site. The entire nav maintenance burden drops from O(n files) to O(1).

---

## Pre-Launch Checklist

Items required before considering the site "production-complete":

- [ ] All pages pass WCAG 2.1 AA accessibility audit
- [ ] Core Web Vitals green on PageSpeed Insights for janeblog.com
- [ ] Structured data (Person schema) added to homepage
- [ ] `sitemap.xml` verified and current
- [ ] Mobile layout verified on iPhone viewport
- [ ] Privacy policy page (if collecting any data via Calendly booking)
- [ ] `robots.txt` correct — no pages accidentally blocked

---

## Completed & Archived Backlog

| ID | Feature | Completed |
|---|---|---|
| — | CSS architecture standardisation | 2026-04-22 |
| — | Sources of Inspiration section on homepage | 2026-04-23 |
| — | Homepage layout refactor (alignment, hierarchy, eyebrows) | 2026-04-23 |
| — | Repo separation — living-cookbook extracted to `/Users/janescott/Projects/LivingCookbook/` | 2026-04-24 |
| — | Vercel isolation — `vercel.json` + `.vercelignore` + Root Directory cleared | 2026-04-24 |
| — | janeblog framework docs established (nexus, changelog, roadmap, lessons learnt, workflows) | 2026-04-24 |
