# 🚀 Publish Workflow — janeblog.com
**Last Reviewed:** 2026-05-24

Run this before every production push. Takes ~2 minutes.

> ⚠️ **AGENT INSTRUCTION:** Before running `git push`, always confirm the working directory is `/Users/janescott/Projects/Anti` (the janeblog repo root), NOT inside `living-cookbook/`. Run `git rev-parse --show-toplevel` to verify.

---

## Step 1: Confirm you're in the right repo

```bash
git rev-parse --show-toplevel
```
**Expected:** `/Users/janescott/Projects/Anti`  
**If you see** `.../living-cookbook` — stop. You are in the wrong repo.

---

## Step 2: Review what's changing

```bash
git status
git diff --stat
```

- Are the files listed what you expect?
- Are any living-cookbook files accidentally staged? (They shouldn't be — different git repo — but double-check.)

---

## Step 3: Update CHANGELOG.md

Open `CHANGELOG.md` and add an entry under `## [Unreleased]`:

```markdown
## [YYYY-MM-DD]

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

If this is a small fix, a single `### Fixed` line is fine.

---

## Step 4: Quick visual check

Open http://localhost:5173 and verify:
- [ ] Homepage loads correctly
- [ ] Navigation links work (Writing, Booking, CV)
- [ ] No obvious layout breaks on the pages you changed

---

## Step 5: Commit and push

```bash
git add -A
git commit -m "type: short description of what changed"
git push
```

**Commit type prefixes:**
| Prefix | When to use |
|---|---|
| `feat:` | New feature or section |
| `fix:` | Bug fix |
| `style:` | CSS/layout change (no content change) |
| `content:` | New article or copy change |
| `docs:` | Documentation only |
| `chore:` | Dependency, config, or tooling |

---

## Step 6: Verify on production

Wait ~60 seconds for Cloudflare Pages to deploy, then:

1. Visit https://janeblog.com and hard-refresh (`Cmd+Shift+R`)
2. Confirm the change is live
3. If something looks wrong: Cloudflare Dashboard → Pages → cv-website → Deployments → previous deployment → Rollback
