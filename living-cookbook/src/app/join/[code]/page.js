// ADR-007 (updated 2026-04-21): Service role replaced by SECURITY DEFINER RPC.
// join_household_by_invite_code() runs as postgres with auth.uid() for identity,
// eliminating the supabaseAdmin bypass. Migration 20260421180000.
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons';

export default async function JoinPage({ params }) {
    const { code } = await params;
    const supabase = await createClient();

    // 1. Auth check — preserve the invite code through login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/login?next=/join/${code}`);
    }

    // 2. Delegate the entire join flow to the SECURITY DEFINER RPC.
    //    The function verifies caller identity via auth.uid() in Postgres —
    //    no service role key needed in application code.
    const { data, error } = await supabase.rpc('join_household_by_invite_code', {
        p_invite_code: code,
    });

    if (error || !data || data.length === 0) {
        return <JoinLayout><ErrorState message="Could not process invite. Please try again or ask to be re-invited." /></JoinLayout>;
    }

    const result = data[0];

    if (result.outcome === 'invalid_code') {
        return <JoinLayout><ErrorState message="This invite link is invalid or has expired." /></JoinLayout>;
    }

    if (result.outcome === 'already_member') {
        return (
            <JoinLayout>
                <AlreadyMemberState groupName={result.group_name} />
            </JoinLayout>
        );
    }

    // outcome === 'joined'
    return (
        <JoinLayout>
            <SuccessState groupName={result.group_name} />
        </JoinLayout>
    );
}

// ── Layout Shell ──────────────────────────────────────────────────────────────

function JoinLayout({ children }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg)',
            padding: '20px',
        }}>
            <div style={{
                maxWidth: '440px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '24px',
                padding: '48px 40px',
                textAlign: 'center',
            }}>
                {children}
            </div>
        </div>
    );
}

// ── States ────────────────────────────────────────────────────────────────────

function SuccessState({ groupName }) {
    return (
        <>
            {/* Icon.house at 48px — LL-046: no emoji for UI affordances */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-primary)' }}>
                <Icon.house size={48} aria-hidden="true" />
            </div>
            <h1 className="font-heading" style={{
                fontSize: '2rem',
                marginBottom: '12px',
                background: 'linear-gradient(to bottom, var(--color-on-surface), var(--color-primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                Welcome to the kitchen!
            </h1>
            <p style={{ color: 'var(--color-on-surface-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
                You have joined <strong style={{ color: 'var(--color-on-surface)' }}>{groupName}</strong>.{' '}
                You can now see and share recipes with your household.
            </p>
            <Link href="/household" style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'var(--color-primary)',
                color: 'var(--color-bg)',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
            }}>
                Go to Household →
            </Link>
        </>
    );
}

function AlreadyMemberState({ groupName }) {
    return (
        <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h1 className="font-heading" style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--color-on-surface)' }}>
                Already in this kitchen
            </h1>
            <p style={{ color: 'var(--color-on-surface-muted)', marginBottom: '32px' }}>
                You are already a member of <strong style={{ color: 'var(--color-on-surface)' }}>{groupName}</strong>.
            </p>
            <Link href="/household" style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'var(--color-primary)',
                color: 'var(--color-bg)',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
            }}>
                Go to Household →
            </Link>
        </>
    );
}

function ErrorState({ message }) {
    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-primary)' }}>
                <Icon.warn size={48} aria-hidden="true" />
            </div>
            <h1 className="font-heading" style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--color-on-surface)' }}>
                Invite not found
            </h1>
            <p style={{ color: 'var(--color-on-surface-muted)', marginBottom: '32px' }}>
                {message}
            </p>
            <Link href="/" style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--color-on-surface)',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
            }}>
                Back to Library
            </Link>
        </>
    );
}
