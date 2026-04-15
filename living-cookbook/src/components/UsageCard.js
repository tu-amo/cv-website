/**
 * UsageCard.js
 * Server component — renders tier + AI feature usage meters on the profile page.
 * Reads usage and tier data passed in as props (fetched by the profile page).
 *
 * CSS: UsageCard.module.css — §A tokens only, CSS Module pattern.
 * Icons: Icon.* from icons.js (scan, chef, crown, arrowRight).
 */

import Link            from 'next/link';
import styles          from './UsageCard.module.css';
import { Icon }        from '@/components/icons';
import { TIERS, TIER_LIMITS } from '@/lib/tiers';

// ── Tier display helpers ──────────────────────────────────────────────────────

const TIER_LABELS = {
    free:         'Home Cook · Free',
    kitchen_plus: 'Kitchen+',
    chef:         'Chef',
    pro_kitchen:  'Pro Kitchen',
};

const UPGRADE_CTA = {
    free:         { label: 'Upgrade to Kitchen+', href: '/upgrade' },
    kitchen_plus: { label: 'Upgrade to Chef',     href: '/upgrade' },
    chef:         null,   // no upgrade prompt
    pro_kitchen:  null,
};

// ── Progress meter helpers ────────────────────────────────────────────────────

function pct(used, limit) {
    if (limit === null || limit === 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
}

function fillClass(used, limit, blocked) {
    if (blocked)          return styles.blocked;
    if (used >= limit)    return styles.full;
    if (pct(used, limit) >= 80) return styles.warning;
    return '';
}

function resetDate() {
    const now   = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return first.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {string} props.tier        — user's current tier ('free' | 'kitchen_plus' | 'chef' | 'pro_kitchen')
 * @param {number} props.briefsUsed  — briefs used this month
 * @param {number} props.scansUsed   — scans used this month
 */
export function UsageCard({ tier, briefsUsed = 0, scansUsed = 0 }) {
    const limits     = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const isPaid     = tier !== 'free';
    const upgradeCta = UPGRADE_CTA[tier];

    const briefsLimit    = limits.briefs_per_month;   // null = unlimited, 0 = blocked
    const scansLimit     = limits.scans_per_month;    // null = unlimited
    const briefsBlocked  = briefsLimit === 0;
    const briefsUnlimited = briefsLimit === null;
    const scansUnlimited  = scansLimit === null;

    return (
        <div className={styles.card}>
            <h2 className="pp-section-heading">Plan &amp; Usage</h2>

            {/* Tier badge */}
            <div className={styles.tierRow}>
                <span className={`${styles.tierBadge} ${isPaid ? styles.paid : styles.free}`}>
                    {isPaid && <span aria-hidden="true">{Icon.crown}</span>}
                    {TIER_LABELS[tier] ?? tier}
                </span>
            </div>

            {/* Usage meters */}
            <div className={styles.meters}>

                {/* Recipe Scans */}
                <div className={styles.meter}>
                    <div className={styles.meterHeader}>
                        <span className={styles.meterLabel}>
                            <span aria-hidden="true">{Icon.scan}</span>
                            Recipe Scans
                        </span>
                        <span className={`${styles.meterCount} ${scansUnlimited ? styles.blocked : ''}`}>
                            {scansUnlimited
                                ? 'Unlimited'
                                : `${scansUsed} / ${scansLimit} this month`
                            }
                        </span>
                    </div>
                    <div className={styles.track} role="progressbar"
                         aria-valuenow={scansUnlimited ? 100 : scansUsed}
                         aria-valuemax={scansUnlimited ? 100 : scansLimit}
                         aria-label="Recipe scans used this month">
                        <div
                            className={`${styles.fill} ${fillClass(scansUsed, scansLimit, false)}`}
                            style={{ width: scansUnlimited ? '100%' : `${pct(scansUsed, scansLimit)}%` }}
                        />
                    </div>
                </div>

                {/* AI Styling Briefs */}
                <div className={styles.meter}>
                    <div className={styles.meterHeader}>
                        <span className={styles.meterLabel}>
                            <span aria-hidden="true">{Icon.chef}</span>
                            AI Styling Briefs
                        </span>
                        <span className={`${styles.meterCount} ${briefsBlocked ? styles.blocked : ''}`}>
                            {briefsBlocked
                                ? 'Upgrade to unlock'
                                : briefsUnlimited
                                    ? 'Unlimited'
                                    : `${briefsUsed} / ${briefsLimit} this month`
                            }
                        </span>
                    </div>
                    <div className={styles.track} role="progressbar"
                         aria-valuenow={briefsBlocked ? 0 : briefsUnlimited ? 100 : briefsUsed}
                         aria-valuemax={briefsBlocked ? 1 : briefsUnlimited ? 100 : briefsLimit}
                         aria-label="AI briefs used this month">
                        <div
                            className={`${styles.fill} ${fillClass(briefsUsed, briefsLimit, briefsBlocked)}`}
                            style={{
                                width: briefsBlocked
                                    ? '0%'
                                    : briefsUnlimited
                                        ? '100%'
                                        : `${pct(briefsUsed, briefsLimit)}%`
                            }}
                        />
                    </div>
                </div>

            </div>

            {/* Footer — reset date + upgrade CTA */}
            <div className={styles.upgradeRow}>
                <span className={styles.resetNote}>
                    Usage resets {resetDate()}
                </span>
                {upgradeCta && (
                    <Link href={upgradeCta.href} className={styles.upgradeLink}>
                        {upgradeCta.label}
                        <span aria-hidden="true">{Icon.arrowRight}</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
