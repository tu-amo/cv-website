"use client";

import { formatQuantity, displayUnit } from "@/lib/recipe-utils";
import { convertToGrams } from "@/lib/unit-converter";

export default function IngredientsList({
    ingredients,
    currentServings,
    originalServings,
    shoppingListItems,
    onToggle,
    onAddToList,
    showInGrams = false,
    onToggleGrams,
    hideToggle = false,
}) {
    // Determine whether the toggle button should be shown at all:
    // only render it if there is at least one ingredient with a convertible volumetric unit.
    const hasVolumetricIngredients = ingredients.some(ing => {
        if (ing.row_type === 'section') return false;
        const scaledQty = formatQuantity(ing.quantity, currentServings, originalServings);
        const name = ing.display_name || ing.ingredients?.name || '';
        return convertToGrams(scaledQty, ing.unit, name) !== null;
    });

    return (
        <div>
            {/* ── Grams Toggle ──────────────────────────────────────── */}
            {!hideToggle && hasVolumetricIngredients && onToggleGrams && (
                <button
                    onClick={onToggleGrams}
                    title={showInGrams ? "Show original units" : "Show quantities in grams (scale mode)"}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '16px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: showInGrams
                            ? '1px solid var(--color-accent-amber)'
                            : '1px solid rgba(235, 220, 178, 0.2)',
                        background: showInGrams
                            ? 'var(--color-accent-amber-glow)'
                            : 'transparent',
                        color: showInGrams
                            ? 'var(--color-accent-amber)'
                            : 'var(--color-text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: showInGrams ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.02em',
                    }}
                >
                    {showInGrams ? '↺ Show as written' : '⚖ Show in grams'}
                </button>
            )}

            {/* ── Ingredient List ───────────────────────────────────── */}
            <ul className="ingredients-list" role="list" aria-label="Ingredients checklist">
                {ingredients.map((ing, idx) => {
                    // Section header rows
                    if (ing.row_type === 'section') {
                        return (
                            <li key={idx} className="ingredient-section-header" role="none">
                                {ing.display_name}
                            </li>
                        );
                    }

                    const scaledQty = formatQuantity(ing.quantity, currentServings, originalServings);
                    const name = ing.display_name || ing.ingredients?.name || '';
                    const prepNote = ing.preparation_note ? `, ${ing.preparation_note}` : '';

                    // Attempt conversion if toggle is on
                    const gramsResult = showInGrams
                        ? convertToGrams(scaledQty, ing.unit, name)
                        : null;

                    // Build the display string
                    let qtyDisplay, unitDisplay;
                    if (gramsResult) {
                        if (gramsResult.isRange) {
                            qtyDisplay = `${gramsResult.grams}–${gramsResult.gramsHigh}g`;
                        } else {
                            qtyDisplay = `${gramsResult.grams}g`;
                        }
                        unitDisplay = ''; // unit is absorbed into the grams display
                    } else {
                        qtyDisplay = scaledQty;
                        unitDisplay = displayUnit(scaledQty, ing.unit);
                    }

                    const isInList = shoppingListItems.includes(name);

                    return (
                        <li
                            key={idx}
                            className={`ingredient-item ${ing.checked ? "checked" : ""}`}
                            onClick={() => onToggle(idx)}
                            role="checkbox"
                            aria-checked={ing.checked}
                            tabIndex={0}
                            onKeyDown={e => (e.key === " " || e.key === "Enter") && onToggle(idx)}
                            onTouchStart={(e) => {
                                const timer = setTimeout(() => onAddToList(ing), 700);
                                e.currentTarget._longPressTimer = timer;
                            }}
                            onTouchEnd={(e) => clearTimeout(e.currentTarget._longPressTimer)}
                        >
                            {/* Col 1: Checkbox */}
                            <div className="checkbox"></div>

                            {/* Col 2: Ingredient name */}
                            <span className="ingredient-name">
                                {name}
                            </span>

                            {/* Col 3: Prep note */}
                            <span className="ingredient-prep">
                                {ing.preparation_note || ''}
                            </span>

                            {/* Col 4: Quantity */}
                            <span className="ingredient-qty">
                                {qtyDisplay}{unitDisplay ? ` ${unitDisplay}` : ''}
                            </span>

                            {/* Col 5: Shopping cart button — always bag icon, green when added */}
                            <button
                                type="button"
                                className={`ingredient-cart-btn${isInList ? ' ingredient-cart-btn--added' : ''}`}
                                onClick={(e) => { e.stopPropagation(); if (!isInList) onAddToList(ing); }}
                                disabled={isInList}
                                title={isInList ? 'Already in shopping list' : 'Add to shopping list'}
                                aria-label={isInList ? `${name} already in list` : `Add ${name} to shopping list`}
                            >
                                {/* Shopping bag — always shown; CSS colours it green when added */}
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                                    <path d="M3 6h18"/>
                                    <path d="M16 10a4 4 0 0 1-8 0"/>
                                </svg>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
