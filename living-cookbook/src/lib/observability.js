/**
 * src/lib/observability.js
 *
 * Structured logging helpers for The Living Cookbook — Layer 2 of the
 * three-layer observability strategy defined in ADR-010.
 *
 * Output goes to Vercel Function Logs as newline-delimited JSON.
 * Searchable in Vercel Dashboard → Project → Functions → Logs.
 *
 * No third-party dependencies — uses console.log/warn which Vercel captures.
 *
 * Usage:
 *   import { logNutritionLookup, logNutritionAnomaly } from '@/lib/observability';
 */

/**
 * Log every USDA origin call (i.e. L1 + L2 cache misses that reach USDA).
 *
 * confidence values (already computed in route.js):
 *   'high'   → USDA item description starts with the search term   → likely correct
 *   'medium' → USDA item description contains the search term        → probably correct
 *   'low'    → USDA item description does NOT contain the search term → possible wrong match
 *   'none'   → no USDA result found for this ingredient
 *
 * @param {{ ingredient: string, result: object|null, source: 'L1'|'L2'|'origin' }} param
 */
export function logNutritionLookup({ ingredient, result, source }) {
    console.log(JSON.stringify({
        level:      'info',
        event:      'nutrition_lookup',
        ingredient,
        usda_name:  result?.name  ?? null,
        confidence: result?.confidence ?? 'none',
        source,                               // 'L1' | 'L2' | 'origin'
        timestamp:  new Date().toISOString(),
    }));
}

/**
 * Flag results that are implausibly high or low for cooking ingredients.
 * A result outside the range is a strong secondary signal of a wrong USDA match,
 * supplementing the primary BUG-001 guard (confidence === 'low') in route.js.
 *
 * Thresholds are intentionally wide — this catches extreme outliers, not normal variation.
 * Typical cooking fat:  ~900 kcal (pure oil) — upper bound is 901 to allow for edge cases
 * Typical water/herbs:  ~10 kcal              — lower bound is 5
 *
 * Only called after USDA origin calls — cache hits are not re-validated.
 *
 * @param {{ ingredient: string, usdaResult: object, kcal: number }} param
 */
export function logNutritionAnomaly({ ingredient, usdaResult, kcal }) {
    if (kcal > 900 || kcal < 5) {
        console.warn(JSON.stringify({
            level:           'warn',
            event:           'nutrition_anomaly',
            ingredient,
            usda_top_result: usdaResult?.description ?? null,
            usda_fdc_id:     usdaResult?.fdcId       ?? null,
            kcal_100g:       kcal,
            flag:            'implausible_value',
            action_hint:     'Check the USDA match. If wrong, flush with: DELETE /api/admin/cache-flush',
            timestamp:       new Date().toISOString(),
        }));
    }
}

/**
 * Log when a cache poisoning event is prevented (BUG-001 guard triggered).
 * This gives visibility into how often USDA returns unrelated results.
 *
 * @param {{ ingredient: string, usdaName: string, fdcId: number }} param
 */
export function logLowConfidenceSkip({ ingredient, usdaName, fdcId }) {
    console.warn(JSON.stringify({
        level:       'warn',
        event:       'nutrition_low_confidence_skip',
        ingredient,
        usda_name:   usdaName,
        usda_fdc_id: fdcId,
        flag:        'cache_write_skipped',
        note:        'L2 write skipped — USDA name does not contain ingredient query. BUG-001 guard triggered.',
        timestamp:   new Date().toISOString(),
    }));
}
