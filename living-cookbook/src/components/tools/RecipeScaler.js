'use client';

/**
 * RecipeScaler — shared tool component
 * ─────────────────────────────────────────────────────────────────────────────
 * Used by all 6 language pages. Only the `copy` prop changes.
 * Logic: smartParseIngredient() → formatQuantity() → display
 * No auth, no network calls, runs entirely client-side.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { smartParseIngredient, formatQuantity, displayUnit } from '@/lib/recipe-utils';
import styles from './RecipeScaler.module.css';

/** Formats a single parsed ingredient line for display */
function formatLine(ing, targetServings, originalServings) {
  if (!ing) return null;

  if (ing.row_type === 'section') {
    return { type: 'section', text: ing.name };
  }

  // No quantity parsed — show as-is
  if (!ing.qty) {
    const parts = [ing.name, ing.prep].filter(Boolean);
    return { type: 'noquty', text: parts.join(', ') };
  }

  const scaledQty = formatQuantity(ing.qty, targetServings, originalServings);

  // 'pc' is internal default for unitless count items — don't display it
  const unit = ing.unit && ing.unit !== 'pc'
    ? displayUnit(scaledQty, ing.unit)
    : '';

  // Metric units attach directly (250g), others get a space (2 tsp)
  const metricUnits = ['g', 'ml', 'kg', 'l'];
  const unitStr = unit
    ? (metricUnits.includes(unit.toLowerCase()) ? unit : ` ${unit}`)
    : '';

  const namePart = [ing.name, ing.prep ? `(${ing.prep})` : ''].filter(Boolean).join(' ');
  return { type: 'ingredient', text: `${scaledQty}${unitStr} ${namePart}`.trim() };
}

/** Serialise scaled output as plain text for clipboard copy */
function toPlainText(lines) {
  return lines
    .map(l => {
      if (l.type === 'section') return `\n${l.text.toUpperCase()}`;
      return l.text;
    })
    .join('\n')
    .trim();
}

export function RecipeScaler({ copy }) {
  const [rawInput, setRawInput]             = useState('');
  const [originalServings, setOriginal]     = useState(4);
  const [targetServings, setTarget]         = useState(8);
  const [scaledLines, setScaledLines]       = useState(null);
  const [unparsedLines, setUnparsedLines]   = useState([]);
  const [copied, setCopied]                 = useState(false);

  const handleScale = useCallback(() => {
    const lines = rawInput
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (!lines.length) return;

    const orig = Number(originalServings) || 1;
    const tgt  = Number(targetServings)   || 1;

    const results   = [];
    const unparsed  = [];

    lines.forEach(line => {
      const parsed = smartParseIngredient(line);
      if (!parsed) {
        unparsed.push(line);
        return;
      }
      const formatted = formatLine(parsed, tgt, orig);
      if (formatted) results.push(formatted);
    });

    setScaledLines(results);
    setUnparsedLines(unparsed);
    setCopied(false);
  }, [rawInput, originalServings, targetServings]);

  const handleCopy = useCallback(() => {
    if (!scaledLines) return;
    const text = toPlainText(scaledLines);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [scaledLines]);

  // Serialise scaled ingredients into sessionStorage so /add can pre-fill
  const handleSaveClick = useCallback(() => {
    if (scaledLines) {
      try {
        sessionStorage.setItem(
          'recipe-scaler-prefill',
          JSON.stringify({ scaledLines, targetServings })
        );
      } catch { /* sessionStorage unavailable — safe to ignore */ }
    }
  }, [scaledLines, targetServings]);

  const hasOutput = scaledLines !== null;

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
            onChange={e => setRawInput(e.target.value)}
            placeholder={copy.placeholder}
            rows={8}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        {/* ── Servings row ── */}
        <div className={styles.servingsRow}>
          <div className={styles.servingsGroup}>
            <label className={styles.fieldLabel} htmlFor="tool-original">
              {copy.originalLabel}
            </label>
            <input
              id="tool-original"
              type="number"
              className={`form-control ${styles.servingsInput}`}
              value={originalServings}
              onChange={e => setOriginal(Math.max(1, Number(e.target.value)))}
              min={1}
              max={9999}
              inputMode="numeric"
            />
          </div>

          <span className={styles.arrow} aria-hidden="true">→</span>

          <div className={styles.servingsGroup}>
            <label className={styles.fieldLabel} htmlFor="tool-target">
              {copy.targetLabel}
            </label>
            <input
              id="tool-target"
              type="number"
              className={`form-control ${styles.servingsInput}`}
              value={targetServings}
              onChange={e => setTarget(Math.max(1, Number(e.target.value)))}
              min={1}
              max={9999}
              inputMode="numeric"
            />
          </div>
        </div>

        {/* ── Scale button ── */}
        <div className={styles.scaleRow}>
          <button
            id="tool-scale-btn"
            className="btn-add"
            onClick={handleScale}
            disabled={!rawInput.trim()}
          >
            {copy.scaleBtn}
          </button>
        </div>
      </div>

      {/* ── Output ── */}
      {hasOutput && (
        <>
          <div className={styles.outputCard}>
            <div className={styles.outputHeader}>
              <h2 className={`pp-section-heading ${styles.outputHeading}`}>
                {copy.outputHeading}
              </h2>
              <button
                id="tool-copy-btn"
                className={styles.copyBtn}
                onClick={handleCopy}
                aria-label={copied ? copy.copiedBtn : copy.copyBtn}
              >
                {copied ? copy.copiedBtn : copy.copyBtn}
              </button>
            </div>

            <ul className={styles.outputList} aria-label={copy.outputHeading}>
              {scaledLines.map((line, i) => {
                if (line.type === 'section') {
                  return (
                    <li key={i} className={styles.outputSection} role="presentation">
                      {line.text}
                    </li>
                  );
                }
                if (line.type === 'noquty') {
                  return (
                    <li key={i} className={styles.outputIngredient}>
                      {line.text}{' '}
                      <span className={styles.outputNoQty}>{copy.noQtyNote}</span>
                    </li>
                  );
                }
                return (
                  <li key={i} className={styles.outputIngredient}>
                    {line.text}
                  </li>
                );
              })}
            </ul>

            {unparsedLines.length > 0 && (
              <ul className={styles.outputList} style={{ marginTop: 'var(--space-4)' }}>
                {unparsedLines.map((line, i) => (
                  <li key={i} className={styles.outputUnparsed}>
                    {copy.unparsedNote} {line}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Save CTA ── */}
          <div className={styles.ctaBanner}>
            <div className={styles.ctaText}>
              <span className={styles.ctaHeadline}>{copy.saveHeadline}</span>
              <span className={styles.ctaBody}>{copy.saveBody}</span>
            </div>
            <Link
              href="/signup?next=/add"
              id="tool-save-btn"
              className={styles.ctaBtn}
              onClick={handleSaveClick}
            >
              {copy.saveBtn}
            </Link>
          </div>
        </>
      )}

      {/* ── Supporting SEO copy ── */}
      <section className={styles.supporting} aria-label={copy.supportingTitle}>
        <h2 className="pp-section-heading">{copy.supportingTitle}</h2>

        {copy.supportingBody.map((para, i) => (
          <p key={i} className={styles.supportingPara}>{para}</p>
        ))}

        {copy.faqs?.length > 0 && (
          <>
            <h2 className="pp-section-heading">{copy.faqTitle}</h2>
            <dl className={styles.faqList}>
              {copy.faqs.map((faq, i) => (
                <div key={i} className={styles.faqItem}>
                  <dt className={styles.faqQ}>{faq.q}</dt>
                  <dd className={styles.faqA}>{faq.a}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </section>

    </div>
  );
}
