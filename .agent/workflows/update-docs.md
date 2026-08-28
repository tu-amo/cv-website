# 📚 Document Update Workflow
**Last Reviewed:** 2026-08-28

Run this after every feature completion, bugfix, or production deployment.  
Takes ~2 minutes. Keeps documentation accurate, minimal, and free of redundant churn.

---

## Core Document Boundaries & Rules

| Document | Boundary / Role | Update When |
|---|---|---|
| **`CHANGELOG.md`** | **What changed** (Historical release record) | Every feature, fix, or release shipped. |
| **`REQUIREMENTS.md`** | **What the app guarantees** (Functional contract) | A capability is completed, changed, or removed. |
| **`docs/ROADMAP.md`** | **What we want to build next** (Forward-looking B-series) | A new feature idea/issue surfaces; archive completed items. |
| **`project_nexus.md`** | **Technical architecture map** (Stack, routes, tables) | Architecture, database schema, or core patterns change. |

---

## Step 1: Record What Changed (`CHANGELOG.md`)

File: `living-cookbook/CHANGELOG.md`

Under `## [Unreleased]`, add brief entries:
```markdown
### Added
- Plain-English description of new feature

### Fixed
- Description of bug fixed and root cause
```

*(If deploying a versioned release, rename `[Unreleased]` to `## [X.Y.Z] — YYYY-MM-DD`)*.

---

## Step 2: Update System Contract & Backlog

### 2a. Requirements (`REQUIREMENTS.md`)
- Mark completed requirements as `✅ Done (YYYY-MM-DD)`.
- Update version and `Last Updated` in the header.

### 2b. Backlog & Active Plans (`docs/ROADMAP.md`)
- **New ideas/issues discovered during session:** Add a row to the **Feature Backlog** (B-series) table. Never leave backlog items only in chat or temporary scratchpads.
- **Completed items:** Mark `DONE` or archive from the active backlog.
- **Active Plans:** Update phase/status of long-running plans (e.g. CSS migration, Pro Kitchen sprints).

---

## Step 3: Update Architecture Map (If Changed)

File: `living-cookbook/project_nexus.md`

Update only if:
- New database tables, RPC functions, or migrations were introduced.
- New routes, pages, or core hooks were added.
- The auth/RLS model or third-party service integration changed.
- Update `Version:` and `Updated:` date in the top header.

---

## Step 4: Commit and Push Documentation

Run the commit command from the **LivingCookbook** project directory:

```bash
cd /Users/janescott/Projects/LivingCookbook
git add REQUIREMENTS.md CHANGELOG.md project_nexus.md docs/ROADMAP.md README.md
git commit -m "docs: update project requirements, changelog, and roadmap"
git push origin dev
git checkout main
git merge dev
git push origin main
git checkout dev
```

*(If agent-specific docs in `/Users/janescott/Projects/Anti/.agent/` were modified, commit them separately within that repo).*

---

## Step 8: Periodic Audit *(every 2–3 sessions, or after a major feature)*

Steps 1–7 cover the core project docs. This step covers everything else.

> **⚠️ AGENT INSTRUCTION:** Before running any part of Step 8, stop and ask the user:
> 
> *"Steps 1–7 are complete. Would you like to run the periodic audit? I can run any combination of:*
> - *8a — Review all Workflows*
> - *8b — Review all Skills*  
> - *8c — Review Supporting Docs (Onboarding Architecture + Feature Spec)*
> - *8d — Update Last Reviewed dates in project_nexus.md*
> - *8e — Density Miss Review*
> - *9  — ADR Review (architecture decision audit)*
> 
> *Which would you like?"*
> 
> Only proceed with the sub-steps the user confirms.

### 8a. Review all Workflows
Open each file in `.agent/workflows/` and check:
- Is the port number still correct? (`localhost:3000`)
- Does the git branch still match the active branch?
- Are any steps referencing retired patterns or old file paths?
- Update the `**Last Reviewed:**` date at the top.

Workflows to check:
- [ ] `/regression` — test counts correct? Feature checklist complete?
- [ ] `/cloud-db-sync` — SQL-first rule still accurate?
- [ ] `/db-migration` — steps still match current migration pattern?
- [ ] `/publish` — branch name and deploy target correct?
- [ ] `/update-docs` — *(this file)* — any new steps needed?
- [ ] `/restart` — port and kill command correct?

### 8b. Review all Skills
Open each file in `.agent/skills/` and check:
- Is the documented pattern still how the code actually works?
- Are there new lessons from `LESSONS_LEARNT.md` that should be reflected?
- Update the `**Last Reviewed:**` date.

Skills to check:
- [ ] `nextjs-supabase-auth` — auth flow, callback, profiles, anti-patterns, middleware name
- [ ] `css-architecture` — token system, page shells, utility classes, heading map
- [ ] `food-photo-display` — image display strategy, contain vs cover, carousel intervals
- [ ] `recipe-seed-data` — column names, bigint ids, DO block patterns
- [ ] `documentation-hygiene` — B-series rules, active plans, session checklist
- [ ] `schema-markup` — structured data types, eligibility index
- [ ] `seo-fundamentals` — E-E-A-T strategy still accurate?
- [ ] `seo-meta-optimizer` — any new public pages added since last review?
- [ ] `analytics-tracking` — tracking plan still relevant?
- [ ] `ui-ux-designer` — any new design decisions to capture?
- [ ] `web-performance-optimization` — Core Web Vitals targets still current?
- [ ] `accessibility-compliance-accessibility-audit` — any new accessibility issues found?
- [ ] `frontend-dev-guidelines` — patterns still match current stack?
- [ ] `mobile-design` — mobile breakpoints and touch targets still accurate?
- [ ] `pdf` — PDF skill still relevant for current features?

### 8c. Review Supporting Docs
- [ ] `ONBOARDING_ARCHITECTURE.md` — auth flows still accurate? Any new pending items?
- [ ] `feature_spec.md` — all statuses current? Anything newly completed?

### 8d. Update Last Reviewed Dates in `project_nexus.md`
In the Document & Workflow Map, update the `Last Reviewed` date for every document, workflow, and skill you touched in this session.

### 8e. Density Miss Review *(every 2–3 sessions, or after adding new recipes)*
Check whether any ingredient units couldn't be converted to grams and need a density entry added.

1. Open the app in the browser and navigate to any recipe
2. Open **Dev Tools → Console** and paste:
   ```js
   console.table(JSON.parse(localStorage.getItem('density_misses') || '{}'))
   ```
3. Review the output — look for ingredients with `count > 1` (appearing across multiple recipes)
4. For meaningful ingredients (not niche or one-off items), add an entry to `INGREDIENT_DENSITY` in `src/lib/unit-converter.js`
5. Commit: `git commit -m "feat(converter): expand density table — [list ingredients added]"`
6. Optional: clear the log after updating so the next review starts fresh:
   ```js
   localStorage.removeItem('density_misses')
   ```

---

## Step 9: ADR Review *(after any significant architectural session)*

Directory: `living-cookbook/docs/architecture/`

> **⚠️ AGENT INSTRUCTION:** Never edit existing ADR files. The rule is: *accepted ADRs are never edited*. Your job is to READ and ANALYSE — then PROPOSE. Hand proposals to the architect for approval before any new ADR is written.

### 8a. Read all ADRs

Open every file in `docs/architecture/` and read it in full. For each ADR, check:

1. **Is the decision still live?**  
   Does the code still implement what the ADR describes? Check the key files mentioned.  
   _If the decision has been reversed or superseded: propose a new ADR with status `Superseded by ADR-00N`._

2. **Are the Revisit Triggers firing?**  
   Read the `## Revisit Trigger` section of each ADR.  
   _If any trigger condition is now true: flag it and propose a new ADR or a design discussion._

3. **Are the cross-references still valid?**  
   Each ADR links to related ADRs by filename. Check the filenames still match.  
   _If a linked file was renamed or moved: note the broken link (do not edit the ADR — propose a new one or a README index fix)._

4. **Does the schema/code match what the ADR describes?**  
   For ADRs that include SQL or code snippets, verify the live code matches.  
   _If they diverge: note it as a drift observation. If the drift is significant, propose a new ADR that supersedes the old one._

### 8b. Identify gaps — decisions made without an ADR

Review what was built in the current session. For any significant architectural decision that doesn't have an ADR, propose one:

> *"The following decisions were made this session that may be worth documenting as ADRs:*
> 1. [Decision summary] — [why it matters]
> 2. ...
>
> *Would you like me to draft any of these?"*

**Threshold for an ADR-worthy decision:** it answers at least one of:
- _Why this technology/library and not an obvious alternative?_
- _Why is this route public when the default is authenticated?_
- _Why is data structured this way rather than another obvious way?_
- _Why does this bypass a rule that normally applies everywhere else?_
- _What are we giving up by making this choice?_

### 8c. Output format — Proposals only, never edits

End the ADR review with a structured report:

```
## ADR Review — [Date]

### ADR Health
| ADR | Status | Issues Found |
|-----|--------|--------------|
| ADR-001 | ✅ Current | None |
| ADR-002 | ✅ Current | None |
| ADR-003 | ✅ Current | None |
| ADR-004 | ✅ Current | None |
...

### Proposed new ADRs
- **ADR-00N: [Title]** — [one-line rationale]
  - Decision context: [brief summary]
  - Key trade-off: [what we're giving up]
  - Revisit trigger: [when to reconsider]

### Stale / Superseded ADRs
- [None] — or list with reason

### Broken references
- [None] — or list with location
```

Present this report to the architect and **wait for approval** before drafting any new ADR.

---

## Quick Reference — What to Update When

| Event | ROADMAP.md | REQUIREMENTS | CHANGELOG | Nexus | README | ADRs |
|-------|-----------|-------------|-----------|-------|--------|------|
| New feature built | No | ✅ Mark Done | ✅ Add to Added | Maybe | No | Run Step 9b |
| Bug fixed | No | ✅ Update status | ✅ Add to Fixed | No | No | No |
| New backlog item noticed | ✅ Add B-row + notes | ✅ Add summary row | No | No | No | No |
| Backlog item completed | ✅ Remove/archive row | ✅ Mark Done | ✅ Add to Added | No | No | No |
| Active plan phase changes | ✅ Update Active Plans table | No | No | ✅ Update Active Plans | No | No |
| New env var | No | No | ✅ Add to Changed | No | ✅ | No |
| RLS/Auth change | No | ✅ Update §3 | ✅ Add to Changed | ✅ | No | Run Step 9 |
| Production deploy | No | ✅ Review all | ✅ Version bump | Maybe | No | Run Step 9a |
| New table/migration | No | ✅ Update §3 | ✅ Added | ✅ | No | Run Step 9b |
| Architecture decision reversed | No | No | ✅ Added | ✅ | No | New ADR (Superseded) |
| End of session | No | No | No | ✅ Update Last Reviewed dates | No | No |
| Every 2–3 sessions | No | No | No | ✅ | No | Run Step 9 |
| New recipes added | No | No | No | No | No | *(+ run Step 8e density check)* |
