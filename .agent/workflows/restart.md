---
description: Emergency Server Recovery (Clear Port 3000 + Restart)
---

# 🔄 Local Chef Recovery Workflow
**Last Reviewed:** 2026-04-11 — fixed `npm run dev` PATH issue (LL-049)

Use this if `http://localhost:3000` is unreachable or "Connection Refused".

## Step 1: Clear Port 3000
Find and terminate any zombie processes blocking the kitchen.

// turbo
```bash
lsof -ti :3000 | xargs kill -9 || true
```

## Step 2: Ignite the Server
Start the development environment in the cookbook directory.

> **Note:** Plain `npm run dev` fails in this shell environment because `/usr/local/bin`
> is not in the default PATH. The command below sets it explicitly.

// turbo
```bash
PATH=/usr/local/bin:$PATH npm run dev
```

## Step 3: Verify Connection
Check the kitchen status: [http://localhost:3000](http://localhost:3000)

---

## Known Warnings (non-blocking)

| Warning | Cause | Action |
|---|---|---|
| `Workspace root inferred...` | Two `package-lock.json` files (`Anti/` and `living-cookbook/`) | Silence by setting `turbopack.root` in `next.config.mjs` — not urgent |
| `"middleware" file convention is deprecated` | `src/middleware.js` should become `src/proxy.js` (LL-024, ADR-011) | Non-urgent; still functional |
