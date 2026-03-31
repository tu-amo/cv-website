---
description: How to keep all project documents up to date after a feature or deployment
---

# 📚 Document Update Workflow

Run this after every feature completion or production deployment.  
Takes ~5 minutes. Keeps the project's documentation honest and navigable.

---

## Step 1: Open the Document Catalogue

Open [CATALOGUE.md](file:///Users/janescott/Projects/Anti/.agent/docs/CATALOGUE.md) and review the **Document Health Status** section.

Ask for each document:
- Is it still accurate?
- Did anything in this session change something it covers?

---

## Step 2: Update REQUIREMENTS.md

File: `living-cookbook/REQUIREMENTS.md`

For any feature touched in this session:
- Mark completed items `✅ Done`
- Mark broken/reverted items `⚠️ Partial` or `🔲 Pending`
- Add new requirements if the scope expanded
- Move anything to "Out of Scope" if it was explicitly de-prioritised

---

## Step 3: Update CHANGELOG.md

File: `living-cookbook/CHANGELOG.md`

Under `## [Unreleased]`, add entries for everything done this session using these categories:

```markdown
### Added
- Short, plain-English description of new feature or document

### Fixed
- Short description of bug fixed and root cause (one line)

### Changed
- Short description of behaviour that changed
```

If this is a **production deployment**, rename `[Unreleased]` to the version number and date:
```markdown
## [3.1.0] — YYYY-MM-DD
```

---

## Step 4: Update project_nexus.md (if architecture changed)

File: `living-cookbook/project_nexus.md`

Update only if any of these changed:
- A new Supabase client pattern was introduced
- A new route type was added (e.g. public, protected, join)
- A new core component was built
- The auth or RLS model changed

---

## Step 5: Update README.md (if setup changed)

File: `living-cookbook/README.md`

Update if:
- A new environment variable was added to `.env.local`
- A new `npm` script is now required
- Setup steps or prerequisites changed

---

## Step 6: Commit the documentation

// turbo
```bash
git add REQUIREMENTS.md CHANGELOG.md project_nexus.md README.md && git commit -m "docs: update documentation after session" && git push origin feature/collab-kitchen-v2
```

---

## Step 7: Periodic Audit *(every 2–3 sessions, or after a major feature)*

Steps 1–6 cover the core project docs. This step covers everything else.

> **⚠️ AGENT INSTRUCTION:** Before running any part of Step 7, stop and ask the user:
> 
> *"Steps 1–6 are complete. Would you like to run the periodic audit? I can run any combination of:*
> - *7a — Review all Workflows*
> - *7b — Review all Skills*  
> - *7c — Review Supporting Docs (Onboarding Architecture + Feature Spec)*
> - *7d — Update Last Reviewed dates in project_nexus.md*
> 
> *Which would you like?"*
> 
> Only proceed with the sub-steps the user confirms.

### 7a. Review all Workflows
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

### 7b. Review all Skills
Open each file in `.agent/skills/` and check:
- Is the documented pattern still how the code actually works?
- Are there new lessons from `LESSONS_LEARNT.md` that should be reflected?
- Update the `**Last Reviewed:**` date.

Skills to check:
- [ ] `nextjs-supabase-auth` — auth flow, callback, profiles, anti-patterns
- [ ] `food-photo-display` — image display strategy, contain vs cover
- [ ] `ui-ux-designer` — any new design decisions to capture?
- [ ] `seo-meta-optimizer` — any public pages added since last review?

### 7c. Review Supporting Docs
- [ ] `ONBOARDING_ARCHITECTURE.md` — auth flows still accurate? Any new pending items?
- [ ] `feature_spec.md` — all statuses current? Anything newly completed?

### 7d. Update Last Reviewed Dates in `project_nexus.md`
In the Document & Workflow Map, update the `Last Reviewed` date for every document, workflow, and skill you touched in this session.

### 7e. Density Miss Review *(every 2–3 sessions, or after adding new recipes)*
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

## Quick Reference — What to Update When

| Event | REQUIREMENTS | CHANGELOG | Nexus | README |
|-------|-------------|-----------|-------|--------|
| New feature built | ✅ Mark Done | ✅ Add to Added | Maybe | No |
| Bug fixed | ✅ Update status | ✅ Add to Fixed | No | No |
| New env var | No | ✅ Add to Changed | No | ✅ |
| RLS/Auth change | ✅ Update §3 | ✅ Add to Changed | ✅ | No |
| Production deploy | ✅ Review all | ✅ Version bump | Maybe | No |
| New table/migration | ✅ Update §3 | ✅ Added | ✅ | No |
| End of session | No | No | ✅ Update Last Reviewed dates | No |
| Every 2–3 sessions | No | No | ✅ | No | *(+ run Steps 7a–7e)* |
| New recipes added | No | No | No | No | *(+ run Step 7e density check)* |
