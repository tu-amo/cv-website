# ADR-012: Anonymous RLS Policies for Public Recipe Related Tables

## Status
Accepted

## Date
2026-04-04

## Context

The Living Cookbook allows public recipe pages (`/public/recipe/[id]`) to be accessed without authentication (ADR-005, ADR-006). The `recipes` table already had an anonymous SELECT policy that permitted reading rows where `is_public = true`.

However, a complete recipe page requires data from **five related tables**:

| Table | Contents | Previous RLS policy |
|---|---|---|
| `recipe_ingredients` | Ingredient quantities, units, preparation notes per recipe | `auth.uid() IS NOT NULL` — auth required |
| `instruction_steps` | Cooking method steps per recipe | `auth.uid() IS NOT NULL` — auth required |
| `recipe_notes` | General notes attached to a recipe | `auth.uid() IS NOT NULL` — auth required |
| `ingredients` | Canonical ingredient name lookup table | `auth.uid() IS NOT NULL` — auth required |
| `sources` | Book/URL attribution for a recipe | `auth.uid() IS NOT NULL` — auth required |

With these RLS policies in place, an anonymous visitor loading a public recipe received:

- ✅ The recipe header (title, description, servings) — from `recipes` (already public)
- ❌ Empty ingredients list — `recipe_ingredients` blocked
- ❌ Empty method — `instruction_steps` blocked
- ❌ No notes — `recipe_notes` blocked
- ❌ No source attribution — `sources` blocked

The public recipe page was structurally present but functionally empty for anonymous visitors.

**The fix options:**

| Option | Approach | Risk |
|---|---|---|
| A — Require login to see full recipe | Forces authentication to view any shared recipe | Breaks the sharing use case entirely |
| B — Fetch all related data server-side using `supabaseAdmin` and bypass RLS | Works but leaks private recipe data if the guard logic is wrong | High — any bug could expose private recipes |
| C — Add scoped anon SELECT policies on each related table | Keeps RLS as the boundary; anonymous reads are strictly scoped to `is_public` recipes | Low — data isolation enforced at DB layer |

## Decision

Add anonymous SELECT RLS policies on all five related tables, scoped to the public recipe surface.

### Policy Pattern: Subquery Scope (four tables)

For `recipe_ingredients`, `instruction_steps`, `recipe_notes`, and `sources`, anonymous reads are permitted only for rows that belong to a public recipe:

```sql
-- recipe_ingredients
CREATE POLICY "anon_read_public_recipe_ingredients"
ON recipe_ingredients FOR SELECT
USING (
  recipe_id IN (
    SELECT id FROM recipes WHERE is_public = true
  )
);

-- instruction_steps
CREATE POLICY "anon_read_public_instruction_steps"
ON instruction_steps FOR SELECT
USING (
  recipe_id IN (
    SELECT id FROM recipes WHERE is_public = true
  )
);

-- recipe_notes
CREATE POLICY "anon_read_public_recipe_notes"
ON recipe_notes FOR SELECT
USING (
  recipe_id IN (
    SELECT id FROM recipes WHERE is_public = true
  )
);

-- sources
CREATE POLICY "anon_read_public_sources"
ON sources FOR SELECT
USING (
  id IN (
    SELECT source_id FROM recipes
    WHERE is_public = true AND source_id IS NOT NULL
  )
);
```

### Policy Pattern: Open Reference Data (one table)

For `ingredients`, anonymous SELECT is permitted without restriction:

```sql
CREATE POLICY "anon_read_ingredients"
ON ingredients FOR SELECT
USING (true);
```

**Rationale for the open policy on `ingredients`**: The `ingredients` table contains only canonical ingredient names (`butter`, `flour`, `garlic`). This is reference data — equivalent to a public dictionary. There is no PII, no user-specific data, and no household-specific data in this table. Scoping it by `is_public` recipes would be technically possible but adds query complexity with no security benefit.

## Rationale

1. **RLS remains the isolation boundary** — anonymous reads are enforced at the database layer via the subquery scope, not by application-layer guards that could be bypassed
2. **The existing `is_public` flag is the single source of truth** — no new visibility mechanism is introduced; the subquery reuses the existing field
3. **Public recipe data is non-sensitive by definition** — a recipe marked `is_public = true` has been explicitly made public by its author; its ingredients and method are intended to be world-readable
4. **Option B (`supabaseAdmin` bypass) was rejected** — bypassing RLS for the public page creates a code path where any implementation bug could return private recipe data; the RLS approach makes this structurally impossible

## Trade-offs Accepted

- **Anonymous read surface is widened** — five additional tables are now readable without authentication, where previously they required a session. This is intentional and scoped.
- **Subquery policies add DB query cost** — each anonymous read on `recipe_ingredients` executes a subquery against `recipes`. This is mitigated by:
  - The ISR caching layer (ADR-006) means anonymous reads of public recipes are rare — the page is served from CDN cache, not from a fresh DB query, for 5-minute windows
  - PostgreSQL query planner optimises the subquery with the existing `id` index on `recipes`
- **`recipe_notes` scope is a future risk** — if notes are later used for user-sensitive content (private diary entries, household-only comments), the anon policy on `recipe_notes` must be removed or scoped more tightly

## Consequences

- **Positive**: Anonymous visitors see complete public recipe pages — ingredients, method, notes, and source attribution — without requiring authentication
- **Negative**: `recipe_notes` for public recipes are world-readable; if the product evolves to use notes for sensitive content, this policy must be revisited
- **Mitigation**:
  - Document `recipe_notes` anon visibility in the schema snapshot
  - When private/household notes are introduced as a feature, use a separate table (`private_notes`) rather than adding a visibility column to `recipe_notes` — this keeps the RLS policy boundaries clean

## Revisit Trigger

Reconsider when:
- Recipe notes are extended to support private or household-scoped content — remove `recipe_notes` from the anon policy scope at that point and introduce a `private_notes` table
- The recipe detail page is redesigned to show personalisation to anonymous users (e.g. "Log in to save this recipe" CTA that requires knowing if the user has saved it) — at that point, anonymous RLS alone is insufficient and a soft-auth pattern may be needed

## Related Decisions

- [ADR-002](ADR-002-rls-as-service-boundary.md) — The RLS framework these policies extend; this ADR adds anonymous entries to the access model
- [ADR-005](ADR-005-public-api-nutrition-route.md) — Public recipe page context (anonymous access surface)
- [ADR-006](ADR-006-ssr-isr-public-recipe-page.md) — ISR caching means anonymous DB reads are infrequent; reduces the performance cost of the subquery policies
