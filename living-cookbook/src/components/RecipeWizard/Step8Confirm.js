'use client';

import styles from './Step8Confirm.module.css';

function visLabel({ isPublic, selectedGroupId, groups }) {
    if (isPublic) return '🌍 Public Gallery';
    if (selectedGroupId) {
        const group = groups.find(g => g.id === selectedGroupId);
        return `🏠 ${group?.name ?? 'Household'}`;
    }
    return '🔒 Private';
}

/**
 * Step 8 — Confirm & Save
 *
 * Props:
 *   title, servings, prepTime, cookTime
 *   ingredients, steps
 *   sourceType, bookTitle, author, link
 *   isPublic, selectedGroupId, groups
 *   imageUrls
 *   isSaving
 */
export default function Step8Confirm({
    title, servings, prepTime, cookTime,
    ingredients, steps,
    sourceType, bookTitle, author, link,
    isPublic, selectedGroupId, groups,
    imageUrls,
    isSaving,
}) {
    const ingCount = ingredients.filter(i => i.row_type === 'ingredient').length;
    const stepCount = steps.filter(s => s.text?.trim()).length;

    let sourceText = null;
    if (sourceType === 'family' && author) sourceText = `Family recipe by ${author}`;
    if (sourceType === 'cookbook' && bookTitle) sourceText = `${bookTitle}${author ? ` by ${author}` : ''}`;
    if (sourceType === 'website' && link) sourceText = link;

    return (
        <div className={styles.step}>
            <h2 className="pp-section-heading">Ready to save?</h2>

            {/* ── Summary card ───────────────────────────────────────── */}
            <div className={styles.card}>
                <h3 className={styles.cardTitle}>{title || 'Untitled Recipe'}</h3>

                {/* Meta badges */}
                <div className={styles.metaRow}>
                    {servings && <span className={styles.metaBadge}>🍽 {servings} servings</span>}
                    {prepTime && <span className={styles.metaBadge}>⏱ {prepTime} min prep</span>}
                    {cookTime && <span className={styles.metaBadge}>🔥 {cookTime} min cook</span>}
                    {imageUrls?.length > 0 && <span className={styles.metaBadge}>📷 {imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''}</span>}
                </div>

                <hr className={styles.divider} />

                {/* Source */}
                {sourceText && (
                    <div className={styles.section}>
                        <span className={styles.sectionLabel}>Source</span>
                        <span className={styles.sectionValue}>{sourceText}</span>
                    </div>
                )}

                {/* Ingredients preview */}
                <div className={styles.section}>
                    <span className={styles.sectionLabel}>Ingredients ({ingCount})</span>
                    <ul className={styles.ingPreview}>
                        {ingredients.slice(0, 5).map((ing, i) =>
                            ing.row_type === 'ingredient' ? (
                                <li key={ing.id || i}>
                                    {[ing.qty, ing.unit, ing.name, ing.prep && `(${ing.prep})`].filter(Boolean).join(' ')}
                                </li>
                            ) : null
                        )}
                        {ingCount > 5 && <li style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.8rem' }}>…and {ingCount - 5} more</li>}
                    </ul>
                </div>

                {/* Steps count */}
                <div className={styles.section}>
                    <span className={styles.sectionLabel}>Method</span>
                    <span className={styles.sectionValue}>{stepCount} step{stepCount !== 1 ? 's' : ''}</span>
                </div>

                <hr className={styles.divider} />

                {/* Visibility */}
                <div className={styles.visChip}>
                    {visLabel({ isPublic, selectedGroupId, groups })}
                </div>
            </div>

            <p className={styles.editNote}>
                You can edit all of this any time from the recipe page.
            </p>

            {isSaving && (
                <p className={styles.savingMsg} role="status" aria-live="polite">
                    Saving your recipe…
                </p>
            )}
        </div>
    );
}
