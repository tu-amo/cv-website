// ADR-007: supabaseAdmin used here deliberately — invite join flow requires bypassing RLS.
// A joining user cannot SELECT groups they are not yet a member of (chicken-and-egg).
// User identity is still verified via supabase.auth.getUser() JWT before any write.
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function JoinPage({ params }) {
    const { code } = await params;
    const supabase = await createClient();

    // 1. Auth check — preserve the invite code through login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/login?next=/join/${code}`);
    }

    // 2. Look up the household by invite code
    // supabaseAdmin bypasses RLS — a non-member cannot SELECT groups they haven't joined yet
    const { data: group, error: groupError } = await supabaseAdmin
        .from('groups')
        .select('id, name, description')
        .eq('invite_code', code)
        .single();

    if (groupError || !group) {
        return <JoinLayout><ErrorState message="This invite link is invalid or has expired." /></JoinLayout>;
    }

    // 3. Check if already a member
    const { data: existing } = await supabaseAdmin
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (existing) {
        return (
            <JoinLayout>
                <AlreadyMemberState groupName={group.name} />
            </JoinLayout>
        );
    }

    // 4. Auto-join — insert the membership row
    // user.id is from the verified JWT session — cannot be spoofed
    const { error: joinError } = await supabaseAdmin
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'member' });

    if (joinError) {
        return (
            <JoinLayout>
                <ErrorState message="Could not join the household. Please try again or ask to be re-invited." />
            </JoinLayout>
        );
    }

    // 5. Success
    return (
        <JoinLayout>
            <SuccessState groupName={group.name} />
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
            background: 'var(--color-bg-deep-olive)',
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
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏠</div>
            <h1 className="font-heading" style={{
                fontSize: '2rem',
                marginBottom: '12px',
                background: 'linear-gradient(to bottom, var(--color-text-papyrus), var(--color-accent-amber))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                Welcome to the kitchen!
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
                You have joined <strong style={{ color: 'var(--color-text-papyrus)' }}>{groupName}</strong>. 
                You can now see and share recipes with your household.
            </p>
            <Link href="/household" style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'var(--color-accent-amber)',
                color: 'var(--color-bg-deep-olive)',
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
            <h1 className="font-heading" style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--color-text-papyrus)' }}>
                Already in this kitchen
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
                You are already a member of <strong style={{ color: 'var(--color-text-papyrus)' }}>{groupName}</strong>.
            </p>
            <Link href="/household" style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'var(--color-accent-amber)',
                color: 'var(--color-bg-deep-olive)',
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
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h1 className="font-heading" style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--color-text-papyrus)' }}>
                Invite not found
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
                {message}
            </p>
            <Link href="/" style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--color-text-papyrus)',
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
