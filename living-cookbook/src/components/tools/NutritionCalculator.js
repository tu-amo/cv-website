'use client';

/**
 * NutritionCalculator — public SEO tool
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses a raw list of ingredients, formats them, and passes them to the
 * shared NutritionPanel component.
 * Features rate-limiting protection and anonymous flagging.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { smartParseIngredient } from '@/lib/recipe-utils';
import NutritionPanel from '@/components/NutritionPanel';
import styles from './RecipeScaler.module.css'; // Reusing styles from RecipeScaler for consistency

export function NutritionCalculator({ sessionId, copy }) {
  const [rawInput, setRawInput] = useState('');
  const [parsedIngredients, setParsedIngredients] = useState([]);
  const [isCalculated, setIsCalculated] = useState(false);

  const handleCalculate = useCallback(() => {
    const lines = rawInput
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (!lines.length) return;

    const results = [];
    lines.forEach(line => {
      const parsed = smartParseIngredient(line);
      if (parsed && parsed.row_type === 'ingredient') {
        results.push({
          name: parsed.name,
          quantity: parsed.qty || 0,
          unit: parsed.unit || 'pc',
          display_name: parsed.name,
          prep: parsed.prep || ''
        });
      }
    });

    setParsedIngredients(results);
    setIsCalculated(true);
  }, [rawInput]);

  return (
    <div className="pp-page-card">
      {/* ── H1 ── */}
      <PageHeader 
        overline={copy.overline}
        title={copy.title} 
        subtitle={copy.subtitle} 
      />

      {/* ── Input ── */}
      <h2 className="pp-section-heading">{copy.inputHeading}</h2>
      
      <div className={styles.inputArea}>
        <div>
          <label className={styles.fieldLabel} htmlFor="tool-ingredients">
            {copy.inputLabel}
          </label>
          <textarea
            id="tool-ingredients"
            className={`form-control ${styles.textarea}`}
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value);
              setIsCalculated(false);
            }}
            placeholder={copy.placeholder}
            rows={8}
            spellCheck="false"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        {/* ── Action button ── */}
        <div className={styles.scaleRow}>
          <button 
            id="tool-scale-btn"
            className="btn-add" 
            onClick={handleCalculate}
            disabled={!rawInput.trim()}
          >
            {copy.calculateBtn}
          </button>
        </div>
      </div>

      {/* ── Output ── */}
      {isCalculated && (
        <div className={styles.outputCard}>
          <div className={styles.outputHeader}>
            <h2 className={`pp-section-heading ${styles.outputHeading}`}>
              {copy.outputHeading}
            </h2>
          </div>
          
          <div style={{ marginTop: 'var(--space-2)' }}>
            {parsedIngredients.length > 0 ? (
              <NutritionPanel 
                ingredients={parsedIngredients} 
                currentServings={1} 
                originalServings={1} 
                tier="chef" 
                anonymousSessionId={sessionId} 
              />
            ) : (
              <p style={{ color: 'var(--color-on-surface-muted)', margin: 0 }}>
                {copy.emptyState}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Save CTA ── */}
      {isCalculated && (
        <div className={styles.ctaBanner}>
          <div className={styles.ctaText}>
            <span className={styles.ctaHeadline}>{copy.saveHeadline}</span>
            <span className={styles.ctaBody}>{copy.saveBody}</span>
          </div>
          <Link
            href="/signup?next=/tools/nutrition-calculator"
            id="tool-save-btn"
            className={styles.ctaBtn}
          >
            {copy.saveBtn}
          </Link>
        </div>
      )}

      {/* ── Supporting SEO copy ── */}
      <section className={styles.supporting} aria-label="About the Calculator">
        <h2 className="pp-section-heading">{copy.supportingTitle}</h2>
        {copy.supportingBody.map((para, i) => (
          <p key={i} className={styles.supportingPara}>
            {para}
          </p>
        ))}

        <h2 className="pp-section-heading">{copy.faqTitle}</h2>
        <dl className={styles.faqList}>
          {copy.faqs.map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <dt className={styles.faqQ}>{faq.q}</dt>
              <dd className={styles.faqA}>{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

    </div>
  );
}
