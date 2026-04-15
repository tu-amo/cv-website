"use client";

import { use, useState } from 'react'
import { login } from './actions'
import { createClient } from '@/lib/supabase/client'



export default function LoginPage({ searchParams: searchParamsPromise }) {
    const searchParams  = use(searchParamsPromise)
    const error         = searchParams?.error
    const next          = searchParams?.next || '/'
    const confirmation  = searchParams?.confirmation
    const confirmed     = searchParams?.confirmed === 'true'
    const [emailValue, setEmailValue]     = useState('')
    const [resendStatus, setResendStatus] = useState('idle') // idle | sending | sent | error

    const isEmailNotConfirmed = error?.toLowerCase().includes('email not confirmed')

    const handleResend = async () => {
        if (!emailValue) return
        setResendStatus('sending')
        const supabase = createClient()
        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: emailValue,
        })
        setResendStatus(resendError ? 'error' : 'sent')
    }

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
                        <button onClick={() => window.location.href = '/login'}>
                            try again
                        </button>.
                    </div>
                </div>
            </div>
        )
    }

    // ── Login / Signup Form ───────────────────────────────────────────────────
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
                RIGHT PANEL — form
            ══════════════════════════════════════════ */}
            <div className="pp-auth-right">
                <div className="pp-auth-card">

                    {/* Mobile-only logo (hidden on desktop) */}
                    <div className="pp-auth-card__logo">
                        <img src="/logo-wheat.svg" alt="Pretzel Prep" width={44} height={44} style={{ display: 'block' }} />
                        <span className="pp-auth-card__logo-name">Pretzel Prep</span>
                    </div>

                    {/* Title */}
                    <h1 className="pp-auth-card__title">
                        Welcome back!
                    </h1>
                    <p className="pp-auth-card__subtitle">
                        Your recipes are waiting.
                    </p>

                    {/* ── Email confirmed success banner ── */}
                    {confirmed && (
                        <div className="pp-auth-banner pp-auth-banner--success">
                            <strong className="pp-auth-banner__title">✓ Email confirmed!</strong>
                            Your kitchen is ready. Sign in below.
                        </div>
                    )}

                    {/* ── Error banner ── */}
                    {error && (
                        <div className="pp-auth-banner pp-auth-banner--error">
                            {error}

                            {/* Resend link — shown for unconfirmed email error */}
                            {isEmailNotConfirmed && (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,180,171,0.2)' }}>
                                    {resendStatus === 'sent' ? (
                                        <p style={{ margin: 0, color: 'rgba(0,200,150,0.9)', fontSize: '0.8rem' }}>
                                            ✓ Confirmation email sent — check your inbox.
                                        </p>
                                    ) : resendStatus === 'error' ? (
                                        <p style={{ margin: 0, fontSize: '0.8rem' }}>
                                            Could not send — check the email address and try again.
                                        </p>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '0.8rem' }}>
                                            Enter your email below then{' '}
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                disabled={resendStatus === 'sending' || !emailValue}
                                                style={{
                                                    background: 'none', border: 'none',
                                                    color: 'inherit', fontWeight: 700,
                                                    cursor: emailValue ? 'pointer' : 'default',
                                                    textDecoration: 'underline', fontSize: 'inherit',
                                                    opacity: emailValue ? 1 : 0.5, padding: 0,
                                                }}
                                            >
                                                {resendStatus === 'sending' ? 'Sending…' : 'resend the confirmation email'}
                                            </button>.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Hint for invalid login */}
                            {!isEmailNotConfirmed && error.toLowerCase().includes('invalid login') && (
                                <p style={{ marginTop: 8, fontSize: '0.8rem', margin: '8px 0 0' }}>
                                    Not confirmed yet? Check your inbox, or{' '}
                                    <a href="/login/forgot-password" style={{ color: 'inherit', fontWeight: 700 }}>
                                        reset your password
                                    </a>.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Form ── */}
                    <form action={login} className="pp-auth-form">
                        {/* Preserve ?next= param */}
                        {next !== '/' && <input type="hidden" name="next" value={next} />}

                        {/* Email */}
                        <div className="pp-auth-field">
                            <label htmlFor="pp-email" className="pp-auth-label">Email</label>
                            <input
                                id="pp-email"
                                name="email"
                                type="email"
                                required
                                value={emailValue}
                                onChange={e => { setEmailValue(e.target.value); setResendStatus('idle'); }}
                                className="pp-auth-input"
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="pp-auth-field">
                            <div className="pp-auth-label-row">
                                <label htmlFor="pp-password" className="pp-auth-label">Password</label>
                                <a href="/login/forgot-password" className="pp-auth-forgot">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                id="pp-password"
                                name="password"
                                type="password"
                                required
                                className="pp-auth-input"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Submit */}
                        <button type="submit" className="pp-auth-submit">
                            Sign In
                        </button>
                    </form>

                    {/* ── Create account link ── */}
                    <p className="pp-auth-toggle">
                        New here?{' '}
                        <a href="/signup">Create an account →</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
