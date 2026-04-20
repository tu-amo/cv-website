---
name: documentation-hygiene
description: >-
  Use when logging a backlog item, updating the roadmap, ending a session,
  or wondering where a piece of information belongs in the project docs.
metadata:
  category: discipline
  triggers: backlog, B-series, where to log, update docs, add to roadmap, active plan, brain artifact, session summary, lessons learnt, cross-reference, single source of truth, changelog, REQUIREMENTS, ROADMAP
---

# Documentation Hygiene — Living Cookbook

Governs where every kind of information lives. Violating the letter of these rules is violating the spirit.

---

## The Document Hierarchy

```
docs/ROADMAP.md           ← canonical home for B-series backlog + active plans (FULL DETAIL)
REQUIREMENTS.md           ← summary rows only, with → ROADMAP.md as the reference
project_nexus.md          ← catalog entry + active plan status (1–2 lines each)
CHANGELOG.md              ← what changed this session, grouped by type
.agent/docs/LESSONS_LEARNT.md ← engineering patterns distilled for future sessions
brain/*/implementation_plan.md ← working document — MUST be mirrored to ROADMAP before session ends
```

**The rule: ROADMAP.md wins.** If there is a conflict between any two documents, update all others to match ROADMAP.md. It is never OK for brain artifacts to be the only place a decision lives.

---

## Backlog Items (B-series)

**ALWAYS use this procedure when a backlog item is identified:**

1. Add the full row to `docs/ROADMAP.md` **Feature Backlog** table first — ID, title, full notes, date.
2. Add a summary row to `REQUIREMENTS.md` backlog section.
3. Mention it in `CHANGELOG.md` under `### Added` for the current session.
4. NEVER log a backlog item only in a brain artifact or inline conversation note.

**Marking done:**
- ~~Strikethrough~~ the B-number in ROADMAP.md and add `**DONE [date]**` in the Notes column.
- Do NOT delete done items — they are the project's audit trail.

**B-number assignment:** ALWAYS use the next sequential number. Check ROADMAP.md for the current highest B-number before assigning.

### Common Rationalizations — STOP

| Excuse | Reality |
|---|---|
| "I'll log it in the brain artifact for now" | Brain artifacts are scratch. They get truncated. Log it in ROADMAP.md or it's lost. |
| "It's too small to be a backlog item" | If it's worth doing, it's worth tracking. Add it. |
| "I already mentioned it in chat" | Conversation is ephemeral. Docs are permanent. |
| "I'll update the docs at the end" | Session ends, context truncates. Docs first, code second. |

---

## Active Engineering Plans

Every multi-session plan gets one row in `docs/ROADMAP.md` **Active Engineering Plans** table:

```
| Plan name | Document path | Status emoji + one-line status | Next action |
```

**Status emojis:** ✅ Done · 🟡 In progress · 🟠 Blocked · ⏳ Not started

ALWAYS update the status row at the end of every session the plan is touched.  
NEVER let a plan exist only in a brain artifact implementation_plan.md with no ROADMAP.md row.

---

## Session Documentation (end-of-session rule)

At the end of every session that produces code changes, ALL of the following must be updated:

- [ ] `CHANGELOG.md` — Added / Fixed / Changed entries under `[Unreleased]`
- [ ] `docs/ROADMAP.md` — B-series items done/added, active plan status updated
- [ ] `.agent/docs/LESSONS_LEARNT.md` — new LL entries for any bug post-mortems or pattern discoveries
- [ ] `project_nexus.md` — version bump + active plan status (if changed)
- [ ] Git commit: `docs: session update YYYY-MM-DD — brief description`

**Order matters:** Documentation BEFORE the git commit. Never commit code without simultaneously committing docs.

---

## LESSONS_LEARNT.md

Every bug that produces a new pattern gets an LL entry. The minimum entry contains:

1. **ID** — next sequential LL-NNN
2. **Date, Type, Severity**
3. **Symptom** — what the user or developer experienced
4. **Root Cause** — the actual reason (not the symptom)
5. **Fix** — what was done
6. **Rule** — the actionable, forward-looking pattern to prevent recurrence

After adding the entry, check whether it justifies a new or updated skill. Add the skill (or update the skill pipeline table) if yes.

NEVER write "added to lessons learnt" in the chat without actually writing the LL entry.

---

## Cross-Document Linking

| When | Use |
|---|---|
| Referencing a specific bug or pattern | `(LL-059)` inline |
| Referencing a backlog item | `(B7)` inline |
| Referencing an ADR | `(ADR-018)` inline |
| Linking between docs | Relative path `../docs/ROADMAP.md` |
| Brain artifact reference | Specify the conversation ID — don't assume it will be found |

NEVER create a reference that only exists inside a brain artifact. If it matters, it lives in the project.

---

## What Lives Where (Quick Reference)

| Information | Where it goes | NEVER in |
|---|---|---|
| New feature idea / backlog item | `docs/ROADMAP.md` feature backlog | Brain artifact only |
| Bug post-mortem / lesson | `LESSONS_LEARNT.md` | Inline chat only |
| Architecture decision | `docs/ADR-NNN-title.md` | Brain artifact only |
| Session change log | `CHANGELOG.md [Unreleased]` | Brain artifact only |
| Working implementation notes | `brain/*/implementation_plan.md` | Permanent docs (unless mirrored) |
| Active plan status | `docs/ROADMAP.md` active plans table | Brain artifact only |

---

## Red Flags — STOP and Update Docs First

If any of these are true, stop and update documentation before continuing with code:

- You are about to start a new extraction / refactor step without updating the task status
- You logged a backlog item only in the brain artifact
- The ROADMAP.md active plan status is more than one session out of date
- You added a new LL entry without checking whether a skill needs updating
- The session has produced code changes but CHANGELOG.md has not been touched

---

## Related Files

- `docs/ROADMAP.md` — feature backlog + active plans (canonical)
- `REQUIREMENTS.md` — summary priority table
- `CHANGELOG.md` — session history
- `.agent/docs/LESSONS_LEARNT.md` — pattern library
- `.agent/workflows/update-docs.md` — step-by-step update workflow
