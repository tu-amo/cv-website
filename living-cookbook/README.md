# 🍳 The Living Cookbook

A personal and collaborative recipe manager. Create and organise recipes privately, share them within a household, or publish them to a public gallery. Powered by AI-assisted scanning, dual-moment photography, and secure household-based sharing.

**Stack:** Next.js 14 (App Router) · Supabase (PostgreSQL + RLS + Storage) · Vercel · Google Gemini AI

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
USDA_FDC_API_KEY=your_usda_fdc_api_key   # Free signup: https://fdc.nal.usda.gov/api-key-signup.html
```

> ⚠️ Never commit `.env.local`. The `SUPABASE_SERVICE_ROLE_KEY` must never appear in client-side code.

### 3. Set up the database
The project uses Supabase CLI for schema management. Migrations are in `supabase/migrations/` and are applied via:
```bash
npm run db:push:staging   # apply to staging
npm run db:push:prod      # apply to production
```
For a fresh database, run `supabase/schema_snapshot.sql` in the Supabase SQL Editor as a baseline, then apply migrations.

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start local dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server locally |
| `npm run lint` | ESLint check |
| `npm run db:status` | Show local vs remote migration state (which migrations are applied where) |
| `npm run db:diff` | Detect schema drift between local migrations and production |
| `npm run db:new <name>` | Create a new timestamped migration file in `supabase/migrations/` |
| `npm run db:push:prod` | Apply pending migrations to **production** |
| `npm run db:push:staging` | Apply pending migrations to **staging** |

---

## Key Documentation

| Document | Purpose |
|---|---|
| [`project_nexus.md`](./project_nexus.md) | Architecture overview, file map, document map, deployment roadmap |
| [`REQUIREMENTS.md`](./REQUIREMENTS.md) | Full feature specification and status |
| [`CHANGELOG.md`](./CHANGELOG.md) | History of every production change |
| [`supabase/schema_snapshot.sql`](./supabase/schema_snapshot.sql) | Canonical database schema reference |

---

## Deployment

The app is deployed to Vercel. Production deploys only happen via merge to `main`.

Active development happens on `feature/collab-kitchen-v2`. See `project_nexus.md` for the full deployment workflow.

---

## Project Structure

```
src/
  app/           → Next.js App Router pages and API routes
  components/    → Shared React components
  lib/supabase/  → Supabase client helpers (server, client, middleware, admin)
  lib/           → Utility libraries (recipe-utils, unit-converter, ingredient-to-grams)
supabase/
  migrations/    → Database migration files (ordered by timestamp)
  schema_snapshot.sql → Full canonical DB state
docs/
  ADR-*.md       → Architecture Decision Records (why decisions were made)
  RE-*.md        → Requirements Engineering lab deliverables (context model, etc.)
.agent/
  docs/          → Project documentation (lessons learnt, onboarding, catalogue)
  workflows/     → Agent workflows (/regression, /cloud-db-sync, /db-migration, etc.)
  skills/        → Reusable skill files (auth, food photo, SEO, etc.)
```
