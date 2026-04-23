'use client';

import { useCallback } from 'react';
import styles from './Step5Method.module.css';

const MINUS = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

/**
 * Step 5 — Method Steps
 *
 * Props:
 *   steps       {array}  [{id, text}]
 *   onUpdate    {fn(index, value)}
 *   onRemove    {fn(index)}
 *   onAdd       {fn}
 */
export default function Step5Method({ steps, onUpdate, onRemove, onAdd, prepTime, setPrepTime, cookTime, setCookTime }) {
    const handleChange = useCallback((index) => (e) => {
        onUpdate(index, e.target.value);
    }, [onUpdate]);

    return (
        <div className={styles.step}>
            <h2 className="pp-section-heading">Method Steps</h2>

            <p className={styles.hint}>
                Review the steps the AI extracted. Edit the wording, split a step in two,
                or merge steps that were split incorrectly.
            </p>

            {/* ── Timings ───────────────────────────────────────────────── */}
            <div className={styles.timingRow}>
                <div className={styles.timingField}>
                    <label className={styles.timingLabel} htmlFor="wiz-prep">Prep time (mins)</label>
                    <input id="wiz-prep" className="form-control" type="number" min="0" step="5"
                        placeholder="e.g. 15" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
                </div>
                <div className={styles.timingField}>
                    <label className={styles.timingLabel} htmlFor="wiz-cook">Cook time (mins)</label>
                    <input id="wiz-cook" className="form-control" type="number" min="0" step="5"
                        placeholder="e.g. 40" value={cookTime} onChange={e => setCookTime(e.target.value)} />
                </div>
            </div>

            {/* ── Steps list ──────────────────────────────────────────── */}
            <div className={styles.stepList} aria-label="Method steps">
                {steps.map((step, i) => (
                    <div key={step.id} className={styles.stepRow}>
                        <span className={styles.stepNumber} aria-hidden="true">{i + 1}</span>
                        <textarea
                            className={`form-control ${styles.stepTextarea}`}
                            value={step.text}
                            onChange={handleChange(i)}
                            placeholder={`Step ${i + 1}…`}
                            aria-label={`Step ${i + 1}`}
                            rows={3}
                        />
                        <button
                            className={styles.removeBtn}
                            onClick={() => onRemove(i)}
                            aria-label={`Remove step ${i + 1}`}
                            type="button"
                        >
                            {MINUS}
                        </button>
                    </div>
                ))}
            </div>

            <button className={styles.addBtn} onClick={onAdd} type="button">
                + Add step
            </button>
        </div>
    );
}
