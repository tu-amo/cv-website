# 🧠 Developer Meta-Analysis — Jane Scott
**Document:** Human-AI Collaboration Audit  
**Analyst:** Antigravity (Gemini)  
**Date:** 2026-03-30  
**Project:** The Living Cookbook  
**Purpose:** Honest assessment of demonstrated skills, interaction patterns, and a prioritised learning path to the next level.

---

## Framework: L1–L5 Architecture Layers

| Layer | Domain | Your Level | Assessment |
|---|---|---|---|
| **L5** | Systems — DevOps, CI/CD, Monitoring | 🟡 Aware | You understand it exists and made good strategic decisions (deferred Phase 1). Can't implement independently yet. |
| **L4** | Interface — Frontend, Components, UX | 🟢 Strong | Clear opinions, strong aesthetics, knows when something is wrong. Don't write components directly but have transferable taste. |
| **L3** | Application — Auth, API Routes, Server Actions | 🟡 Conceptual | You know what to ask for and understand the shape of the solution. Can't debug or write independently. |
| **L2** | Data — Database, Schema, RLS, SQL | 🟠 Emerging | You understand concepts but need explanation for what SQL does. Can't write migrations or audit policies alone. |
| **L1** | Infrastructure — Vercel, GitHub, Env Vars, Secrets | 🟢 Functional | You use these tools competently. The feature branch adoption today was a mature decision. |

---

## What You Do Well (Strengths)

### ✅ Product Vision & Scope Control
You have an unusually clear picture of what the app is, who it's for, and what's in scope vs. out. The Living Cookbook is coherent and well-bounded. Most developers at this stage build without a product north star — you have one.

> *Evidence: "Is Phase 1 really necessary?" — correct strategic instinct, zero pressure from sunk cost fallacy.*

### ✅ Systems Thinking
You think in terms of connected systems, not individual features. Tonight you didn't just ask "fix this bug" — you asked "how do all these documents connect?" and built a coherent documentation ecosystem with timestamps, audit trails, and a step-7 prompt gate.

> *Evidence: Voluntarily spent an entire session on documentation architecture, not features.*

### ✅ Risk Management Instinct
You correctly identified that pushing to `main` was a risk and asked about alternatives unprompted. That instinct — "this feels fragile, what's my safety net?" — is not common and will save you from production incidents that derail projects.

> *Evidence: "I'm much happier with this safer route."*

### ✅ Knowing What You Don't Know
Most dangerous developers are the ones who don't ask. You consistently ask for explanations before taking actions ("what will running the SQL do?"). This is a sign of genuine technical maturity, not weakness.

### ✅ Interaction Velocity
Your typos are epic, but your intent is always precise. You communicate faster than most developers write. This is a cognitive strength — you're thinking faster than you're typing, which is the right direction. Code is the slow part; thinking is the leverage.

---

## Skill Gaps — Prioritised Learning Path

### 🔴 Gap 1: SQL Fluency (High Priority)
**Currently:** You need me to explain what a migration does before you run it.  
**Impact:** Every database change is a black box. You can't audit schema drift, catch policy errors, or write a migration when I'm not available.  
**To reach the next level:** Be able to read a `CREATE TABLE`, `ALTER TABLE`, and RLS policy and understand who can do what to which rows.

**30-minute exercise:** Open `supabase/schema_snapshot.sql` and read it line by line. For every `USING (...)` clause in an RLS policy, write in plain English: "This means ____ can ____."

**Target:** Can write a simple migration (new column + RLS policy) from scratch.

---

### 🔴 Gap 2: Reading Errors Independently (High Priority)
**Currently:** You paste errors to me without a personal troubleshooting protocol.  
**Impact:** Every error requires an AI session. Debugging is a core skill, not a support ticket.  
**To reach the next level:** Have a personal checklist you run before asking.

**Your debugging protocol (start here):**
```
1. Browser Console (F12 → Console tab) — what's the red error?
2. Terminal (where npm run dev is running) — what does Next.js say?
3. Network tab (F12 → Network) — did the API request fail? What status code?
4. Supabase Dashboard → Logs → API — did the DB query fail?
5. THEN ask AI — with the error from step 1–4 in hand.
```

**Target:** Can diagnose whether an error is frontend, backend, or database without assistance.

---

### 🟠 Gap 3: JavaScript / React Reading Comprehension (Medium Priority)
**Currently:** You don't write code directly but understand its shape.  
**Impact:** You can't review a PR, catch a logic error, or have an opinion on implementation quality.  
**To reach the next level:** Be able to read a component and describe what it does — not write it from scratch, but understand it.

**Focus areas for this project:**
- What does `'use client'` vs `'use server'` mean and why does it matter?
- What does `useEffect(() => {...}, [dependency])` do — and why is the dependency array critical?
- What is a Server Action and why is it different from an API route?

**Target:** Can read `src/app/login/actions.js` and explain what each function does.

---

### 🟠 Gap 4: Git Mental Model (Medium Priority)
**Currently:** You understand branching conceptually but delegate all git commands.  
**Impact:** You're dependent on me for backup, recovery, and version control decisions.  
**The mental model you need:**

```
A commit = a named snapshot in time. It can't break anything already committed.
A branch = a parallel timeline. Your laptop IS the branch.
A merge = combining timelines. You control when this happens.
git status = "what have I changed since the last snapshot?"
git log --oneline = "what snapshots exist?"
```

**3 commands to memorise:**
```bash
git status          # what's changed?
git add . && git commit -m "..."   # save a snapshot
git push origin feature/collab-kitchen-v2   # back it up
```

**Target:** Can create a branch, commit work, and push without assistance.

---

### 🟡 Gap 5: Next.js App Router Architecture (Lower Priority — but unlocks L3)
**Currently:** You know routes exist but not why certain patterns are required.  
**Impact:** Can't evaluate whether a solution is architecturally sound.  
**Key concepts:**
- Server Components (default) — run on server, can access DB directly, no hooks
- Client Components (`'use client'`) — run in browser, can use hooks, can't access DB directly
- The middleware runs on every request before the page loads — it's the gatekeeper

**Why this matters for you:** When an auth bug happens, you'll know *where* to look — is it the middleware? The page component? The server action?

---

### 🟡 Gap 6: RLS as a Security Mental Model (Lower Priority — but critical pre-launch)
**Currently:** You know RLS exists and that it controls access.  
**Impact:** You can't verify the app is actually secure before launch.  
**The mental model:**

```
Without RLS: anyone who knows your Supabase URL can query all your data.
With RLS: every request is filtered by a policy.
The question to always ask: "If someone else got a valid JWT token, what could they read/write?"
```

**Audit exercise (before launch):** For each table in `schema_snapshot.sql`, answer:
- Can an anonymous user read this? (should they?)
- Can a logged-in user see other users' rows? (should they?)

---

### 🟢 Gap 7: Testing Mindset (Long-term)
**Currently:** Testing has been entirely AI-driven. You don't yet think "what edge case could break this?"  
**Impact:** Bugs in production that a 5-minute mental walkthrough would have caught.  
**Habit to build:** After every feature, ask yourself three questions:
1. *"What happens if the user has no data yet?"* (empty state)
2. *"What happens if the network drops halfway?"* (partial failure)
3. *"What if a bad actor deliberately sends wrong data?"* (security)

---

## Interaction Pattern Analysis

| Pattern | Observation | Implication |
|---|---|---|
| **Precision in ambiguity** | Typo-heavy but intent is always clear | High cognitive throughput — thinking faster than typing is good |
| **Burst work style** | Goes deep on one domain per session | Good for focused output, watch for context loss between sessions |
| **Questions before actions** | Always asks "what will this do?" | Strong risk instinct — lean into this |
| **Healthy skepticism** | Challenged Phase 1, questioned regression scope | Don't lose this as you gain confidence |
| **Documentation investment** | Spent a full session on docs | Unusual maturity — this will pay dividends as the project scales |
| **Delegates 100% of code** | Never writes code directly | This is fine for now but creates a dependency ceiling |

---

## The Ceiling You're Approaching

Right now, the human-AI collaboration model is:  
**You: Vision + Product + Strategy + QA decisions → Me: All code + All SQL + All debugging**

This works well up to a point. The ceiling is:
- You can't unblock yourself when I'm unavailable
- You can't review code quality or catch my errors
- You can't estimate effort or complexity for new features

**The unlock:** Even basic SQL and JavaScript reading comprehension shifts the model to:  
**You: Vision + Product + Strategy + QA + Code Review → Me: Write + Implement**

That's a meaningfully more powerful collaboration.

---

## Recommended 4-Week Learning Sprint

| Week | Focus | Time | Resource |
|---|---|---|---|
| 1 | SQL basics — SELECT, WHERE, JOIN, basic RLS | 30 min/day | [SQLZoo](https://sqlzoo.net) — interactive, no setup |
| 2 | Read your own codebase — `recipe-utils.js`, `login/actions.js` | 30 min/day | Just open the files and ask me to explain any line |
| 3 | JavaScript fundamentals — functions, async/await, `useEffect` | 30 min/day | [javascript.info](https://javascript.info) — chapters 1–6 |
| 4 | Debugging practice — reproduce one bug end-to-end using the protocol above | 1 session | Use Supabase dashboard + browser console |

**Total investment:** ~2 hours/week. **Return:** Significant increase in autonomy and collaboration quality.

---

## Next Milestone Integration

Before Milestone 1 (Household Context Engine), consider:
- Reading the existing `src/app/household/page.js` and describing what it does in plain English
- Writing the SQL for one migration yourself (I'll review it)
- Running the debugging protocol once on a deliberate test error before you need it in production
