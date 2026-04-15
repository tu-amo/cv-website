import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'System Info — The Living Cookbook',
    description: 'Build and deployment diagnostics.',
};

// ── helpers ──────────────────────────────────────────────────────────────────
function Card({ title, icon, children }) {
    return (
        <div style={{
            background: 'rgba(0,0,0,0.22)',
            border: '1px solid rgba(235,220,178,0.1)',
            borderRadius: '14px',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
        }}>
            <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-accent-amber)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}>
                {icon} {title}
            </div>
            {children}
        </div>
    );
}

function Row({ label, value, mono = false, highlight = false, pill = null }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '9px 0',
            borderBottom: '1px solid rgba(235,220,178,0.06)',
            gap: '16px',
        }}>
            <span style={{ fontSize: '0.83rem', color: 'rgba(235,220,178,0.5)', whiteSpace: 'nowrap' }}>
                {label}
            </span>
            <span style={{
                fontSize: '0.83rem',
                fontFamily: mono ? 'monospace' : 'inherit',
                color: highlight ? 'var(--color-accent-amber)' : 'var(--color-text-papyrus)',
                fontWeight: highlight ? 700 : 400,
                textAlign: 'right',
                wordBreak: 'break-all',
            }}>
                {pill ? (
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: pill === 'production' ? 'rgba(52,211,153,0.15)' :
                                    pill === 'preview'    ? 'rgba(251,191,36,0.15)' :
                                                           'rgba(96,165,250,0.15)',
                        color:      pill === 'production' ? '#34d399' :
                                    pill === 'preview'    ? '#fbbf24' :
                                                           '#60a5fa',
                        border: `1px solid ${
                                    pill === 'production' ? 'rgba(52,211,153,0.3)' :
                                    pill === 'preview'    ? 'rgba(251,191,36,0.3)' :
                                                           'rgba(96,165,250,0.3)'
                        }`,
                    }}>
                        {value}
                    </span>
                ) : value}
            </span>
        </div>
    );
}

function EnvRow({ name, present }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '9px 0',
            borderBottom: '1px solid rgba(235,220,178,0.06)',
        }}>
            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'rgba(235,220,178,0.55)' }}>
                {name}
            </span>
            <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: present ? '#34d399' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
            }}>
                {present ? '✓ SET' : '✗ MISSING'}
            </span>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function SystemPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Build-time constants (injected via next.config.mjs)
    const buildTime   = process.env.NEXT_PUBLIC_BUILD_TIME  || null;
    const appVersion  = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';

    // Vercel auto-injected at build time (not NEXT_PUBLIC_ so server-only)
    const gitSha      = process.env.VERCEL_GIT_COMMIT_SHA         || 'local-dev';
    const gitBranch   = process.env.VERCEL_GIT_COMMIT_REF         || 'local';
    const gitMessage  = process.env.VERCEL_GIT_COMMIT_MESSAGE      || 'Local development build';
    const gitAuthor   = process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME  || 'local';
    const vercelEnv   = process.env.VERCEL_ENV                    || 'development';
    const vercelUrl   = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const vercelRegion = process.env.VERCEL_REGION                 || 'local';
    const deploymentId = process.env.VERCEL_DEPLOYMENT_ID          || 'local';

    const shaShort = gitSha.length > 7 ? gitSha.slice(0, 7) : gitSha;

    // Env var presence check (never show values)
    const envChecks = [
        { name: 'NEXT_PUBLIC_SUPABASE_URL',      present: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
        { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        { name: 'SUPABASE_SERVICE_ROLE_KEY',     present: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
        { name: 'USDA_FDC_API_KEY',              present: !!process.env.USDA_FDC_API_KEY },
        { name: 'OPENAI_API_KEY',                present: !!process.env.OPENAI_API_KEY },
    ];

    const allEnvPresent = envChecks.every(e => e.present);
    const missingCount  = envChecks.filter(e => !e.present).length;

    const buildDate = buildTime ? new Date(buildTime).toLocaleString('en-GB', {
        timeZone: 'Europe/Berlin',
        dateStyle: 'medium',
        timeStyle: 'short',
    }) : 'Unknown (rebuild to inject)';

    return (
        <div className="pp-page-card">

            <PageHeader
                overline="System"
                title="System Info"
                subtitle="Build diagnostics and deployment health for The Living Cookbook."
            />

            {/* ── Status Banner ── */}
            <div style={{
                padding: '14px 20px',
                borderRadius: '10px',
                marginBottom: '28px',
                background: allEnvPresent ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${allEnvPresent ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.85rem',
                color: allEnvPresent ? '#34d399' : '#f87171',
                fontWeight: 600,
            }}>
                {allEnvPresent ? '✓' : '⚠'}
                {allEnvPresent
                    ? `All ${envChecks.length} required environment variables are configured.`
                    : `${missingCount} required environment variable${missingCount > 1 ? 's are' : ' is'} missing — some features may not work.`
                }
            </div>

            {/* ── Grid ── */}
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>

                {/* Build */}
                <Card title="Build" icon="🏗">
                    <Row label="App Version"  value={`v${appVersion}`} highlight />
                    <Row label="Git Commit"   value={shaShort} mono highlight />
                    <Row label="Branch"       value={gitBranch} mono />
                    <Row label="Author"       value={gitAuthor} />
                    <Row label="Message"      value={gitMessage} />
                    <Row label="Built At"     value={buildDate} />
                </Card>

                {/* Deployment */}
                <Card title="Deployment" icon="🌐">
                    <Row
                        label="Environment"
                        value={vercelEnv}
                        pill={vercelEnv}
                    />
                    <Row label="URL"           value={vercelUrl} mono />
                    <Row label="Region"        value={vercelRegion} mono />
                    <Row label="Deployment ID" value={deploymentId.slice(0, 20) + (deploymentId.length > 20 ? '…' : '')} mono />
                    <Row label="Node.js"       value={process.version} mono />
                </Card>

                {/* Full git SHA */}
                <Card title="Full Git SHA" icon="🔑">
                    <div style={{
                        marginTop: '4px',
                        padding: '14px 16px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        color: 'var(--color-accent-amber)',
                        wordBreak: 'break-all',
                        lineHeight: 1.6,
                        letterSpacing: '0.04em',
                    }}>
                        {gitSha}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(235,220,178,0.35)', marginTop: '10px' }}>
                        Compare this with the GitHub commit or Vercel deployment SHA to confirm the correct version is live.
                    </p>
                </Card>

                {/* Env vars */}
                <Card title="Environment Variables" icon="⚙️">
                    {envChecks.map(e => (
                        <EnvRow key={e.name} name={e.name} present={e.present} />
                    ))}
                    <p style={{ fontSize: '0.73rem', color: 'rgba(235,220,178,0.3)', marginTop: '12px' }}>
                        Values are never shown — only presence is checked.
                    </p>
                </Card>

            </div>

            {/* ── Footer note ── */}
            <p style={{
                marginTop: '32px',
                fontSize: '0.75rem',
                color: 'rgba(235,220,178,0.25)',
                textAlign: 'center',
            }}>
                Page is server-rendered on every request (no cache). Build constants are injected at build time via next.config.mjs.
            </p>
        </div>
    );
}
