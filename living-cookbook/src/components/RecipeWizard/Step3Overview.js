'use client';

import styles from './Step3Overview.module.css';

/**
 * Step 3 — Recipe Overview (servings, prep time, cook time)
 *
 * Props:
 *   servings, setServings
 *   prepTime, setPrepTime
 *   cookTime, setCookTime
 */
export default function Step3Overview({ servings, setServings, prepTime, setPrepTime, cookTime, setCookTime }) {
    return (
        <div className={styles.step}>
            <h2 className="pp-section-heading">Recipe Overview</h2>

            {/* Explain serving size first — it governs ingredient quantities */}
            <div className={styles.servingNote} role="note">
                <strong>Serving size matters:</strong> On the next screen you'll review
                the ingredient quantities. The amounts shown are based on the serving
                size you enter here — so set this first!
            </div>

            <div className={styles.fields}>
                {/* Servings */}
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="wiz-servings">
                        Number of servings
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
                    />
                </div>

                {/* Prep + Cook time */}
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-prep">
                            Prep time (minutes)
                        </label>
                        <input
                            id="wiz-prep"
                            className="form-control"
                            type="number"
                            min="0"
                            step="5"
                            placeholder="e.g. 15"
                            value={prepTime}
                            onChange={e => setPrepTime(e.target.value)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="wiz-cook">
                            Cook time (minutes)
                        </label>
                        <input
                            id="wiz-cook"
                            className="form-control"
                            type="number"
                            min="0"
                            step="5"
                            placeholder="e.g. 40"
                            value={cookTime}
                            onChange={e => setCookTime(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
