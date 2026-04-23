import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { updateDisplayName, updateEmail, updateUnitSystem } from './actions'
import { PageHeader, Alert } from '@/components/ui'
import { MeasurementFieldset } from '@/components/MeasurementFieldset'
import { UsageCard }  from '@/components/UsageCard'

export const metadata = {
    title: 'My Profile — The Living Cookbook',
}

export default async function ProfilePage({ searchParams }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, tier, unit_system')
        .eq('id', user.id)
        .maybeSingle()

    const unitSystem = profile?.unit_system ?? 'metric'

    // Fetch current month's usage (RLS allows reading own rows)
    const monthKey = (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    })()
    const { data: usage } = await supabase
        .from('usage_tracking')
        .select('briefs_used, scans_used')
        .eq('user_id', user.id)
        .eq('month', monthKey)
        .maybeSingle()

    const params = await searchParams
    const success = params?.success
    const error = params?.error

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: 'var(--color-on-surface)',
        outline: 'none',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
    }

    const labelStyle = {
        color: 'var(--color-primary)',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: '8px',
        display: 'block',
    }

    const cardStyle = {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '16px',
    }

    return (
        <div className="pp-page-card">

            <PageHeader overline="Account" title="My Profile" />

            <Alert variant="success">{success && `✓ ${success}`}</Alert>
            <Alert variant="error">{error}</Alert>

            {/* Plan & Usage */}
            <UsageCard
                tier={profile?.tier ?? 'free'}
                briefsUsed={usage?.briefs_used ?? 0}
                scansUsed={usage?.scans_used ?? 0}
            />

            {/* Display Name */}
            <div style={cardStyle}>
                <h2 className="pp-section-heading">
                    Display Name
                </h2>
                <form action={updateDisplayName} className="pp-flex-col">
                    <div>
                        <label style={labelStyle}>Your Name</label>
                        <input
                            name="display_name"
                            type="text"
                            defaultValue={profile?.display_name ?? ''}
                            required
                            placeholder="e.g. Elaine"
                            style={inputStyle}
                        />
                        <p style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.78rem', marginTop: '8px' }}>
                            This is how you appear in the kitchen — in the nav and on shared recipes.
                        </p>
                    </div>
                    <button
                        type="submit"
                        style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'var(--color-primary)', color: 'var(--color-bg)', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        Save Name
                    </button>
                </form>
            </div>

            {/* Email */}
            <div style={cardStyle}>
                <h2 className="pp-section-heading">
                    Email Address
                </h2>
                <p style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>
                    Current: <strong style={{ color: 'var(--color-on-surface)' }}>{user.email}</strong>
                </p>
                <form action={updateEmail} className="pp-flex-col">
                    <div>
                        <label style={labelStyle}>New Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="new@email.com"
                            style={inputStyle}
                        />
                        <p style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.78rem', marginTop: '8px' }}>
                            Supabase will send a confirmation link to the new address before switching.
                        </p>
                    </div>
                    <button
                        type="submit"
                        style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'rgba(255,255,255,0.06)', color: 'var(--color-on-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        Update Email
                    </button>
                </form>
            </div>

            {/* Unit System Preference */}
            <div style={cardStyle}>
                <h2 className="pp-section-heading">
                    Measurement Preference
                </h2>
                <p style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.82rem', marginBottom: '24px' }}>
                    The AI recipe scanner will output quantities in your preferred system.
                    You can always convert in the wizard after scanning.
                </p>
                <form action={updateUnitSystem} className="pp-flex-col">
                    {/* MeasurementFieldset is a client component so the label highlight
                        updates immediately on click (server components can't hold state). */}
                    <MeasurementFieldset defaultValue={unitSystem} labelStyle={labelStyle} />

                    <button
                        type="submit"
                        style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'var(--color-primary)', color: 'var(--color-bg)', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        Save Preference
                    </button>
                </form>
            </div>

        </div>
    )
}
