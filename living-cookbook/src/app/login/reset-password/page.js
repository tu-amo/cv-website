"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | done | error
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setErrorMsg("Passwords don't match.");
            setStatus('error');
            return;
        }
        if (password.length < 8) {
            setErrorMsg('Password must be at least 8 characters.');
            setStatus('error');
            return;
        }
        setStatus('loading');
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setErrorMsg(error.message);
            setStatus('error');
        } else {
            setStatus('done');
            setTimeout(() => router.push('/'), 2000);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-deep-olive)', padding: '20px' }}>
            <div style={{ maxWidth: '400px', width: '100%', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>

                {status === 'done' ? (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                        <h1 className="font-heading" style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--color-text-papyrus)' }}>Password updated!</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Taking you to the kitchen…</p>
                    </>
                ) : (
                    <>
                        <h1 className="font-heading" style={{ fontSize: '2rem', marginBottom: '10px', background: 'linear-gradient(to bottom, var(--color-text-papyrus), var(--color-accent-amber))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Set new password
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '28px', fontSize: '0.9rem' }}>
                            Choose a strong password for your kitchen.
                        </p>

                        {status === 'error' && (
                            <div style={{ padding: '12px', background: 'rgba(229,62,62,0.1)', border: '1px solid #e53e3e', color: '#fc8181', borderRadius: '12px', marginBottom: '20px', fontSize: '0.85rem' }}>
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[
                                { label: 'New Password', value: password, setter: setPassword },
                                { label: 'Confirm Password', value: confirm, setter: setConfirm },
                            ].map(({ label, value, setter }) => (
                                <div key={label} style={{ textAlign: 'left' }}>
                                    <label style={{ color: 'var(--color-accent-amber)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>{label}</label>
                                    <input
                                        type="password"
                                        value={value}
                                        onChange={(e) => setter(e.target.value)}
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            ))}
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                style={{ marginTop: '6px', padding: '14px', background: 'var(--color-accent-amber)', color: 'var(--color-bg-deep-olive)', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
                            >
                                {status === 'loading' ? 'Saving…' : 'Update Password'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
