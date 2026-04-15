"use client";
import { Icon } from '@/components/icons';

import { useState, useEffect, useCallback } from 'react';
import { toGrams } from '@/lib/ingredient-to-grams';

/**
 * NutritionPanel
 *
 * Displays per-serving calorie & macro estimates for a recipe.
 * Fetches nutritional data from /api/nutrition (USDA FoodData Central proxy).
 *
 * Props:
 *   ingredients      - array of ingredient objects from Supabase
 *   currentServings  - number (responds to serving scaler)
 *   originalServings - number (from recipe record)
 *   recipeId         - number | null (bigint from recipes.id — stored with flags)
 */
export default function NutritionPanel({ ingredients = [], currentServings = 1, originalServings = 1, recipeId = null, tier = 'free', anonymousSessionId = null }) {
    const [results, setResults]   = useState([]);   // per-ingredient nutrition results
    const [loading, setLoading]   = useState(true);
    const [expanded, setExpanded] = useState(false); // ingredient breakdown
    const [error, setError]       = useState(null);
    const [flagged, setFlagged]   = useState(new Set()); // ingredient names flagged this session
    const [flagging, setFlagging] = useState(null);      // ingredient name currently in-flight

    /** Flag a bad USDA match for periodic maintenance review */
    const handleFlag = async (row) => {
        if (flagging === row.name || flagged.has(row.name)) return;
        setFlagging(row.name);
        try {
            const res = await fetch('/api/nutrition/flag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredient_name: row.name,
                    usda_name:       row.matchedName  || null,
                    kcal_100g:       row.kcalPer100g  || null,
                    confidence:      row.confidence   || null,
                    recipe_id:       recipeId         || null,
                    anonymous_session_id: anonymousSessionId,
                }),
            });
            if (res.ok || res.status === 200) {
                setFlagged(prev => new Set([...prev, row.name]));
            }
        } catch (_) {
            // silently ignore — flag is best-effort
        } finally {
            setFlagging(null);
        }
    };

    const fetchNutrition = useCallback(async () => {
        if (!ingredients.length) { setLoading(false); return; }
        if (tier === 'free') {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Collect all ingredient names
            const names = ingredients
                .map(ing => ing.ingredients?.name || ing.display_name || ing.name || '')
                .filter(Boolean);

            if (names.length === 0) { setLoading(false); return; }

            // ONE batched request instead of N separate calls (solves N+1 problem)
            // API deduplicates, fans out to USDA only for cache misses, returns a map
            const encoded = encodeURIComponent(names.join('|'));
            const res = await fetch(`/api/nutrition?ingredients=${encoded}`);

            if (!res.ok) throw new Error('Nutrition API error');

            // nutritionMap = { "butter": { found, per100g: {...} }, "plain flour": {...}, ... }
            const nutritionMap = await res.json();

            // Correlate back to each ingredient using its original name as the key
            const mapped = ingredients.map(ing => {
                const name = ing.ingredients?.name || ing.display_name || ing.name || '';
                const nutrition = name ? (nutritionMap[name] ?? null) : null;
                const gramResult = toGrams(ing.quantity, ing.unit, name);
                return { ing, name, nutrition, grams: gramResult?.grams ?? null };
            });

            setResults(mapped);
        } catch (e) {
            setError('Could not load nutrition data.');
        } finally {
            setLoading(false);
        }
    }, [ingredients]);

    useEffect(() => { fetchNutrition(); }, [fetchNutrition]);

    // Expand recipe-right to full grid width when Details are open
    useEffect(() => {
        const rightPanel = document.querySelector('.recipe-right');
        if (!rightPanel) return;
        if (expanded) {
            rightPanel.classList.add('recipe-right--expanded');
        } else {
            rightPanel.classList.remove('recipe-right--expanded');
        }
        return () => rightPanel.classList.remove('recipe-right--expanded');
    }, [expanded]);

    // ── Calculation ───────────────────────────────────────────────────────────
    // Scale: if user changed servings from the original, scale the quantities first
    const scaleFactor = originalServings > 0 ? (currentServings / originalServings) : 1;

    let totalKcal = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0;
    let resolvedCount = 0, skippedCount = 0;

    const breakdown = results.map(({ ing, name, nutrition, grams }) => {
        const qty = ing.quantity;
        const unit = ing.unit || '';

        // Scale grams to current serving size
        const scaledGrams = grams ? grams * scaleFactor : null;

        if (!nutrition?.found || !scaledGrams || !nutrition.per100g?.kcal) {
            skippedCount++;
            return { name, qty, unit, grams: scaledGrams, kcal: null, skipped: true };
        }

        const factor = scaledGrams / 100;
        const kcal    = (nutrition.per100g.kcal    || 0) * factor;
        const protein = (nutrition.per100g.protein || 0) * factor;
        const fat     = (nutrition.per100g.fat     || 0) * factor;
        const carbs   = (nutrition.per100g.carbs   || 0) * factor;

        totalKcal    += kcal;
        totalProtein += protein;
        totalFat     += fat;
        totalCarbs   += carbs;
        resolvedCount++;

        return {
            name,
            qty,
            unit,
            grams:       Math.round(scaledGrams),
            kcal:        Math.round(kcal),
            kcalPer100g: Math.round(nutrition.per100g.kcal),
            matchedName: nutrition.name,
            confidence:  nutrition.confidence,
            lowConfidence: nutrition.lowConfidence ?? false, // BUG-001 flag
            skipped: false,
        };
    });

    // Per-serving totals (everything above is already scaled to currentServings worth of food)
    // Divide by currentServings to get a single serving
    const perServingKcal    = currentServings > 0 ? Math.round(totalKcal    / currentServings) : 0;
    const perServingProtein = currentServings > 0 ? Math.round(totalProtein / currentServings) : 0;
    const perServingFat     = currentServings > 0 ? Math.round(totalFat     / currentServings) : 0;
    const perServingCarbs   = currentServings > 0 ? Math.round(totalCarbs   / currentServings) : 0;
    const coveragePercent    = results.length > 0 ? Math.round((resolvedCount / results.length) * 100) : 0;
    const lowConfidenceCount  = breakdown.filter(r => !r.skipped && r.lowConfidence).length;

    // Macro caloric-percentage breakdown (for progress bars)
    const proteinKcal    = perServingProtein * 4;   // 4 kcal per gram
    const fatKcal        = perServingFat     * 9;   // 9 kcal per gram
    const carbsKcal      = perServingCarbs   * 4;   // 4 kcal per gram
    const totalMacroKcal = proteinKcal + fatKcal + carbsKcal || 1; // avoid ÷0

    const macroData = [
        { label: 'Protein', value: perServingProtein, pct: Math.round((proteinKcal / totalMacroKcal) * 100), color: 'var(--md-sys-color-primary,    #7B78C8)' },
        { label: 'Fat',     value: perServingFat,     pct: Math.round((fatKcal     / totalMacroKcal) * 100), color: 'var(--md-sys-color-secondary,  #8B3437)' },
        { label: 'Carbs',   value: perServingCarbs,   pct: Math.round((carbsKcal   / totalMacroKcal) * 100), color: 'var(--md-sys-color-tertiary,   #7A6080)' },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="nutrition-panel nutrition-panel--loading" aria-busy="true">
                <div className="nutrition-skeleton">
                    <div className="nutrition-skeleton-bar" style={{ width: '60%' }} />
                    <div className="nutrition-skeleton-bar" style={{ width: '40%' }} />
                </div>
            </div>
        );
    }

    if (error || (tier !== 'free' && results.length === 0)) return null;

    if (tier === 'free') {
        return (
            <div className="nutrition-panel nutrition-panel--locked" aria-label="Nutrition locked">
                <div className="nutrition-header">
                    <h3 className="nutrition-title">Nutrition</h3>
                    <div className="nutrition-kcal">
                        <span className="nutrition-tilde">~</span>
                        <strong>450</strong>
                        <span className="nutrition-unit"> kcal</span>
                    </div>
                </div>
                
                <div className="nutrition-macros" style={{ filter: 'blur(3px)', opacity: 0.6, pointerEvents: 'none' }}>
                    <div className="macro-pill"><div className="macro-pill__header"><span className="macro-label">Protein</span><span className="macro-pct">25%</span></div><div className="macro-progress-bar"><div className="macro-progress-fill" style={{ width: '25%', background: 'var(--md-sys-color-primary)' }}/></div><span className="macro-value">28g</span></div>
                    <div className="macro-pill"><div className="macro-pill__header"><span className="macro-label">Fat</span><span className="macro-pct">35%</span></div><div className="macro-progress-bar"><div className="macro-progress-fill" style={{ width: '35%', background: 'var(--md-sys-color-secondary)' }}/></div><span className="macro-value">17g</span></div>
                    <div className="macro-pill"><div className="macro-pill__header"><span className="macro-label">Carbs</span><span className="macro-pct">40%</span></div><div className="macro-progress-bar"><div className="macro-progress-fill" style={{ width: '40%', background: 'var(--md-sys-color-tertiary)' }}/></div><span className="macro-value">45g</span></div>
                </div>

                <div className="nutrition-locked-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-on-surface)', fontSize: '0.9rem' }}>Unlock Full Nutrition</p>
                    <p style={{ margin: '4px 0 12px', color: 'var(--color-on-surface-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Upgrade to Kitchen+ to see USDA macros, calories, & protein tracking.</p>
                    <a href="/upgrade" className="btn-add" style={{ textDecoration: 'none', padding: '6px 16px', fontSize: '0.85rem' }}>Upgrade</a>
                </div>
            </div>
        );
    }

    return (
        <div className="nutrition-panel" aria-label="Estimated nutrition per serving">

            {/* ── Header: 'Nutrition' title + kcal ── */}
            <div className="nutrition-header">
                <h3 className="nutrition-title">Nutrition</h3>
                <div className="nutrition-kcal">
                    <span className="nutrition-tilde">~</span>
                    <strong>{perServingKcal.toLocaleString()}</strong>
                    <span className="nutrition-unit"> kcal</span>
                </div>
            </div>

            {/* ── Macro progress bars ── */}
            <div className="nutrition-macros">
                {macroData.map((m, i) => (
                    <div key={i} className="macro-pill">
                        <div className="macro-pill__header">
                            <span className="macro-label">{m.label}</span>
                            <span className="macro-pct">{m.pct}%</span>
                        </div>
                        <div
                            className="macro-progress-bar"
                            role="progressbar"
                            aria-valuenow={m.pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${m.label}: ${m.pct}% of macro calories`}
                        >
                            <div
                                className="macro-progress-fill"
                                style={{ width: `${m.pct}%`, background: m.color }}
                            />
                        </div>
                        <span className="macro-value">{m.value}g</span>
                    </div>
                ))}
            </div>

            {/* ── Footer: per-serving note + expand toggle ── */}
            <div className="nutrition-meta">
                <span className="nutrition-per-serving">per serving</span>
                <button
                    className="nutrition-toggle"
                    onClick={() => setExpanded(e => !e)}
                    aria-expanded={expanded}
                    aria-controls="nutrition-breakdown"
                >
                    {expanded ? 'Hide' : 'Details'}
                    <svg
                        width="10" height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        style={{
                            display: 'inline-block',
                            marginLeft: 4,
                            verticalAlign: 'middle',
                            transition: 'transform 200ms',
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
            </div>

            {/* ── Expanded breakdown ── */}
            {expanded && (
                <div id="nutrition-breakdown" className="nutrition-breakdown">
                    <p className="nutrition-disclaimer">
                        ⓘ Estimates from USDA FoodData Central. Based on {coveragePercent}% of ingredients
                        ({resolvedCount} matched, {skippedCount} skipped).
                        Actual values vary. If an ingredient doesn't look matched correctly, flag it and we will fix it in the next update.
                        {lowConfidenceCount > 0 && (
                            <span className="nutrition-low-confidence-warning">
                                {' '}<>{Icon.warn} {lowConfidenceCount}</> ingredient{lowConfidenceCount > 1 ? 's' : ''} had a low-confidence
                                USDA match — shown but not cached. Check matched name in the table.
                            </span>
                        )}
                    </p>
                    <table className="nutrition-table">
                        <thead>
                            <tr>
                                <th>Ingredient</th>
                                <th className="nutrition-th-amt">Amt used</th>
                                <th className="nutrition-th-100g">kcal / 100g</th>
                                <th className="nutrition-th-kcal">kcal</th>
                                <th className="nutrition-th-flag" aria-label="Flag bad match"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {breakdown.map((row, i) => (
                                <tr key={i} className={`nutrition-row ${row.skipped ? 'nutrition-row--skipped' : row.lowConfidence ? 'nutrition-row--low-confidence' : ''}`}>
                                    <td>
                                        <span className="nutrition-ing-name">{row.name}</span>
                                        {!row.skipped && row.matchedName && (
                                            <span className="nutrition-usda-match">
                                                <span className={`nutrition-conf-badge nutrition-conf-badge--${row.confidence}`}>
                                                    {row.confidence === 'high' ? 'H' : row.confidence === 'medium' ? 'M' : 'L'}
                                                </span>
                                                <span
                                                    className="nutrition-matched-term"
                                                    title={row.matchedName}
                                                >
                                                    {row.matchedName.length > 40
                                                        ? row.matchedName.slice(0, 40) + '…'
                                                        : row.matchedName}
                                                </span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="nutrition-grams">
                                        {row.grams ? `${row.grams}g` : `${row.qty || ''} ${row.unit || ''}`.trim() || '—'}
                                    </td>
                                    <td className="nutrition-100g-cell">
                                        {row.skipped ? <span className="nutrition-unknown">?</span> : row.kcalPer100g}
                                    </td>
                                    <td className="nutrition-kcal-cell">
                                        {row.skipped ? <span className="nutrition-unknown">?</span> : row.kcal}
                                    </td>
                                    <td className="nutrition-flag-cell">
                                        {!row.skipped && (
                                            flagged.has(row.name) || flagging === row.name
                                                ? <span className="nutrition-flag-done" title="Flagged for review">{Icon.flag}</span>
                                                : <button
                                                    className="nutrition-flag-btn"
                                                    onClick={() => handleFlag(row)}
                                                    title={`Flag \u201c${row.name}\u201d as a bad USDA match`}
                                                    aria-label={`Flag ${row.name} as bad USDA match`}
                                                  >
                                                    {Icon.flag}
                                                  </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="nutrition-total-row">
                                <td>Total ({currentServings} serving{currentServings !== 1 ? 's' : ''})</td>
                                <td></td>
                                <td></td>
                                <td>{Math.round(totalKcal).toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
