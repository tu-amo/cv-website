# 📚 Document Catalogue — The Living Cookbook

**Purpose:** Single source of truth for all project documentation. Update this list whenever a document is created, renamed, or retired.  
**Last Updated:** 2026-03-31

---

## Core Project Documents

| # | Document | Location | Owner | Update Trigger | Last Reviewed |
|---|----------|----------|-------|----------------|---------------|
| 1 | **Requirements** | `living-cookbook/REQUIREMENTS.md` | Product | Any new feature, status change, or scope decision | 2026-03-30 |
| 2 | **Architecture Nexus** | `living-cookbook/project_nexus.md` | Engineering | Any change to data flow, auth, or infrastructure | 2026-03-30 |
| 3 | **Changelog** | `living-cookbook/CHANGELOG.md` | Engineering | Every production deployment | 2026-03-30 |
| 4 | **README** | `living-cookbook/README.md` | Engineering | Onboarding steps change, new env vars, new scripts | 2026-03-30 |
| 5 | **Feature Specification** | `(artifact) feature_spec.md` | Product | Feature scope or status changes | 2026-03-30 |

---

## Agent & Workflow Documents

| # | Document | Location | Owner | Update Trigger | Last Reviewed |
|---|----------|----------|-------|----------------|---------------|
| 6 | **Document Catalogue** *(this file)* | `.agent/docs/CATALOGUE.md` | Both | Any new doc added or removed | 2026-03-30 |
| 7 | **DB Migration Workflow** | `.agent/workflows/db-migration.md` | Engineering | Any new pattern found during migration work | 2026-03-30 |
| 8 | **Cloud DB Sync Workflow** | `.agent/workflows/cloud-db-sync.md` | Engineering | SQL-first protocol — run before any schema-dependent code | 2026-03-30 |
| 9 | **Regression Workflow** | `.agent/workflows/regression.md` | Engineering | New features added to the regression checklist | 2026-03-30 |
| 10 | **Restart Workflow** | `.agent/workflows/restart.md` | Engineering | Server setup changes | 2026-03-25 |
| 11 | **Publish Workflow** | `.agent/workflows/publish.md` | Engineering | Deployment process changes | 2026-03-30 |
| 12 | **Update Docs Workflow** | `.agent/workflows/update-docs.md` | Both | Doc update process changes | 2026-03-30 |
| 13 | **Lessons Learnt** | `.agent/docs/LESSONS_LEARNT.md` | Both | Any new bug resolved — log immediately | 2026-03-30 |
| 14 | **Onboarding Architecture** | `.agent/docs/ONBOARDING_ARCHITECTURE.md` | Both | Any change to signup, invite, or auth callback flow | 2026-03-31 |
| 15 | **Brand Guide** | `.agent/docs/BRAND_GUIDE.md` | Product | Design, palette, or imagery vision changes | 2026-03-31 |
| 16 | **Flow Prompt Guide** | `.agent/docs/FLOW_PROMPT_GUIDE.md` | Product | AI image gen templates or prompt refinements | 2026-03-31 |
| 17 | **Meta Analysis** | `.agent/docs/META_ANALYSIS.md` | Both | Periodic skill and interaction audit | 2026-03-30 |
| 18 | **Production Health Review** | `.agent/docs/PRODUCTION_HEALTH.md` | Both | After any deploy, or whenever a new monitoring check is identified | 2026-03-31 |
| 19 | **CSS Architecture Skill** | `.agent/skills/css-architecture/SKILL.md` | Engineering | Any time you touch CSS, tokens, icons, fonts, or heading hierarchy | 2026-04-11 |

---

## Document Descriptions

### 1. `REQUIREMENTS.md`
The functional and non-functional specification for the entire app.  
Contains: Feature status table, security rules, performance requirements, architecture decisions, and prioritised backlog.  
**Rule:** Every new feature must have a row in §2 before implementation begins.

### 2. `project_nexus.md`
Master reference for architecture, file map, document map, QA pipeline, milestones, and long-term roadmap.  
Contains: Technical stack, full document/workflow/skill map with last-reviewed dates, phase roadmap.  
**Rule:** Update whenever a new architectural pattern, workflow, or skill is introduced.

### 3. `CHANGELOG.md`
Human-readable history of production changes, following [Keep a Changelog](https://keepachangelog.com) format.  
Contains: `[Unreleased]` (tagged to current branch), versioned entries with Added / Changed / Fixed / Removed.  
**Rule:** Every item pushed to production must be logged here before or at deploy time.

### 4. `README.md`
Onboarding doc for new developers.  
Contains: Project description, local setup steps, environment variables, available scripts, links to key docs.  
**Rule:** Any new env var or `npm` script must be reflected here within the same session.

### 5. `feature_spec.md`
Product-level feature specification tracking what's built vs. planned.  
Contains: Feature tables per domain (Identity, Recipes, Households, Market List, Security), milestone roadmap.  
**Rule:** Update when feature scope or completion status changes.

---

## Document Health Status

Run `/update-docs` after any feature completion or deployment to audit:

| Check | Passing? |
|-------|----------|
| REQUIREMENTS.md has no pending items without an owner | ✅ |
| CHANGELOG.md has an entry for the latest work | ✅ |
| project_nexus.md reflects current auth and data flow | ✅ |
| README.md setup steps match current `.env.local` structure | ✅ |
| All documents have a Last Reviewed date within the past 2 sessions | ✅ |
| PRODUCTION_HEALTH.md open incident log is current | ✅ |

---

### 18. `PRODUCTION_HEALTH.md`
Periodic production monitoring checklist for the live site.  
Contains: SQL queries for user/recipe/household health, Supabase & Vercel log checks, AI quota monitoring, RLS spot-checks, Core Web Vitals targets, grams converter coverage review, pre-deploy checklist, and open incident log.  
**Rule:** Run the 🟢 (post-deploy) section after every production release. Run 🟡 (weekly) checks periodically. Add any new production issue to the incident log with root cause and resolution.
