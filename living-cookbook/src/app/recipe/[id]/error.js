'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RecipePageError({ error, reset }) {
    useEffect(() => {
        console.error('[RecipePage error]', error);
    }, [error]);

    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '16px', padding: '40px 20px', textAlign: 'center',
        }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-primary)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h2 className="pp-section-heading" style={{ margin: 0 }}>
                Something went wrong
            </h2>
            <p style={{ margin: 0, color: 'var(--color-on-surface-muted)', maxWidth: '360px', fontSize: '0.9rem' }}>
                This recipe page hit an unexpected error. Try reloading or go back to the library.
            </p>
            {process.env.NODE_ENV !== 'production' && (
                <pre style={{
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,100,100,0.3)',
                    borderRadius: '8px', padding: '12px 16px', fontSize: '0.75rem',
                    color: '#ff9999', textAlign: 'left', maxWidth: '640px', overflowX: 'auto',
                }}>
                    {error?.message}
                </pre>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={reset}
                    style={{
                        background: 'var(--color-primary)', color: 'var(--color-bg)',
                        border: 'none', borderRadius: '10px', padding: '10px 24px',
                        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    }}
                >
                    Try again
                </button>
                <Link href="/" style={{
                    background: 'transparent',
                    border: '1px solid var(--color-hairline)',
                    color: 'var(--color-on-surface-muted)',
                    borderRadius: '10px', padding: '10px 24px',
                    fontWeight: 600, fontSize: '0.9rem',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                }}>
                    Back to Library
                </Link>
            </div>
        </div>
    );
}
