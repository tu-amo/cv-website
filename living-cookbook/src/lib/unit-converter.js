"use strict";

import { logDensityMiss } from './density-miss-logger.js';

/**
 * unit-converter.js
 *
 * Converts volumetric ingredient quantities (cups, tbsp, tsp, etc.) to grams
 * using a two-step lookup: unit → ml, then ingredient name → density (g/ml).
 *
 * Returns null (not an error) for:
 *   - Already-weight units (g, kg, oz, lb) — show unchanged
 *   - Countable units (pieces, pinch, sprig, etc.) — show unchanged
 *   - Unknown volumetric units — show unchanged
 *   - Ingredients with no density entry — show unchanged + log the miss
 */

// ── Volume → ml lookup ───────────────────────────────────────────────────────
const VOLUME_TO_ML = {
    tsp: 5,         teaspoon: 5,        teaspoons: 5,
    tbsp: 15,       tablespoon: 15,     tablespoons: 15,
    cup: 240,       cups: 240,
    'fl oz': 30,    floz: 30,
    ml: 1,
    l: 1000,        litre: 1000,        liter: 1000,
    litres: 1000,   liters: 1000,
};

// ── Units that are already weight — no conversion needed, not a miss ─────────
const WEIGHT_UNITS = new Set(['g', 'kg', 'oz', 'lb', 'lbs', 'gram', 'grams', 'kilogram', 'kilograms']);

// ── Units that are countable — conversion not applicable, not a miss ─────────
const COUNTABLE_UNITS = new Set([
    'piece', 'pieces', 'pc', 'pcs',
    'pinch', 'pinches',
    'sprig', 'sprigs',
    'leaf', 'leaves',
    'clove', 'cloves',
    'slice', 'slices',
    'bunch', 'bunches',
    'stalk', 'stalks',
    'handful', 'handfuls',
    'dash', 'dashes',
    'drop', 'drops',
    'sheet', 'sheets',
    'can', 'cans',
    'tin', 'tins',
    'sachet', 'sachets',
    'sprig', 'sprigs',
    'head', 'heads',
]);

// ── Ingredient density table (g/ml) ─────────────────────────────────────────
// Keys are lowercase substrings. Lookup is fuzzy: ingredient name must CONTAIN the key.
// Longer/more-specific keys are matched first.
const INGREDIENT_DENSITY = {
    // Flours
    'bread flour':          0.53,
    'cake flour':           0.48,
    'almond flour':         0.38,
    'almond meal':          0.38,
    'whole wheat flour':    0.52,
    'wholemeal flour':      0.52,
    'self-raising flour':   0.53,
    'self raising flour':   0.53,
    'plain flour':          0.53,
    'all-purpose flour':    0.53,
    'flour':                0.53,   // generic fallback

    // Sugars & Sweeteners
    'icing sugar':          0.56,
    'powdered sugar':       0.56,
    'caster sugar':         0.85,
    'brown sugar':          0.77,
    'raw sugar':            0.85,
    'demerara':             0.85,
    'sugar':                0.85,   // generic fallback
    'honey':                1.40,
    'golden syrup':         1.40,
    'maple syrup':          1.32,
    'agave':                1.40,
    'treacle':              1.45,
    'molasses':             1.45,
    'condensed milk':       1.30,

    // Fats
    'peanut butter':        1.08,
    'almond butter':        1.05,
    'coconut oil':          0.92,
    'vegetable oil':        0.92,
    'sunflower oil':        0.92,
    'olive oil':            0.92,
    'sesame oil':           0.93,
    'butter':               0.91,
    'ghee':                 0.91,
    'lard':                 0.92,
    'shortening':           0.88,
    'oil':                  0.92,   // generic fallback

    // Dairy
    'double cream':         0.99,
    'heavy cream':          0.99,
    'whipping cream':       0.99,
    'sour cream':           0.96,
    'crème fraîche':        0.98,
    'creme fraiche':        0.98,
    'cream':                0.99,
    'buttermilk':           1.03,
    'milk':                 1.03,
    'yogurt':               1.05,
    'yoghurt':              1.05,
    'tahini':               1.07,

    // Grains, Starches & Leaveners
    'rolled oats':          0.41,
    'oats':                 0.41,
    'cornstarch':           0.61,
    'cornflour':            0.61,
    'arrowroot':            0.65,
    'baking soda':          0.80,
    'bicarbonate of soda':  0.80,
    'bicarbonate':          0.80,
    'baking powder':        0.75,
    'cocoa powder':         0.41,
    'cocoa':                0.41,
    'chocolate powder':     0.41,
    'desiccated coconut':   0.35,
    'shredded coconut':     0.35,
    'coconut':              0.35,
    'breadcrumbs':          0.42,
    'panko':                0.22,
    'rice':                 0.78,
    'salt':                 1.20,

    // Liquids
    'soy sauce':            1.19,
    'mirin':                1.20,   // sweet Japanese rice wine — high sugar content
    'fish sauce':           1.10,
    'worcestershire sauce': 1.07,
    'worcestershire':       1.07,
    'lemon juice':          1.03,
    'lime juice':           1.03,
    'orange juice':         1.04,
    'vinegar':              1.01,
    'stock':                1.00,
    'broth':                1.00,
    'water':                1.00,
    'wine':                 0.99,
    'beer':                 1.01,
    'tomato paste':         1.08,
    'tomato puree':         1.05,
    'ketchup':              1.07,

    // Nuts & Seeds
    'sesame seeds':         0.58,
    'sesame':               0.58,
    'poppy seeds':          0.53,
    'chia seeds':           0.53,
    'flaxseed':             0.53,
    'black mustard seeds':  0.55,   // whole — density miss log 2026-04-17
    'mustard seeds':        0.55,   // whole
    'peppercorns':          0.53,   // whole black/white peppercorns — density miss log 2026-04-19 (count 2)
    'pine nuts':            0.56,
    'walnuts':              0.47,
    'walnut':               0.47,
    'pecans':               0.47,
    'almonds':              0.61,
    'almond':               0.61,

    // Fruit (fresh, chopped/chunks — density miss review 2026-03-31)
    'pineapple':            0.65,   // fresh chunks ~156g per cup

    // Aromatics (fresh — density miss review 2026-03-31)
    // Note: 'ground ginger' (0.53) and 'ginger powder' (0.53) remain for dried
    // Note: 'garlic powder' (0.50) remains for dried; longer keys match first
    'spring onion white':   0.21,   // most specific match first (from miss log)
    'spring onion':         0.21,
    'green onion':          0.21,
    'scallion':             0.21,
    'ginger':               0.40,   // fresh grated/minced ~6g per tbsp
    'garlic':               0.60,   // fresh minced ~9g per tbsp

    // Ground Spices (approximate — all ground spices ~0.4–0.6 g/ml)
    'ground cinnamon':      0.56,
    'cinnamon':             0.56,
    'ground cumin':         0.53,
    'cumin':                0.53,
    'ground turmeric':      0.60,
    'turmeric':             0.60,
    'ground ginger':        0.53,
    'ginger powder':        0.53,
    'garlic powder':        0.50,
    'onion powder':         0.50,
    'ground paprika':       0.46,
    'smoked paprika':       0.46,
    'paprika':              0.46,
    'ground chilli':        0.40,
    'chilli powder':        0.40,
    'chili powder':         0.40,
    'cayenne':              0.40,
    'ground pepper':        0.50,
    'black pepper':         0.50,
    'ground nutmeg':        0.48,
    'nutmeg':               0.48,
    'ground cardamom':      0.46,
    'cardamom':             0.46,
    'ground coriander':     0.50,
    'ground cloves':        0.56,
    'cloves':               0.56,
    'mixed spice':          0.50,
    'allspice':             0.52,
    'dried oregano':        0.30,
    'oregano':              0.30,
    'dried basil':          0.15,
    'basil':                0.15,
    'dried thyme':          0.21,
    'thyme':                0.21,
    'dried rosemary':       0.20,
    'rosemary':             0.20,
};

// Sort keys longest-first so more specific matches win over generic ones
const DENSITY_KEYS = Object.keys(INGREDIENT_DENSITY).sort((a, b) => b.length - a.length);

/**
 * Find the density for an ingredient by fuzzy substring matching.
 * @param {string} name - lowercase ingredient name
 * @returns {number|null} density in g/ml, or null if not found
 */
const findDensity = (name) => {
    const lower = name.toLowerCase();
    for (const key of DENSITY_KEYS) {
        if (lower.includes(key)) return INGREDIENT_DENSITY[key];
    }
    return null;
};

/**
 * Parse a quantity string to a decimal number.
 * Handles: integers, decimals, simple fractions (1/2), compound fractions (1 1/2).
 * For ranges (1-2) returns the lower bound only.
 * @param {string|number} qty
 * @returns {number|null}
 */
const parseQty = (qty) => {
    if (qty === null || qty === undefined || qty === '') return null;
    const str = qty.toString().trim();

    // Range — take the lower bound
    if (str.includes('-')) {
        const lower = str.split('-')[0].trim();
        return parseQty(lower);
    }

    // Compound fraction: "1 1/2"
    const compound = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (compound) {
        return parseInt(compound[1]) + parseInt(compound[2]) / parseInt(compound[3]);
    }

    // Simple fraction: "1/2"
    const fraction = str.match(/^(\d+)\/(\d+)$/);
    if (fraction) {
        return parseInt(fraction[1]) / parseInt(fraction[2]);
    }

    const n = parseFloat(str);
    return isNaN(n) ? null : n;
};

/**
 * Convert a volumetric quantity to grams.
 *
 * @param {string|number} qty        - The quantity (e.g. "1", "1/2", "1 1/2", "1-2")
 * @param {string}        unit       - The unit (e.g. "cup", "tbsp", "tsp")
 * @param {string}        ingredientName - The ingredient name (e.g. "plain flour")
 *
 * @returns {{ grams: number, isRange: boolean } | null}
 *   null means: not convertible (show original). Reasons may be:
 *   - already a weight unit
 *   - countable unit (piece, pinch, etc.)
 *   - unknown unit
 *   - no density found (miss has been logged)
 */
export const convertToGrams = (qty, unit, ingredientName) => {
    if (!unit || !ingredientName) return null;

    const unitLower = unit.toLowerCase().trim();

    // Already a weight unit — pass through unchanged, not a miss
    if (WEIGHT_UNITS.has(unitLower)) return null;

    // Countable unit — not applicable, not a miss
    if (COUNTABLE_UNITS.has(unitLower)) return null;

    // Check if this is a known volume unit
    const ml = VOLUME_TO_ML[unitLower];
    if (ml === undefined) return null; // Unknown unit — not a miss

    // Look up ingredient density
    const density = findDensity(ingredientName);
    if (density === null) {
        // Known volume, but no density — this IS a miss worth logging
        logDensityMiss(ingredientName);
        return null;
    }

    const qtyDecimal = parseQty(qty);
    if (qtyDecimal === null || qtyDecimal === 0) return null;

    // Detect if original was a range (for display purposes)
    const isRange = typeof qty === 'string' && qty.toString().includes('-');
    const parts = isRange ? qty.toString().split('-') : [qty];

    if (isRange) {
        const lo = parseQty(parts[0]);
        const hi = parseQty(parts[1]);
        if (lo === null || hi === null) return null;
        return {
            grams: Math.round(lo * ml * density),
            gramsHigh: Math.round(hi * ml * density),
            isRange: true,
        };
    }

    return {
        grams: Math.round(qtyDecimal * ml * density),
        isRange: false,
    };
};
