/**
 * tiers.js — Single source of truth for Pretzel Prep subscription tiers.
 *
 * Used by:
 *  - /api/brief and /api/scan  → usage gate enforcement
 *  - /profile page             → show current usage + tier
 *  - Future: /pricing page     → display tier features + CTAs
 *  - Future: Stripe paywall    → feature gate checks post-checkout
 *
 * When adding a new gated feature:
 *  1. Add the limit field to TIER_LIMITS for each tier
 *  2. Add a display entry to TIERS[x].features
 *  3. Add the check to the relevant API route via checkUsage()
 *
 * Tier IDs must match the `tier` column in the `profiles` table.
 */

// ── Usage limits (null = unlimited, 0 = blocked) ──────────────────────────────
export const TIER_LIMITS = {
    free: {
        briefs_per_month: 0,    // blocked — biggest upgrade lever
        scans_per_month:  5,    // enough to fall in love, not to digitise a library
    },
    kitchen_plus: {
        briefs_per_month: 5,    // one brief per major recipe per week
        scans_per_month:  30,   // one full cookbook chapter per month
    },
    chef: {
        briefs_per_month: null, // unlimited
        scans_per_month:  null, // unlimited
    },
    pro_kitchen: {
        briefs_per_month: null, // unlimited
        scans_per_month:  null, // unlimited
    },
};

// ── Full tier definitions (for pricing page, upgrade prompts, Stripe) ─────────
export const TIERS = {
    free: {
        id:          'free',
        name:        'Home Cook',
        price:       0,
        currency:    'EUR',
        interval:    null,
        description: 'Start organising your family recipes.',
        cta:         'Get started free',
        highlighted: false,
        limits:      TIER_LIMITS.free,
        features: [
            { label: 'Up to 15 recipes',             included: true  },
            { label: '1 household',                  included: true  },
            { label: 'Ingredient scaling',           included: true  },
            { label: 'Market list',                  included: true  },
            { label: '5 recipe scans / month',       included: true  },
            { label: 'Nutrition per serving',        included: false },
            { label: 'AI styling briefs',            included: false },
            { label: 'Unlimited recipes',            included: false },
            { label: 'Multiple households',          included: false },
        ],
    },

    kitchen_plus: {
        id:          'kitchen_plus',
        name:        'Kitchen+',
        price:       5.99,
        currency:    'EUR',
        interval:    'month',
        description: 'For serious home cooks and growing households.',
        cta:         'Start Kitchen+',
        highlighted: true,     // the "recommended" tier — highlighted on pricing page
        stripeMonthlyPriceId: null,  // TODO: set when Stripe is configured
        stripeAnnualPriceId:  null,
        limits:      TIER_LIMITS.kitchen_plus,
        features: [
            { label: 'Unlimited recipes',             included: true  },
            { label: 'Up to 3 households',            included: true  },
            { label: 'Ingredient scaling',            included: true  },
            { label: 'Nutrition per serving',         included: true  },
            { label: 'Market list',                   included: true  },
            { label: '30 recipe scans / month',       included: true  },
            { label: '5 AI styling briefs / month',   included: true  },
            { label: 'Unlimited households',          included: false },
            { label: 'Unlimited AI briefs',           included: false },
        ],
    },

    chef: {
        id:          'chef',
        name:        'Chef',
        price:       12.99,
        currency:    'EUR',
        interval:    'month',
        description: 'For community cooks and emerging food businesses.',
        cta:         'Go Chef',
        highlighted: false,
        stripeMonthlyPriceId: null,  // TODO: set when Stripe is configured
        stripeAnnualPriceId:  null,
        limits:      TIER_LIMITS.chef,
        features: [
            { label: 'Unlimited recipes',             included: true  },
            { label: 'Unlimited households',          included: true  },
            { label: 'Ingredient scaling',            included: true  },
            { label: 'Nutrition per serving',         included: true  },
            { label: 'Market list',                   included: true  },
            { label: 'Unlimited recipe scans',        included: true  },
            { label: 'Unlimited AI styling briefs',   included: true  },
            { label: 'Priority support',              included: true  },
            { label: 'Early access to new features',  included: true  },
        ],
    },

    pro_kitchen: {
        id:          'pro_kitchen',
        name:        'Pro Kitchen',
        price:       29.99,
        currency:    'EUR',
        interval:    'month',
        description: 'For teams, community kitchens, and small food businesses.',
        cta:         'Go Pro Kitchen',
        highlighted: false,
        stripeMonthlyPriceId: null,  // TODO: set when Stripe is configured
        stripeAnnualPriceId:  null,
        limits:      TIER_LIMITS.pro_kitchen,
        features: [
            { label: 'Everything in Chef',            included: true  },
            { label: 'Pro Kitchen group workspace',   included: true  },
            { label: 'Team recipe management',        included: true  },
            { label: 'Production scaling tools',      included: true  },
            { label: 'Unlimited team members',        included: true  },
            { label: 'Admin + permissions control',   included: true  },
            { label: 'Early Pretzel Plan access',     included: true  },
        ],
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the TIER_LIMITS object for a given tier string. Defaults to free. */
export function getTierLimits(tier) {
    return TIER_LIMITS[tier] ?? TIER_LIMITS.free;
}

/** Returns true if the feature has no limit for this tier. */
export function isUnlimited(tier, limitKey) {
    return getTierLimits(tier)[limitKey] === null;
}

/** Returns display metadata for a tier. */
export function getTierMeta(tier) {
    return TIERS[tier] ?? TIERS.free;
}

/** Returns tiers in display order (for pricing page rendering). */
export const TIER_ORDER = ['free', 'kitchen_plus', 'chef', 'pro_kitchen'];
