'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Icon } from '@/components/icons';
import styles from './WizardShell.module.css';

const CHECK_SVG = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/**
 * WizardShell — progress stepper + Back/Next navigation.
 *
 * Props:
 *   currentStep  {number}   1-based current step index
 *   totalSteps   {number}   always 8
 *   stepLabels   {string[]} labels for each step
 *   onBack       {fn}       navigate to previous step
 *   onNext       {fn}       navigate to next step
 *   onSave       {fn}       final save action (step 8 only)
 *   onDiscard    {fn}       clear draft and go home (step 8 only)
 *   isSaving     {boolean}  disables Save button while in-flight
 *   canGoNext    {boolean}  when false, Next is disabled
 *   onGoToStep   {fn}       jump to a completed step (for breadcrumb clicks)
 *   children     {node}     current step content
 */
export default function WizardShell({
    currentStep,
    totalSteps,
    stepLabels,
    onBack,
    onNext,
    onSave,
    onDiscard,
    isSaving = false,
    canGoNext = true,
    onGoToStep,
    children,
}) {
    // Focus the step heading whenever the step changes
    const contentRef = useRef(null);
    useEffect(() => {
        const heading = contentRef.current?.querySelector('h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: false });
        }
    }, [currentStep]);

    const isLastStep = currentStep === totalSteps;

    const handleStepClick = useCallback((stepIndex) => {
        // Only allow jumping back to completed steps
        if (stepIndex < currentStep && onGoToStep) {
            onGoToStep(stepIndex);
        }
    }, [currentStep, onGoToStep]);

    return (
        <div>
            {/* ── Hidden progress bar for screen readers ───────────────── */}
            <div
                role="progressbar"
                aria-valuenow={currentStep}
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-label={`Step ${currentStep} of ${totalSteps}: ${stepLabels[currentStep - 1]}`}
                className={styles.srOnly}
            />

            {/* ── Visual step indicator ─────────────────────────────────── */}
            <nav aria-label="Recipe creation progress" className={styles.progressNav}>
                <ol className={styles.stepList} aria-label="Steps">
                    {stepLabels.map((label, i) => {
                        const stepNum = i + 1;
                        const isCompleted = stepNum < currentStep;
                        const isCurrent = stepNum === currentStep;
                        const isClickable = isCompleted;

                        const stateClass = isCompleted
                            ? styles.completed
                            : isCurrent
                                ? styles.current
                                : '';

                        return (
                            <li
                                key={stepNum}
                                className={`${styles.stepItem} ${stateClass}`}
                                aria-current={isCurrent ? 'step' : undefined}
                            >
                                <button
                                    className={`${styles.stepButton} ${isClickable ? styles.clickable : ''}`}
                                    onClick={() => handleStepClick(stepNum)}
                                    disabled={!isClickable}
                                    aria-label={`${label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                                    title={label}
                                >
                                    <span className={styles.stepCircle}>
                                        {isCompleted ? CHECK_SVG : stepNum}
                                    </span>
                                    <span className={styles.stepLabel}>{label}</span>
                                </button>

                                {/* Connector line between steps */}
                                {i < stepLabels.length - 1 && (
                                    <span
                                        className={`${styles.connector} ${isCompleted ? styles.filled : ''}`}
                                        aria-hidden="true"
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>

            {/* ── Step content ──────────────────────────────────────────── */}
            <div className={styles.content} ref={contentRef}>
                {children}
            </div>

            {/* ── Navigation buttons ────────────────────────────────────── */}
            <div className={styles.actions}>
                <button
                    className={styles.btnBack}
                    onClick={onBack}
                    disabled={currentStep === 1}
                    aria-label="Go to previous step"
                >
                    ← Back
                </button>

                <span className={styles.stepCounter} aria-hidden="true">
                    {currentStep} / {totalSteps}
                </span>

                <div className={styles.actionsRight}>
                    {isLastStep ? (
                        <button
                            className={styles.btnSave}
                            onClick={onSave}
                            disabled={isSaving}
                            aria-label={isSaving ? 'Saving recipe…' : 'Save recipe'}
                        >
                            {isSaving ? 'Saving…' : '✓ Save Recipe'}
                        </button>
                    ) : (
                        <button
                            className={styles.btnNext}
                            onClick={onNext}
                            disabled={!canGoNext}
                            aria-label={`Continue to ${stepLabels[currentStep] ?? 'next step'}`}
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>

            {/* ── Discard option (last step only) ──────────────────────────── */}
            {isLastStep && onDiscard && (
                <div className={styles.discardRow}>
                    <button
                        className={styles.btnDiscard}
                        onClick={onDiscard}
                        aria-label="Discard recipe and return to library"
                    >
                        Discard recipe
                    </button>
                </div>
            )}
        </div>
    );
}
