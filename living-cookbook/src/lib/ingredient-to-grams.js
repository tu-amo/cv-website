"use strict";

/**
 * ingredient-to-grams.js
 *
 * Unified helper that converts any ingredient quantity to grams.
 * Used by NutritionPanel to feed gram weights into the USDA calorie calculation.
 *
 * Wraps unit-converter.js (volumetric → grams via density table) and adds:
 *  - Weight unit pass-through (g, kg, oz, lb already in grams/convertible)
 *  - Countable unit average weights (cloves, eggs, cans, etc.)
 */

import { convertToGrams } from './unit-converter.js';

// ── Countable ingredient average gram weights ────────────────────────────────
// Keyed by ingredient name fragment (lowercase). Longer keys match first.
// Used when unit is a "piece" type (clove, egg, can, etc.)
const COUNTABLE_WEIGHTS_G = {
    // Aromatics
    'garlic':        5,    // one clove ~5g
    'ginger':        5,    // one "piece" ~5g

    // Eggs & Dairy
    'egg':           60,   // large egg ~60g

    // Vegetables
    'onion':         150,  // medium onion ~150g
    'shallot':       40,
    'leek':          100,
    'carrot':        80,
    'potato':        170,  // medium potato
    'sweet potato':  130,
    'courgette':     200,
    'zucchini':      200,
    'pepper':        160,  // bell pepper
    'capsicum':      160,
    'tomato':        123,  // medium tomato
    'celery':        40,   // one stalk
    'aubergine':     300,
    'eggplant':      300,
    'avocado':       150,  // flesh only
    'cucumber':      300,
    'beetroot':      100,
    'beet':          100,
    'fennel':        250,  // one bulb
    'artichoke':     120,
    'corn':          90,   // one cob kernels

    // Fruits
    'apple':         182,
    'banana':        120,  // without peel
    'lemon':         84,
    'lime':          67,
    'orange':        131,
    'grapefruit':    230,
    'peach':         150,
    'plum':          66,
    'fig':           50,
    'date':          24,

    // Proteins
    'chicken breast':    174,
    'chicken thigh':     100,
    'chicken':           174,
    'salmon':            200,  // one fillet
    'tuna':              150,

    // Bread & Baked
    'bread slice':   32,
    'slice':         30,   // generic bread/cheese slice

    // Canned goods
    'can':           400,  // generic drained net weight
    'tin':           400,

    // Misc
    'sheet':         4,    // filo/puff pastry sheet
    'sachet':        7,    // spice sachet
    'bunch':         30,   // fresh herb bunch (parsley, coriander)
};

const COUNTABLE_KEYS = Object.keys(COUNTABLE_WEIGHTS_G).sort((a, b) => b.length - a.length);

// Weight conversions to grams
const TO_GRAMS = {
    g: 1,
    gram: 1, grams: 1,
    kg: 1000, kilogram: 1000, kilograms: 1000,
    oz: 28.35,
    lb: 453.59, lbs: 453.59, pound: 453.59, pounds: 453.59,
};

const COUNTABLE_UNIT_TRIGGERS = new Set([
    'piece', 'pieces', 'pc', 'pcs',
    'clove', 'cloves',
    'slice', 'slices',
    'can', 'cans', 'tin', 'tins',
    'bunch', 'bunches',
    'stalk', 'stalks',
    'head', 'heads',
    'sheet', 'sheets',
    'sachet', 'sachets',
    'egg', 'eggs',
    '', // no unit — treat as a whole item
]);

function parseQtyToDecimal(qty) {
    if (!qty && qty !== 0) return null;
    const s = qty.toString().trim();
    // Range — take midpoint
    if (s.includes('-')) {
        const parts = s.split('-');
        const lo = parseQtyToDecimal(parts[0].trim());
        const hi = parseQtyToDecimal(parts[1].trim());
        if (lo !== null && hi !== null) return (lo + hi) / 2;
        return lo;
    }
    // Compound fraction "1 1/2"
    const comp = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (comp) return parseInt(comp[1]) + parseInt(comp[2]) / parseInt(comp[3]);
    // Simple fraction "1/2"
    const frac = s.match(/^(\d+)\/(\d+)$/);
    if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
}

function findCountableWeight(ingredientName) {
    const lower = (ingredientName || '').toLowerCase();
    for (const key of COUNTABLE_KEYS) {
        if (lower.includes(key)) return COUNTABLE_WEIGHTS_G[key];
    }
    return null;
}

/**
 * Convert an ingredient's quantity + unit + name to grams.
 *
 * @param {string|number} qty      - e.g. "1", "1/2", "1 1/2", "1-2"
 * @param {string}        unit     - e.g. "cup", "tbsp", "g", "clove", ""
 * @param {string}        name     - e.g. "plain flour", "garlic clove"
 *
 * @returns {{ grams: number, method: string } | null}
 *   null = cannot estimate (ingredient should be skipped or shown as "?")
 */
export function toGrams(qty, unit, name) {
    const unitLower = (unit || '').toLowerCase().trim();
    const qtyDecimal = parseQtyToDecimal(qty);
    if (!qtyDecimal || qtyDecimal <= 0) return null;

    // ── 1. Weight units — direct conversion ──────────────────────────────────
    if (TO_GRAMS[unitLower] !== undefined) {
        return {
            grams: Math.round(qtyDecimal * TO_GRAMS[unitLower]),
            method: 'weight',
        };
    }

    // ── 2. Volumetric units — use existing density-based converter ────────────
    const volumeResult = convertToGrams(qty, unit, name);
    if (volumeResult) {
        return {
            grams: volumeResult.grams,
            method: 'volume',
        };
    }

    // ── 3. Countable units — use average ingredient weight ───────────────────
    if (COUNTABLE_UNIT_TRIGGERS.has(unitLower)) {
        // Try to match ingredient name to our average weight table
        const avgWeight = findCountableWeight(name);
        if (avgWeight) {
            return {
                grams: Math.round(qtyDecimal * avgWeight),
                method: 'countable',
            };
        }
    }

    // ── 4. No unit (bare number) — try countable average ─────────────────────
    if (!unit) {
        const avgWeight = findCountableWeight(name);
        if (avgWeight) {
            return {
                grams: Math.round(qtyDecimal * avgWeight),
                method: 'countable',
            };
        }
    }

    // Cannot convert — caller should skip this ingredient
    return null;
}
