"use client";

import { use, useState } from 'react'
import { signup } from '../login/actions'

export default function SignupPage({ searchParams: searchParamsPromise }) {
    const searchParams  = use(searchParamsPromise)
    const error         = searchParams?.error
    const next          = searchParams?.next || '/'
    const confirmation  = searchParams?.confirmation

    // ── Confirmation Pending State ────────────────────────────────────────────
    if (confirmation === 'pending') {
        return (
            <div className="pp-auth-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className="pp-auth-confirm-card">
                    <div className="pp-auth-confirm-card__icon">📬</div>
                    <h1 className="pp-auth-confirm-card__title">Check your inbox</h1>
                    <p className="pp-auth-confirm-card__body">
                        We&apos;ve sent a confirmation link to your email address.
                        Click it to activate your account and start cooking.
                    </p>
                    <div className="pp-auth-confirm-card__hint">
                        Didn&apos;t receive it? Check your spam folder or{' '}
                        <button onClick={() => window.location.href = '/signup'}>
                            try again
                        </button>.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="pp-auth-page">

            {/* ══════════════════════════════════════════
                LEFT PANEL — decorative visual
            ══════════════════════════════════════════ */}
            <div className="pp-auth-left">
                <div className="pp-auth-left__content">

                    {/* Brand mark */}
                    <div className="pp-auth-left__logo">
                        <img src="/logo-wheat.svg" alt="Pretzel Prep" width={120} height={120} style={{ display: 'block' }} />
                        <span className="pp-auth-left__brand">Pretzel Prep</span>
                    </div>

                    {/* Features */}
                    <ul className="pp-auth-left__features">
                        <li>
                            <span>🥨</span>
                            Import from any cookbook or website
                        </li>
                        <li>
                            <span>⚖️</span>
                            Scale ingredients automatically
                        </li>
                        <li>
                            <span>🏠</span>
                            Share recipes with your household
                        </li>
                        <li>
                            <span>📊</span>
                            Track nutrition per serving
                        </li>
                    </ul>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                RIGHT PANEL — sign-up form
            ══════════════════════════════════════════ */}
            <div className="pp-auth-right">
                <div className="pp-auth-card">

                    {/* Mobile-only logo */}
                    <div className="pp-auth-card__logo">
                        <img src="/logo-wheat.svg" alt="Pretzel Prep" width={44} height={44} style={{ display: 'block' }} />
                        <span className="pp-auth-card__logo-name">Pretzel Prep</span>
                    </div>

                    {/* Title */}
                    <h1 className="pp-auth-card__title">
                        Create your account
                    </h1>
                    <p className="pp-auth-card__subtitle">
                        Start building your personal recipe library.
                    </p>

                    {/* ── Error banner ── */}
                    {error && (
                        <div className="pp-auth-banner pp-auth-banner--error">
                            {error}
                        </div>
                    )}

                    {/* ── Form ── */}
                    <form action={signup} className="pp-auth-form">
                        {/* Preserve ?next= param */}
                        {next !== '/' && <input type="hidden" name="next" value={next} />}
                        {/* Tell the action to redirect errors back here */}
                        <input type="hidden" name="error_origin" value="/signup" />

                        {/* Display name */}
                        <div className="pp-auth-field">
                            <label htmlFor="pp-display-name" className="pp-auth-label">
                                Your Name
                            </label>
                            <input
                                id="pp-display-name"
                                name="display_name"
                                type="text"
                                required
                                maxLength={100}
                                className="pp-auth-input"
                                placeholder="e.g. Jane"
                                autoComplete="name"
                            />
                        </div>

                        {/* Email */}
                        <div className="pp-auth-field">
                            <label htmlFor="pp-email" className="pp-auth-label">Email</label>
                            <input
                                id="pp-email"
                                name="email"
                                type="email"
                                required
                                className="pp-auth-input"
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="pp-auth-field">
                            <label htmlFor="pp-password" className="pp-auth-label">Password</label>
                            <input
                                id="pp-password"
                                name="password"
                                type="password"
                                required
                                className="pp-auth-input"
                                placeholder="••••••••"
                                autoComplete="new-password"
                                minLength={6}
                            />
                        </div>

                        {/* Submit */}
                        <button type="submit" className="pp-auth-submit">
                            Create Account
                        </button>
                    </form>

                    {/* ── Sign in link ── */}
                    <p className="pp-auth-toggle">
                        Already have an account?{' '}
                        <a href="/login">Sign in →</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
