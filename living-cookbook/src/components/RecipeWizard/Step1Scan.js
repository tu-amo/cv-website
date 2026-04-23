'use client';

import { useRef } from 'react';
import Link from 'next/link';
import styles from './Step1Scan.module.css';

const CAMERA_ICON = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
    </svg>
);

const CHECK_ICON = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

/**
 * Step 1 — AI Photo Scan
 *
 * Props:
 *   isScanning  {boolean}
 *   scanError   {string|null}
 *   scanDone    {boolean}    — true once a scan has succeeded this session
 *   scanUsed    {number|null}
 *   scanLimit   {number|null}
 *   onScan      {fn(file)}  — called with the File object
 *   onSkip      {fn}        — advance to step 2 without scanning
 */
export default function Step1Scan({ isScanning, scanError, scanDone, scanUsed, scanLimit, onScan, onSkip }) {
    const inputRef = useRef(null);
    const tokensLeft = scanLimit != null && scanUsed != null ? scanLimit - scanUsed : null;
    const isExhausted = tokensLeft !== null && tokensLeft <= 0;

    const fillPct = scanLimit ? Math.min(100, Math.round((scanUsed / scanLimit) * 100)) : 0;
    const fillClass = fillPct >= 100 ? styles.exhausted : fillPct >= 80 ? styles.warn : '';

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) onScan(file);
        // reset so same file can be selected again
        e.target.value = '';
    };

    return (
        <div className={styles.step}>
            <h2 className="pp-section-heading">Scan a Recipe Photo</h2>

            <p className={styles.hint}>
                Take a photo of a recipe from a cookbook, magazine, or handwritten card.
                Our AI will read the title, ingredients, and steps for you — then you can
                review and correct anything on the next screens.
            </p>

            {/* ── Token usage meter ───────────────────────────────────── */}
            {scanLimit != null && (
                <div className={styles.usageMeter} role="status" aria-label={`AI scans used: ${scanUsed} of ${scanLimit}`}>
                    <span className={styles.meterLabel}>AI scans used</span>
                    <div className={styles.meterBar} aria-hidden="true">
                        <div className={`${styles.meterFill} ${fillClass}`} style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className={styles.meterCount}>{scanUsed} / {scanLimit}</span>
                </div>
            )}

            {/* ── Exhausted state ─────────────────────────────────────── */}
            {isExhausted ? (
                <div className={styles.upgradeBox} role="alert">
                    <div className={styles.upgradeTitle}>You've used all your AI scans</div>
                    <p className={styles.upgradeSub}>
                        Upgrade your plan to unlock more monthly scans, or continue
                        entering ingredients manually.
                    </p>
                    <Link href="/upgrade" className="btn-add" style={{ textDecoration: 'none' }}>
                        View plans
                    </Link>
                    <button className={styles.skipBtn} onClick={onSkip}>
                        Continue without scanning →
                    </button>
                </div>
            ) : (
                <>
                    {/* ── Upload area ─────────────────────────────────── */}
                    <label
                        className={`${styles.uploadArea} ${isScanning ? styles.scanning : ''}`}
                        aria-label="Upload recipe photo for AI scan"
                        aria-busy={isScanning}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className={styles.uploadInput}
                            onChange={handleFileChange}
                            disabled={isScanning}
                            aria-label="Recipe photo file input"
                            id="wizard-scan-input"
                        />
                        <span className={styles.uploadIcon}>{CAMERA_ICON}</span>
                        {isScanning ? (
                            <>
                                <p className={styles.uploadTitle}>Scanning…</p>
                                <p className={styles.uploadSub}>Reading your recipe, this takes about 10–20 seconds</p>
                            </>
                        ) : (
                            <>
                                <p className={styles.uploadTitle}>
                                    {scanDone ? 'Scan another photo' : 'Tap to take a photo or choose from gallery'}
                                </p>
                                <p className={styles.uploadSub}>JPG, PNG, HEIC up to 20 MB</p>
                            </>
                        )}
                    </label>

                    {/* ── Scan error ──────────────────────────────────── */}
                    {scanError && (
                        <div className={styles.error} role="alert">
                            ❌ {scanError}
                        </div>
                    )}

                    {/* ── Scan success ────────────────────────────────── */}
                    {scanDone && !scanError && !isScanning && (
                        <div className={styles.success} role="status">
                            <span className={styles.successIcon}>{CHECK_ICON}</span>
                            <span>
                                Recipe scanned! Review and correct the details on the next screens —
                                AI sometimes makes mistakes, especially with quantities.
                            </span>
                        </div>
                    )}

                    {/* ── Skip link ───────────────────────────────────── */}
                    {!scanDone && (
                        <button className={styles.skipBtn} onClick={onSkip}>
                            Skip — I'll enter the recipe manually →
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
