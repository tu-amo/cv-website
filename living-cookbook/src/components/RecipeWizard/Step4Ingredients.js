'use client';

import { useCallback } from 'react';
import styles from './Step4Ingredients.module.css';

const MINUS = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

/**
 * Step 4 — Review & Edit Ingredients
 *
 * Props:
 *   ingredients         {array}  [{id, row_type, qty, unit, name, prep}]
 *   onUpdate            {fn(index, field, value)}
 *   onRemove            {fn(index)}
 *   onAddIngredient     {fn}
 *   onAddSection        {fn}
 */
export default function Step4Ingredients({ ingredients, onUpdate, onRemove, onAddIngredient, onAddSection, servings, setServings }) {
    const handleChange = useCallback((index, field) => (e) => {
        onUpdate(index, field, e.target.value);
    }, [onUpdate]);

    return (
        <div className={styles.step}>
            <h2 className="pp-section-heading">Review Ingredients</h2>

            {/* ── Servings ────────────────────────────────────── */}
            <div className={styles.servingsRow}>
                <label className={styles.servingsLabel} htmlFor="wiz-servings">
                    Serves
                </label>
                <input
                    id="wiz-servings"
                    className="form-control"
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="e.g. 4"
                    value={servings}
                    onChange={e => setServings(e.target.value)}
                    style={{ maxWidth: 100 }}
                />
                <span className={styles.servingsHint}>Set this first — it governs the ingredient quantities.</span>
            </div>

            <p className={styles.aiNote}>
                ⚠️ <strong>AI can make mistakes</strong> — especially with quantities and units.
                Please read through carefully and correct anything that looks wrong before continuing.
            </p>

            {/* Column headers */}
            <div className={styles.headerRow} aria-hidden="true">
                <span className={styles.colHeader}>Qty</span>
                <span className={styles.colHeader}>Unit</span>
                <span className={styles.colHeader}>Ingredient</span>
                <span className={styles.colHeader}>Prep / note</span>
                <span/>
            </div>

            <div className={styles.ingList} role="list" aria-label="Ingredients list">
                {ingredients.map((ing, i) => {
                    if (ing.row_type === 'section') {
                        return (
                            <div key={ing.id} className={`${styles.ingRow} ${styles.sectionRow}`} role="listitem">
                                <input
                                    className={`form-control ${styles.sectionInput}`}
                                    type="text"
                                    placeholder="Section heading (e.g. For the sauce)"
                                    value={ing.name}
                                    aria-label={`Section heading ${i + 1}`}
                                    onChange={handleChange(i, 'name')}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => onRemove(i)}
                                    aria-label="Remove section"
                                    type="button"
                                >
                                    {MINUS}
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div key={ing.id} className={styles.ingRow} role="listitem">
                            <input
                                className="form-control"
                                type="text"
                                placeholder="1"
                                value={ing.qty}
                                aria-label={`Quantity for ingredient ${i + 1}`}
                                onChange={handleChange(i, 'qty')}
                            />
                            <input
                                className="form-control"
                                type="text"
                                placeholder="cup"
                                value={ing.unit}
                                aria-label={`Unit for ingredient ${i + 1}`}
                                onChange={handleChange(i, 'unit')}
                            />
                            <input
                                className="form-control"
                                type="text"
                                placeholder="Ingredient name"
                                value={ing.name}
                                aria-label={`Name for ingredient ${i + 1}`}
                                onChange={handleChange(i, 'name')}
                            />
                            <input
                                className="form-control"
                                type="text"
                                placeholder="e.g. finely chopped"
                                value={ing.prep}
                                aria-label={`Preparation note for ingredient ${i + 1}`}
                                onChange={handleChange(i, 'prep')}
                            />
                            <button
                                className={styles.removeBtn}
                                onClick={() => onRemove(i)}
                                aria-label={`Remove ingredient ${ing.name || i + 1}`}
                                type="button"
                            >
                                {MINUS}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className={styles.addBtns}>
                <button className={styles.addBtn} onClick={onAddIngredient} type="button">
                    + Add ingredient
                </button>
                <button className={styles.addBtn} onClick={onAddSection} type="button">
                    + Add section
                </button>
            </div>
        </div>
    );
}
