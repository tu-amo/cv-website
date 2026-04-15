# ADR-003: AI Image Generation as Isolated API Route

## Status
Accepted

## Date
2026-04-03

## Context

The Living Cookbook includes a "Magic Brief" feature that generates cinematic recipe images using the Google Gemini API. This feature has a fundamentally different profile from all other application features:

- **Latency**: 10–30 seconds per request (vs. <200ms for database queries)
- **Cost**: Each call consumes Gemini API quota (rate-limited, paid per token)
- **Dependencies**: Gemini SDK only — no database access required
- **Failure modes**: 429 (quota exceeded) and 503 (model overload) are expected, not exceptional
- **Statefulness**: Completely stateless — input prompt in, image out

Options considered:
- **Option A**: Inline in the recipe page server component — call Gemini directly in a React Server Component
- **Option B**: Next.js API route (`/api/generate-images`) — isolated, callable via fetch from client
- **Option C**: Separate standalone microservice — deployed independently of the Next.js app
- **Option D**: Third-party image generation SaaS with a pre-built integration

## Decision

We will implement AI image generation as an **isolated Next.js API route at `/api/generate-images`**, callable from the client via `fetch`. The route has no database access and handles Gemini quota errors with explicit user-facing feedback (toast notifications for 429/503 responses).

## Rationale

1. **Natural isolation boundary** — the feature has no shared state with the rest of the application; it is a pure function (prompt → image)
2. **Different latency profile** — isolating it as an API route allows the client to handle the long wait asynchronously without blocking UI rendering
3. **Quota error handling** — centralising quota error handling in one route (rather than scattered across components) makes it easy to add retry logic, quota tracking, or provider switching later
4. **Microservice readiness** — if this route ever needs to be extracted into a standalone service, the API contract (`POST /api/generate-images`) is already defined; only the destination changes

Option C (standalone microservice) was rejected because:
- Single developer — operational overhead of a second deployment is not justified yet
- No need for independent scaling at current traffic levels

## Trade-offs Accepted

- **No queue / async job system** — if Gemini takes 30 seconds and the user navigates away, the generation is lost; there is no background job to retry
- **No rate limiting on our side** — a determined user could exhaust Gemini quota rapidly; we rely on Gemini's own quota enforcement
- **Vercel function timeout** — at 30s+ generation times, this route is at risk of hitting Vercel's default 10s function timeout on hobby plans

## Consequences

- **Positive**: Clean separation of AI concerns from data concerns; easy to swap Gemini for another provider (Stability AI, DALL-E) by changing only this route; explicit quota error messages improve UX
- **Negative**: No resilience for long-running requests; no job queue for retries
- **Mitigation**:
  - Set Vercel function timeout to 60s (`maxDuration: 60` in route config)
  - Display a clear loading state and timeout message in the UI
  - Log quota errors for monitoring

## Revisit Trigger

Reconsider and extract to a standalone service when **any** of the following occur:
- Image generation needs a job queue (async, retryable background jobs)
- Multiple AI providers need to be supported with routing logic
- Per-user quota tracking and enforcement is needed
- The Gemini integration is shared with a second application

## Related Decisions

- [ADR-001](ADR-001-shared-database.md) — This route is the first exception to the shared-DB pattern; it touches no tables
- [ADR-002](ADR-002-rls-as-service-boundary.md) — RLS does not apply here as there is no DB access
