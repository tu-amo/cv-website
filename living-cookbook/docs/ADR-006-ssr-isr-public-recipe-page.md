# ADR-006: SSR + Incremental Static Regeneration for the Public Recipe Page

## Status
Accepted

## Date
2026-04-03

## Context

The public recipe page (`/public/recipe/[id]`) is the primary unauthenticated surface of The Living Cookbook. It is the URL shared externally — the page a guest sees when a recipe link is sent to them.

**Initial implementation**: The page was a React Client Component. On load, it:
1. Fetched recipe data from Supabase client-side
2. For each image, called back to Supabase Storage for a signed URL (separate per-image round trip)

This created a render waterfall:
```
Page HTML loads → React hydrates → fetch recipe → fetch signed URLs → images appear
         ↑
     ~3.2s LCP observed in Lighthouse
```

**Constraints:**
- Supabase Storage images are in a private bucket — they require signed URLs (no public CDN URLs)
- Signed URLs are valid for 1 hour — well above any reasonable CDN cache window
- Public recipes are read-mostly — a specific recipe changes rarely
- The page must be accessible without authentication — server-side Supabase queries must use the anon key with RLS policies that permit public reads (`is_public = true`)

**Options considered:**

| Option | LCP impact | Complexity |
|---|---|---|
| A — Keep client-side fetch | Poor (3.2s+) | Low |
| B — Server Component, no caching | Good (data server-side) | Medium |
| C — Server Component + ISR (`revalidate = 300`) | Best (CDN-served for 5 min) | Medium |
| D — Full static generation (`generateStaticParams`) | Best possible, but requires pre-knowing all recipe IDs | High — not viable for user-generated content |
| E — Edge runtime | Marginal gain over C, adds constraints | High |

## Decision

Convert `/public/recipe/[id]/page.js` to a **Next.js Server Component** with **Incremental Static Regeneration at a 5-minute interval**:

```js
export const revalidate = 300; // seconds
```

Data fetching and signed URL resolution happen **in parallel server-side** before the first byte is sent to the browser:

```js
const [recipe, signedUrls] = await Promise.all([
    fetchRecipe(id),
    resolveSignedUrls(imageKeys),
]);
```

Interactive behaviour (servings scaler, shopping list add, nutrition panel) is extracted into a `PublicRecipeClient.js` Client Component, which receives pre-resolved data as props.

## Rationale

1. **Eliminates the render waterfall** — the browser receives fully-rendered recipe HTML on the first response; no client-side fetches needed for the initial paint
2. **Signed URLs have a 1-hour TTL** — the 5-minute ISR period is 12x shorter than the signed URL validity window, eliminating the risk of expired URLs in ISR-cached HTML
3. **Recipes are read-mostly** — a 5-minute cache window is acceptable; the trade-off (slightly stale content) is benign for recipe data
4. **ISR serves from Vercel CDN** — subsequent visitors within the 5-minute window receive the cached HTML from the edge, bypassing the origin entirely

## Trade-offs Accepted

- **Stale content window**: Edits to a public recipe take up to 5 minutes to appear at the public URL. This is acceptable for recipe content; it would not be acceptable for stock levels or real-time data.
- **Two-component architecture**: The page is split into a Server Component (`page.js` — data + render) and a Client Component (`PublicRecipeClient.js` — interactivity). This adds a file and a conceptual boundary that must be maintained consistently.
- **Signed URL embedding**: Signed URLs are baked into ISR-cached HTML. If Supabase Storage ever reduces the TTL below 5 minutes, cached pages may have expired image URLs until the next revalidation. **This is a dependency that must be explicitly monitored.**
- **No per-user personalisation possible**: Server Components rendered at the page level cannot access user session — this is intentional for a public page, but means the public recipe view cannot show "Save to my cookbook" in a server-rendered state.

## Consequences

- **Positive**: LCP improved from ~3.2s to <1s for ISR-warm pages. Lighthouse performance score increased by approximately 30 points. Supabase query load reduced proportionally to cache hit rate.
- **Negative**: The two-component split (`page.js` → server, `PublicRecipeClient.js` → client) must be understood by future developers. Mixing server and client code in this file will cause build errors.
- **Mitigation**:
  - File-level comments explain the server/client split
  - The pattern is documented here and referenced in `project_nexus.md`
  - Signed URL TTL is noted as a dependency to monitor

## Revisit Trigger

Reconsider when:
- Real-time recipe collaboration is introduced — at that point, ISR's 5-minute staleness becomes unacceptable and streaming SSR or WebSockets are needed
- Supabase Storage signed URL TTL is reduced below 10 minutes — the ISR period must be reduced proportionally, or a server-side URL refresh endpoint added
- The recipe page becomes personalised (e.g., "You've saved this recipe") — at that point an authenticated SSR path must be introduced alongside the public cached path
- `next/image` with the Supabase Storage domain is configured — at that point, images can be served through Next.js's image optimisation pipeline, with separate cache TTLs per image

## Related Decisions

- [ADR-003](ADR-003-ai-image-route-isolation.md) — Same session: isolated API routes for non-standard feature profiles
- [ADR-005](ADR-005-public-api-nutrition-route.md) — The public recipe page is an unauthenticated caller of `/api/nutrition`
