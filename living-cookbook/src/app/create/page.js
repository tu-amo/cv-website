'use client';

import dynamic from 'next/dynamic';

const RecipeWizard = dynamic(
    () => import('@/components/RecipeWizard'),
    {
        loading: () => (
            <div className="pp-page-card" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.9rem' }}>Loading wizard…</span>
            </div>
        ),
        ssr: false,
    }
);

export default function CreatePage() {
    return <RecipeWizard />;
}
