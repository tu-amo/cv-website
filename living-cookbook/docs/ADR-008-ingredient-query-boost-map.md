# ADR-008: Ingredient Name Normalisation and Query Boost Map

## Status
Accepted

## Date
2026-04-03

## Context

The USDA FoodData Central API accepts a free-text search query and returns a ranked list of matching food items. For common cooking ingredients, the top USDA result is not always the intended item:

| Plain ingredient name | USDA top result without boost | Expected cooking item |
|---|---|---|
| `butter` | "Butter, whipped, with salt" | Salted butter |
| `flour` | "Wheat flour, enriched" or corn flour variant | Plain wheat flour |
| `cream` | "Cream-filled sandwich cookies" | Heavy or single cream |
| `oil` | "Oil, industrial, palm" | Vegetable or olive oil |

The `/api/nutrition/route.js` file contains a `QUERY_BOOSTS` map — a hand-curated dictionary that rewrites the search term sent to USDA for selected ingredients. The lookup uses the cleaned ingredient name (lowercased, trimmed, prep notes stripped) as the key:

```js
const query = cleanIngredientName(rawName);  // e.g. "butter, softened" → "butter"
const searchTerm = QUERY_BOOSTS[query] || query;
```

The question this ADR addresses: **why hand-curated rather than algorithmic, and what is the governance model as the recipe library grows?**

**Options considered:**

| Option | Approach | Problem |
|---|---|---|
| A — No normalisation; trust USDA ranking | Simple, zero maintenance | Produces wrong results for ambiguous terms — degrades user trust in calorie data |
| B — Algorithmic NLP-based term expansion | Scalable, no manual upkeep | Requires training data and a model; adds dependency and latency for marginal gain over a small curated map |
| C — User-selectable USDA item (let user pick from results) | Accurate; user-controlled | High UX friction; calorie panel should be instant, not a search dialog |
| D — Hand-curated `QUERY_BOOSTS` map | Deterministic, auditable, zero runtime cost | Requires manual updates when new ingredients miss; finite coverage |
| E — Move curated mappings to a DB table | Adminable without deploys | Over-engineered for current scale; a code-level map is sufficient while the recipe library is small |

## Decision

Use a **hand-curated `QUERY_BOOSTS` map in `route.js`** as the ingredient-to-USDA-query translation layer. Ingredient names are normalised (lowercased, trimmed, prep notes stripped via `cleanIngredientName()`) before lookup, with the boost map providing the final USDA search term.

### When to add a boost entry

A boost entry should be added when **all three conditions hold**:

1. The plain ingredient name produces a wrong or misleading USDA top result
2. A more specific USDA search term reliably produces the correct item as the top result
3. The ingredient appears in at least one saved recipe in the library (do not pre-populate speculatively)

### When NOT to add a boost entry

- Do not add boosts to disambiguate between two equally valid ingredients (e.g. "unsalted butter" vs "salted butter") — the recipe ingredient should carry enough specificity
- Do not add boosts that are culturally or regionally specific without testing against USDA's actual index — many European-specific ingredients (Quark, Schmand) may not appear in USDA regardless of the boost term

### Maintenance protocol

1. **Proactive discovery**: When a new recipe is added, open the NutritionPanel on the recipe detail page and eyeball the per-ingredient calorie values. A value of `< 5 kcal/100g` or `> 900 kcal/100g` for a whole food ingredient is a strong signal that the wrong USDA item was matched.
2. **Detection**: When a recipe displays an obviously wrong calorie value, note the ingredient name.
3. **Verification**: Search the plain term directly in the [USDA FoodData Central web search](https://fdc.nal.usda.gov/) to identify the correct USDA item name.
4. **Addition**: Add the entry to `QUERY_BOOSTS` with a comment if the match required non-obvious reasoning:
   ```js
   'cream': 'cream heavy whipping',  // "cream" alone matches sandwich cookies
   ```
5. **Test**: Reload the recipe page and verify the calorie value is plausible.

## Rationale

1. **Deterministic and auditable** — a code-level map is trivially grepable and reviewable; every translation decision is visible and documented in source control
2. **Zero runtime cost** — the map is an in-memory object; the lookup is a single O(1) key access with no additional latency
3. **Proportionate to current scale** — the recipe library is small; the boost map covers 95% of common ingredients with 20–30 entries; algorithmic solutions are over-engineered for this phase
4. **NLP approaches are not calibrated to USDA's taxonomy** — USDA uses its own food categorisation that doesn't map cleanly to cooking ingredient names; a general NLP approach would require USDA-specific fine-tuning to be reliable

## Trade-offs Accepted

- **Manual maintenance required** — new ingredients that produce wrong results require a developer to add a boost entry and deploy
- **No coverage for long-tail ingredients** — exotic or regional ingredients will produce poor USDA matches and no boost entry will exist; calorie data will simply be wrong or absent for these
- **Entries can become stale** — if USDA reindexes their data and changes result rankings, existing boost entries could stop working without any observable signal
- **Silent wrong-match caching** — without a correctness guard, a wrong USDA result is fire-and-forget written to the 90-day cache, locking in the bad value (LL-021)

## Proposed Fix for Silent Wrong-Match Caching (LL-021 — not yet implemented)

After a USDA response is received, compute a simple string similarity check before writing to cache:

```js
// In /api/nutrition/route.js — after USDA responds
const returnedName = usdaResult?.description?.toLowerCase() ?? '';
const searchTermNormalised = searchTerm.toLowerCase();
const isLowConfidence = !returnedName.includes(searchTermNormalised.split(' ')[0]);

if (isLowConfidence) {
    // Do NOT cache — return with warning flag
    return { ...nutritionData, lowConfidence: true };
}
// Confidence OK — proceed with fire-and-forget cache write
```

The `NutritionPanel` component should display a `⚠` indicator for `lowConfidence: true` values rather than presenting them as fact. This converts a silent wrong answer into a visible uncertainty signal.

**Tracked as BUG-001 in REQUIREMENTS.md.**

## Consequences

- **Positive**: Common cooking ingredients return accurate nutritional data; zero added latency; fully transparent and auditable mapping; 29-entry map currently covers all ingredients in the recipe library
- **Negative**: Coverage gaps for uncommon ingredients; silent failures (wrong data returned without error) unless actively monitored — partially mitigated when BUG-001 is implemented
- **Mitigation**:
  - Step 1 of the Maintenance Protocol (proactive calorie sanity check on new recipes) catches wrong matches before users see them
  - BUG-001 confidence check prevents wrong values from being written to the 90-day cache
  - At approximately 50+ boost entries, consider migrating to an `ingredient_query_boosts` database table editable via an admin interface without requiring a deploy

## Revisit Trigger

Reconsider when:
- The boost map exceeds ~50 entries — at that point a database table with an admin UI is more maintainable than a code-level map requiring deploys
- A user-facing feedback mechanism ("Was this calorie count correct?") is introduced — negative feedback drives systematic coverage improvement
- European ingredient coverage becomes a priority for the Pro Kitchen tier — at that point, supplement USDA with Open Food Facts using barcode or EU-specific search terms

## Related Decisions

- [ADR-004](ADR-004-nutrition-caching-usda.md) — The caching layer this normalisation feeds into; boost results are cached under the cleaned (pre-boost) ingredient name, not the boost term
- [ADR-005](ADR-005-public-api-nutrition-route.md) — The `/api/nutrition` route where `QUERY_BOOSTS` is defined and `cleanIngredientName()` is invoked
