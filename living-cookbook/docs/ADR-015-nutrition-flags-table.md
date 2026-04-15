# ADR-015: Nutrition Flags Table for User-Reported USDA Mismatches

## Status
Accepted

## Date
2026-04-07

## Context

The Living Cookbook's nutrition counter (ADR-004) uses the USDA FoodData Central API to look up calorie and macro data for each ingredient. USDA search returns the highest-confidence match for a given query, but ingredient names in recipes are often ambiguous, colloquial, or locale-specific (e.g. "chinese spice" may match "Broccoli, chinese, cooked" rather than "Five-spice powder").

When USDA returns a clearly wrong match, two people are affected:
1. **The current user** — sees misleading nutrition counts for a recipe they are cooking
2. **Future users** — the wrong match is cached in `nutrition_cache` for 90 days (ADR-004)

We needed a mechanism for users to report these mismatches so they can be periodically reviewed and corrected (by updating `QUERY_BOOSTS` in the nutrition API or by flushing the offending cache entry).

**Options considered for capturing reports:**

| Option | Problem |
|---|---|
| A — Sentry error event per flag | Sentry has no lifecycle management (open/resolved/won't fix); flags cannot be queried or triaged programmatically; expensive if volume grows |
| B — Column on `nutrition_cache` (`flagged`, `flagged_by`) | `nutrition_cache` uses `ingredient_name` as its PK; coupling a feedback workflow to a cache table creates schema confusion; one flag per ingredient (no per-user deduplication); cache TTL expiry would delete the flag |
| C — Separate `nutrition_flags` table | Clean separation of concerns; independent RLS; supports per-user deduplication; supports status lifecycle (`open → resolved / wont_fix`); survives cache flushes; queryable — chosen |
| D — Google Form / external tool | No integration with the app; no per-ingredient context; manual copy-paste required from users |

## Decision

Create a dedicated **`nutrition_flags`** table to record user-reported USDA match problems. The table is write-once from the user's perspective (flag it and forget it); the maintenance lifecycle (`resolved`, `wont_fix`) is managed by the developer via SQL.

### Schema

```sql
CREATE TABLE IF NOT EXISTS nutrition_flags (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_name  text        NOT NULL,   -- what was searched (e.g. "chinese spice")
    usda_name        text,                   -- what USDA returned (e.g. "Broccoli, chinese")
    usda_fdc_id      integer,                -- USDA FDC ID for the matched food
    kcal_100g        numeric,                -- the suspicious kcal/100g value
    confidence       text,                   -- 'high' | 'medium' | 'low'
    recipe_id        bigint      REFERENCES recipes(id) ON DELETE SET NULL,
    flagged_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    flagged_at       timestamptz NOT NULL DEFAULT now(),
    status           text        NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('open', 'resolved', 'wont_fix')),
    resolution_note  text        -- e.g. "Added to QUERY_BOOSTS: chinese spice → five spice powder"
);
```

### Status Lifecycle

```
open  ──────► resolved    (QUERY_BOOSTS updated + cache flushed)
      └──────► wont_fix   (ingredient is too niche / match is actually correct)
```

### RLS

The `nutrition_flags` route (`/api/nutrition/flag`) uses `supabaseAdmin` to insert because `nutrition_flags` has no user-accessible INSERT policy — flags are a moderation input, not user-owned data. User identity is verified via JWT before the admin write (ADR-007, ADR-014).

```sql
-- Any authenticated user can flag (write-only via API)
CREATE POLICY "Authenticated users can flag nutrition matches"
    ON nutrition_flags FOR INSERT TO authenticated
    WITH CHECK (flagged_by = auth.uid());

-- Users can see their own flags (prevents duplicate flagging)
CREATE POLICY "Users can view their own flags"
    ON nutrition_flags FOR SELECT TO authenticated
    USING (flagged_by = auth.uid());
```

### Maintenance Query

To review open flags periodically (paste into Supabase SQL Editor):

```sql
SELECT
    ingredient_name,
    usda_name,
    kcal_100g,
    confidence,
    COUNT(*) AS flag_count,
    MIN(flagged_at) AS first_flagged
FROM nutrition_flags
WHERE status = 'open'
GROUP BY ingredient_name, usda_name, kcal_100g, confidence
ORDER BY flag_count DESC, first_flagged ASC;
```

For each high-count row:
1. Add an entry to `QUERY_BOOSTS` in `src/app/api/nutrition/route.js`
2. Flush the cache entry: `DELETE FROM nutrition_cache WHERE ingredient_name = 'xxx'`
3. Mark the flag resolved: `UPDATE nutrition_flags SET status = 'resolved', resolution_note = '...' WHERE ingredient_name = 'xxx' AND status = 'open'`

### UX

The flag button appears in the NutritionPanel breakdown table next to each ingredient row. It is a small icon button (🚩) that:
- Fires `POST /api/nutrition/flag` with the ingredient context
- Is optimistically disabled after click (no double-flagging within a session)
- Shows a toast confirming the flag was recorded

## Rationale

1. **Separation of concerns** — a feedback/moderation table should not be entangled with a cache table; they have different TTLs, different owners, and different access patterns
2. **Queryable for maintenance** — unlike Sentry events, SQL allows aggregation by ingredient name to identify the highest-impact misfires first
3. **Survives cache flushes** — if a cache entry is deleted to force a fresh USDA lookup, the flag record is untouched; the two tables are independent
4. **Per-user deduplication** — the API checks for an existing open flag from the same user before inserting, preventing spam without requiring a unique constraint
5. **Status lifecycle** — `resolution_note` creates an audit trail: future developers can see why a flag was resolved and what change was made

## Trade-offs Accepted

- **Manual maintenance process** — there is no admin UI; reviewing flags requires pasting a SQL query into the Supabase SQL Editor. This is acceptable at current scale (low flag volume expected).
- **No notifications** — the developer is not alerted when new flags arrive; they must proactively run the maintenance query. Mitigated by scheduling this in the `/update-docs` Step 7e periodic review.
- **supabaseAdmin for INSERT** — the flag insert bypasses RLS because `nutrition_flags` is a moderation table, not a user data table. This is documented in ADR-014 and follows all ADR-007 rules (identity verified before write, no user-supplied IDs).

## Consequences

- **Positive**: Users have a low-friction path to report problems they'd previously just ignore; the maintenance query gives actionable signal for improving `QUERY_BOOSTS` over time
- **Negative**: Adds to the `supabaseAdmin` use site count (now 5 sites); adds a maintenance responsibility that must actually be exercised periodically
- **Mitigation**: The `/update-docs` workflow Step 7e includes the density miss review; add nutrition flags review to the same cadence

## Revisit Trigger

Reconsider when:
- Flag volume exceeds ~50 open items — build a simple admin review UI rather than raw SQL
- Multiple developers are managing flags — add a `resolved_by` column and an admin-only UPDATE policy
- The nutrition provider changes from USDA — evaluate whether the flag data is still meaningful (ingredient names may differ across providers)

## Related Decisions

- [ADR-004](ADR-004-nutrition-caching-usda.md) — The nutrition cache system this table monitors; `nutrition_cache` and `nutrition_flags` are siblings, not parent/child
- [ADR-007](ADR-007-named-service-role-client.md) — `supabaseAdmin` use at the flag insert site
- [ADR-014](ADR-014-supabaseadmin-join-and-signup.md) — Documents this as one of the five authorised `supabaseAdmin` use sites
