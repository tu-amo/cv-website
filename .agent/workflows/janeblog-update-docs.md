---
description: Keep janeblog documentation honest after every session or deployment
project: janeblog
---

# 📚 janeblog — Document Update Workflow
**Last Reviewed:** 2026-05-24

Run this at the end of every session where you changed or built something.  
Takes ~5 minutes. Prevents documentation drift.

---

## Step 1 — Update CHANGELOG.md

File: `/Users/janescott/Projects/Anti/CHANGELOG.md`

Under `## [Unreleased]`, add entries for everything done this session:

```markdown
### Added
- Short plain-English description of new feature or document

### Fixed
- Short description of bug fixed and root cause (one line)

### Changed
- Short description of behaviour that changed
```

If this session included a **production push to main**, move `[Unreleased]` entries to a new dated entry:
```markdown
## [YYYY-MM-DD] — Short description of the release
```

---

## Step 2 — Update ROADMAP.md

File: `/Users/janescott/Projects/Anti/docs/ROADMAP.md`

- [ ] Did any new ideas or issues surface that aren't being built immediately?
  - If yes → add a B-series row to the **Feature Backlog** table with a B-number, description, notes, and today's date
- [ ] Were any existing backlog items completed?
  - If yes → move the row to **Completed & Archived Backlog** at the bottom
- [ ] Was a new Technical Debt issue discovered?
  - If yes → add a subsection to **⚠️ Technical Debt** with the root cause and proposed fix

---

## Step 3 — Update JANEBLOG_LESSONS_LEARNT.md

File: `/Users/janescott/Projects/Anti/.agent/docs/JANEBLOG_LESSONS_LEARNT.md`

For any bug diagnosed or pattern established this session:

```markdown
### LL-00N · Short title
**Date:** YYYY-MM-DD
**Type:** 🐛 Bug | 🔲 Gap | 💡 Pattern — ✅ Resolved / 🔲 Open
**Symptom:** What broke or was missing.
**Root Cause:** Why it happened.
**Fix:** What was done.
**Rule:** The one-line rule to prevent recurrence.
```

Then add the rule to the **Patterns & Anti-Patterns** table at the bottom of the file.

---

## Step 4 — Update project_nexus.md (if structure changed)

File: `/Users/janescott/Projects/Anti/project_nexus.md`

Update only if any of these changed:
- A new HTML page was added to the site
- A new CSS file was added to the framework
- The deployment setup changed (Vercel settings, domain, etc.)
- A new workflow or skill was added to `.agent/`

---

## Step 5 — Commit the documentation

```bash
# Verify you're in the right repo
git rev-parse --show-toplevel   # must show .../Anti, not .../LivingCookbook

git add CHANGELOG.md docs/ROADMAP.md project_nexus.md \
        .agent/docs/JANEBLOG_LESSONS_LEARNT.md

git status   # review before committing

git commit -m "docs: update documentation after session [YYYY-MM-DD]"
git push
```

---

## Quick Reference — What to Update When

| Event | CHANGELOG | ROADMAP | LESSONS_LEARNT | project_nexus |
|---|---|---|---|---|
| New page or section built | ✅ Added | No | Maybe | ✅ Add to file map |
| Bug fixed | ✅ Fixed | No | ✅ Log the bug | No |
| New backlog idea | No | ✅ Add B-row | No | No |
| Backlog item completed | ✅ Added | ✅ Archive row | No | No |
| New CSS file added | ✅ Changed | No | No | ✅ Update CSS list |
| Production push | ✅ Version bump | No | No | No |
| New workflow/skill added | No | No | No | ✅ Add to agent map |
| Pattern discovered | No | No | ✅ Add LL entry | No |
| Deployment config changed | ✅ Infrastructure | No | ✅ Log if it caused a bug | ✅ Update hosting section |
| End of session | ✅ Always | If applicable | If applicable | If structure changed |

---

## ⚠️ The One Non-Negotiable Rule

**Never leave a bug or pattern only in chat.** If you solved a problem this session that took more than 10 minutes to diagnose, it goes in `JANEBLOG_LESSONS_LEARNT.md` before the session ends. Otherwise it's invisible to every future session.
