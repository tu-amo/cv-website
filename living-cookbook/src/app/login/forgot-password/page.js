"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Alert } from '@/components/ui';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | sent | error
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) {
            setErrorMsg(error.message);
            setStatus('error');
        } else {
            setStatus('sent');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '20px' }}>
            <div style={{ maxWidth: '400px', width: '100%', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>

                {status === 'sent' ? (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
                        <h1 className="font-heading" style={{ fontSize: '1.8rem', marginBottom: '12px', background: 'linear-gradient(to bottom, var(--color-on-surface), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Check your inbox
                        </h1>
                        <p style={{ color: 'var(--color-on-surface-muted)', marginBottom: '28px', lineHeight: 1.7, fontSize: '0.9rem' }}>
                            We&apos;ve sent a password reset link to <strong style={{ color: 'var(--color-on-surface)' }}>{email}</strong>.{' '}
                            Click the link in the email to set a new password.
                        </p>
                        <Link href="/login" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                            Back to Sign In
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className="font-heading" style={{ fontSize: '2rem', marginBottom: '10px', background: 'linear-gradient(to bottom, var(--color-on-surface), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Reset your password
                        </h1>
                        <p style={{ color: 'var(--color-on-surface-muted)', marginBottom: '28px', fontSize: '0.9rem' }}>
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </p>

                        {status === 'error' && (
                            <Alert variant="error" style={{ marginBottom: '20px' }}>
                                {errorMsg}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="pp-flex-col">
                            <div style={{ textAlign: 'left' }}>
                                <label className="pp-overline" style={{ marginBottom: '8px', display: 'block' }}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="chef@kitchen.com"
                                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                style={{ padding: '14px', background: 'var(--color-primary)', color: 'var(--color-bg)', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
                            >
                                {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </form>

                        <p style={{ marginTop: '24px', fontSize: '0.85rem' }}>
                            <Link href="/login" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                                ← Back to Sign In
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
