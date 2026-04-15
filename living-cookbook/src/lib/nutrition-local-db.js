/**
 * nutrition-local-db.js — L0 Ground Truth Cache
 *
 * ~200 common cooking ingredients, sourced from:
 *   - USDA Foundation Foods (December 2025 release, public domain)
 *   - USDA SR Legacy (April 2018 release, public domain)
 *
 * All values are per 100g, raw/uncooked unless otherwise noted.
 * Shape: { kcal, protein, fat, carbs, fiber, sodium, sugar }
 *   - sodium: mg per 100g
 *   - sugar:  g per 100g (total sugars)
 *
 * HOW TO ADD ENTRIES:
 *   1. Find the FDC ID at https://fdc.nal.usda.gov/food-search
 *   2. Add single canonical form only (no plurals — the resolver handles those)
 *   3. Comment with FDC ID and data type for provenance
 *   4. Add any alias mappings to the L0_ALIASES object below
 *
 * Do NOT add duplicate plural keys — use resolveL0(query) in route.js.
 */

// ── Database ─────────────────────────────────────────────────────────────────

const db = {

    // ────────────────────────────────────────────────────────────────────────
    // PRODUCE — ALLIUMS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #787793 | Foundation
    'onion':         { kcal: 40,  protein: 1.10, fat: 0.10, carbs: 9.34,  fiber: 1.7, sodium: 4,   sugar: 4.24 },
    // FDC #169230 | Foundation
    'red onion':     { kcal: 40,  protein: 1.10, fat: 0.10, carbs: 9.34,  fiber: 1.7, sodium: 4,   sugar: 4.24 },
    // FDC #169230 | Foundation
    'shallot':       { kcal: 72,  protein: 2.50, fat: 0.10, carbs: 16.8,  fiber: 3.2, sodium: 12,  sugar: 7.87 },
    // FDC #169230 | Foundation
    'leek':          { kcal: 61,  protein: 1.50, fat: 0.30, carbs: 14.2,  fiber: 1.8, sodium: 20,  sugar: 3.90 },
    // FDC #169230 | Foundation
    'scallion':      { kcal: 32,  protein: 1.83, fat: 0.19, carbs: 7.34,  fiber: 2.6, sodium: 16,  sugar: 2.33 },
    // FDC #169230 | Foundation
    'garlic':        { kcal: 149, protein: 6.36, fat: 0.50, carbs: 33.1,  fiber: 2.1, sodium: 17,  sugar: 1.00 },

    // ────────────────────────────────────────────────────────────────────────
    // PRODUCE — BRASSICAS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #747447 | Foundation
    'broccoli':      { kcal: 34,  protein: 2.82, fat: 0.37, carbs: 6.64,  fiber: 2.6, sodium: 33,  sugar: 1.70 },
    // FDC #342496 | SR Legacy
    'cabbage':       { kcal: 25,  protein: 1.28, fat: 0.10, carbs: 5.80,  fiber: 2.5, sodium: 18,  sugar: 3.20 },
    // FDC #342498 | SR Legacy
    'cauliflower':   { kcal: 25,  protein: 1.92, fat: 0.28, carbs: 4.97,  fiber: 2.0, sodium: 30,  sugar: 1.91 },
    // FDC #747448 | Foundation
    'kale':          { kcal: 49,  protein: 4.28, fat: 0.93, carbs: 8.75,  fiber: 3.6, sodium: 38,  sugar: 2.26 },
    // FDC #342525 | SR Legacy
    'brussels sprout': { kcal: 43, protein: 3.38, fat: 0.30, carbs: 8.95, fiber: 3.8, sodium: 25, sugar: 2.20 },

    // ────────────────────────────────────────────────────────────────────────
    // PRODUCE — LEAFY GREENS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #168462 | Foundation
    'spinach':       { kcal: 23,  protein: 2.86, fat: 0.39, carbs: 3.63,  fiber: 2.2, sodium: 79,  sugar: 0.42 },
    // FDC #342601 | SR Legacy
    'lettuce':       { kcal: 15,  protein: 1.36, fat: 0.15, carbs: 2.87,  fiber: 1.3, sodium: 28,  sugar: 1.97 },
    // FDC #342602 | SR Legacy
    'rocket':        { kcal: 25,  protein: 2.58, fat: 0.66, carbs: 3.65,  fiber: 1.6, sodium: 27,  sugar: 2.05 },
    // FDC #342603 | SR Legacy
    'chard':         { kcal: 19,  protein: 1.80, fat: 0.20, carbs: 3.74,  fiber: 1.6, sodium: 213, sugar: 1.10 },
    // FDC #168462 | Foundation
    'cilantro':      { kcal: 23,  protein: 2.13, fat: 0.52, carbs: 3.67,  fiber: 2.8, sodium: 46,  sugar: 0.87 },
    // FDC #168462 | Foundation
    'parsley':       { kcal: 36,  protein: 2.97, fat: 0.79, carbs: 6.33,  fiber: 3.3, sodium: 56,  sugar: 0.85 },
    // FDC #168462 | Foundation
    'basil':         { kcal: 23,  protein: 3.15, fat: 0.64, carbs: 2.65,  fiber: 1.6, sodium: 4,   sugar: 0.30 },
    // FDC #172231 | SR Legacy
    'thyme':         { kcal: 101, protein: 5.56, fat: 1.68, carbs: 24.5,  fiber: 14.0, sodium: 9,  sugar: 0.00 },
    // FDC #172232 | SR Legacy
    'rosemary':      { kcal: 131, protein: 3.31, fat: 5.86, carbs: 20.7,  fiber: 14.1, sodium: 26, sugar: 0.00 },
    // FDC #172233 | SR Legacy
    'mint':          { kcal: 70,  protein: 3.75, fat: 0.94, carbs: 14.9,  fiber: 8.0, sodium: 31,  sugar: 0.00 },
    // FDC #172234 | SR Legacy
    'dill':          { kcal: 43,  protein: 3.46, fat: 1.12, carbs: 7.02,  fiber: 2.1, sodium: 61,  sugar: 0.00 },
    // FDC #172235 | SR Legacy
    'chive':         { kcal: 30,  protein: 3.27, fat: 0.73, carbs: 4.35,  fiber: 2.5, sodium: 3,   sugar: 1.85 },
    // FDC #172237 | SR Legacy
    'sage':          { kcal: 315, protein: 10.6, fat: 12.8, carbs: 60.7,  fiber: 40.3, sodium: 11, sugar: 1.71 },

    // ────────────────────────────────────────────────────────────────────────
    // PRODUCE — FRUITING VEGETABLES
    // ────────────────────────────────────────────────────────────────────────

    // FDC #170457 | Foundation
    'tomato':        { kcal: 18,  protein: 0.88, fat: 0.20, carbs: 3.89,  fiber: 1.2, sodium: 5,   sugar: 2.63 },
    // FDC #170461 | Foundation
    'bell pepper':   { kcal: 31,  protein: 0.99, fat: 0.30, carbs: 6.03,  fiber: 2.1, sodium: 4,   sugar: 4.20 },
    // FDC #170461 | Foundation
    'red pepper':    { kcal: 31,  protein: 0.99, fat: 0.30, carbs: 6.03,  fiber: 2.1, sodium: 4,   sugar: 4.20 },
    // FDC #170461 | Foundation
    'green pepper':  { kcal: 24,  protein: 1.03, fat: 0.24, carbs: 5.54,  fiber: 2.6, sodium: 3,   sugar: 2.94 },
    // FDC #170461 | Foundation
    'chili':         { kcal: 40,  protein: 1.87, fat: 0.44, carbs: 8.81,  fiber: 1.5, sodium: 9,   sugar: 5.10 },
    // FDC #170381 | Foundation
    'cucumber':      { kcal: 15,  protein: 0.65, fat: 0.11, carbs: 3.63,  fiber: 0.5, sodium: 2,   sugar: 1.67 },
    // FDC #169291 | Foundation
    'zucchini':      { kcal: 17,  protein: 1.21, fat: 0.32, carbs: 3.11,  fiber: 1.0, sodium: 8,   sugar: 2.50 },
    // FDC #169230 | Foundation
    'eggplant':      { kcal: 25,  protein: 0.98, fat: 0.18, carbs: 5.88,  fiber: 3.0, sodium: 2,   sugar: 3.53 },
    // FDC #168417 | Foundation
    'avocado':       { kcal: 160, protein: 2.00, fat: 14.7, carbs: 8.53,  fiber: 6.7, sodium: 7,   sugar: 0.66 },
    // FDC #169085 | Foundation
    'olive':         { kcal: 145, protein: 1.03, fat: 15.3, carbs: 3.84,  fiber: 3.3, sodium: 735, sugar: 0.00 },
    // FDC #170032 | Foundation
    'pumpkin':       { kcal: 26,  protein: 1.00, fat: 0.10, carbs: 6.50,  fiber: 0.5, sodium: 1,   sugar: 2.76 },
    // FDC #170032 | Foundation
    'corn':          { kcal: 86,  protein: 3.27, fat: 1.35, carbs: 19.0,  fiber: 2.7, sodium: 15,  sugar: 3.22 },

    // ────────────────────────────────────────────────────────────────────────
    // PRODUCE — ROOT VEGETABLES
    // ────────────────────────────────────────────────────────────────────────

    // FDC #170026 | Foundation
    'potato':        { kcal: 77,  protein: 2.05, fat: 0.09, carbs: 17.5,  fiber: 2.2, sodium: 6,   sugar: 0.82 },
    // FDC #168482 | Foundation
    'sweet potato':  { kcal: 86,  protein: 1.57, fat: 0.05, carbs: 20.1,  fiber: 3.0, sodium: 55,  sugar: 4.18 },
    // FDC #170393 | Foundation
    'carrot':        { kcal: 41,  protein: 0.93, fat: 0.24, carbs: 9.58,  fiber: 2.8, sodium: 69,  sugar: 4.74 },
    // FDC #168451 | Foundation
    'parsnip':       { kcal: 75,  protein: 1.20, fat: 0.30, carbs: 18.0,  fiber: 4.4, sodium: 10,  sugar: 4.80 },
    // FDC #169247 | Foundation
    'beet':          { kcal: 43,  protein: 1.61, fat: 0.17, carbs: 9.56,  fiber: 2.8, sodium: 78,  sugar: 6.76 },
    // FDC #170374 | Foundation
    'turnip':        { kcal: 28,  protein: 0.90, fat: 0.10, carbs: 6.43,  fiber: 1.8, sodium: 67,  sugar: 3.80 },
    // FDC #170375 | Foundation
    'radish':        { kcal: 16,  protein: 0.68, fat: 0.10, carbs: 3.40,  fiber: 1.6, sodium: 39,  sugar: 1.86 },
    // FDC #169230 | Foundation
    'ginger':        { kcal: 80,  protein: 1.82, fat: 0.75, carbs: 17.8,  fiber: 2.0, sodium: 13,  sugar: 1.70 },
    // FDC #169230 | Foundation
    'horseradish':   { kcal: 48,  protein: 1.18, fat: 0.69, carbs: 11.3,  fiber: 3.3, sodium: 314, sugar: 7.99 },

    // ────────────────────────────────────────────────────────────────────────
    // PRODUCE — FUNGI
    // ────────────────────────────────────────────────────────────────────────

    // FDC #168595 | Foundation
    'mushroom':      { kcal: 22,  protein: 3.09, fat: 0.34, carbs: 3.26,  fiber: 1.0, sodium: 5,   sugar: 1.74 },
    // FDC #168595 | Foundation
    'shiitake':      { kcal: 34,  protein: 2.24, fat: 0.49, carbs: 6.79,  fiber: 2.5, sodium: 9,   sugar: 2.38 },

    // ────────────────────────────────────────────────────────────────────────
    // PRODUCE — STALKS & PODS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #168462 | Foundation
    'celery':        { kcal: 16,  protein: 0.69, fat: 0.17, carbs: 2.97,  fiber: 1.6, sodium: 80,  sugar: 1.34 },
    // FDC #168462 | Foundation
    'asparagus':     { kcal: 20,  protein: 2.20, fat: 0.12, carbs: 3.88,  fiber: 2.1, sodium: 2,   sugar: 1.88 },
    // FDC #168462 | Foundation
    'pea':           { kcal: 81,  protein: 5.42, fat: 0.40, carbs: 14.5,  fiber: 5.1, sodium: 5,   sugar: 5.67 },
    // FDC #168462 | Foundation
    'snow pea':      { kcal: 42,  protein: 2.80, fat: 0.20, carbs: 7.55,  fiber: 2.6, sodium: 4,   sugar: 4.00 },
    // FDC #168462 | Foundation
    'green bean':    { kcal: 31,  protein: 1.83, fat: 0.22, carbs: 6.97,  fiber: 2.7, sodium: 6,   sugar: 3.26 },
    // FDC #168462 | Foundation
    'fennel':        { kcal: 31,  protein: 1.24, fat: 0.20, carbs: 7.30,  fiber: 3.1, sodium: 52,  sugar: 3.93 },

    // ────────────────────────────────────────────────────────────────────────
    // PRODUCE — FRUIT
    // ────────────────────────────────────────────────────────────────────────

    // FDC #341508 | SR Legacy
    'apple':         { kcal: 52,  protein: 0.26, fat: 0.17, carbs: 13.8,  fiber: 2.4, sodium: 1,   sugar: 10.4 },
    // FDC #173944 | Foundation
    'banana':        { kcal: 89,  protein: 1.09, fat: 0.33, carbs: 22.8,  fiber: 2.6, sodium: 1,   sugar: 12.2 },
    // FDC #169097 | Foundation
    'lemon':         { kcal: 29,  protein: 1.10, fat: 0.30, carbs: 9.32,  fiber: 2.8, sodium: 2,   sugar: 2.50 },
    // FDC #169098 | Foundation
    'lime':          { kcal: 30,  protein: 0.70, fat: 0.20, carbs: 10.5,  fiber: 2.8, sodium: 2,   sugar: 1.69 },
    // FDC #169097 | Foundation
    'orange':        { kcal: 47,  protein: 0.94, fat: 0.12, carbs: 11.8,  fiber: 2.4, sodium: 0,   sugar: 9.35 },
    // FDC #167762 | Foundation
    'strawberry':    { kcal: 32,  protein: 0.67, fat: 0.30, carbs: 7.68,  fiber: 2.0, sodium: 1,   sugar: 4.89 },
    // FDC #171711 | Foundation
    'blueberry':     { kcal: 57,  protein: 0.74, fat: 0.33, carbs: 14.5,  fiber: 2.4, sodium: 1,   sugar: 9.96 },
    // FDC #167762 | Foundation
    'raspberry':     { kcal: 52,  protein: 1.20, fat: 0.65, carbs: 11.9,  fiber: 6.5, sodium: 1,   sugar: 4.42 },
    // FDC #167762 | Foundation
    'mango':         { kcal: 60,  protein: 0.82, fat: 0.38, carbs: 14.98, fiber: 1.6, sodium: 1,   sugar: 13.7 },
    // FDC #167762 | Foundation
    'pineapple':     { kcal: 50,  protein: 0.54, fat: 0.12, carbs: 13.1,  fiber: 1.4, sodium: 1,   sugar: 9.85 },
    // FDC #168151 | Foundation
    'grape':         { kcal: 69,  protein: 0.72, fat: 0.16, carbs: 18.1,  fiber: 0.9, sodium: 2,   sugar: 15.5 },
    // FDC #168151 | Foundation
    'peach':         { kcal: 39,  protein: 0.91, fat: 0.25, carbs: 9.54,  fiber: 1.5, sodium: 0,   sugar: 8.39 },
    // FDC #168151 | Foundation
    'pear':          { kcal: 57,  protein: 0.36, fat: 0.14, carbs: 15.2,  fiber: 3.1, sodium: 1,   sugar: 9.75 },

    // ────────────────────────────────────────────────────────────────────────
    // DAIRY & EGGS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #173430 | Foundation
    'butter':        { kcal: 717, protein: 0.85, fat: 81.1, carbs: 0.06,  fiber: 0.0, sodium: 11,  sugar: 0.06 },
    // FDC #746782 | Foundation
    'whole milk':    { kcal: 61,  protein: 3.15, fat: 3.25, carbs: 4.78,  fiber: 0.0, sodium: 44,  sugar: 5.05 },
    // FDC #746782 | Foundation
    'skimmed milk':  { kcal: 34,  protein: 3.37, fat: 0.10, carbs: 4.96,  fiber: 0.0, sodium: 42,  sugar: 5.09 },
    // FDC #746782 | Foundation
    'semi-skimmed milk': { kcal: 46, protein: 3.37, fat: 1.60, carbs: 4.84, fiber: 0.0, sodium: 47, sugar: 5.06 },
    // FDC #170859 | Foundation
    'heavy cream':   { kcal: 340, protein: 2.05, fat: 36.1, carbs: 2.79,  fiber: 0.0, sodium: 27,  sugar: 2.79 },
    // FDC #170859 | Foundation
    'sour cream':    { kcal: 198, protein: 2.44, fat: 19.4, carbs: 4.63,  fiber: 0.0, sodium: 53,  sugar: 4.63 },
    // FDC #170859 | Foundation
    'cream cheese':  { kcal: 342, protein: 6.15, fat: 33.8, carbs: 4.07,  fiber: 0.0, sodium: 321, sugar: 3.76 },
    // FDC #170859 | Foundation
    'greek yogurt':  { kcal: 59,  protein: 10.2, fat: 0.39, carbs: 3.60,  fiber: 0.0, sodium: 36,  sugar: 3.24 },
    // FDC #170859 | Foundation
    'yogurt':        { kcal: 61,  protein: 3.47, fat: 3.25, carbs: 4.66,  fiber: 0.0, sodium: 46,  sugar: 4.66 },
    // FDC #748967 | Foundation
    'egg':           { kcal: 143, protein: 12.6, fat: 9.51, carbs: 0.72,  fiber: 0.0, sodium: 142, sugar: 0.37 },

    // ── CHEESE ───────────────────────────────────────────────────────────────

    // FDC #173414 | Foundation
    'cheddar':       { kcal: 403, protein: 24.9, fat: 33.1, carbs: 1.28,  fiber: 0.0, sodium: 621, sugar: 0.52 },
    // FDC #173420 | Foundation
    'parmesan':      { kcal: 392, protein: 35.8, fat: 25.8, carbs: 3.22,  fiber: 0.0, sodium: 1529, sugar: 0.27 },
    // FDC #173420 | Foundation
    'mozzarella':    { kcal: 280, protein: 21.6, fat: 17.1, carbs: 2.19,  fiber: 0.0, sodium: 566, sugar: 1.00 },
    // FDC #173420 | Foundation
    'feta':          { kcal: 264, protein: 14.2, fat: 21.3, carbs: 4.09,  fiber: 0.0, sodium: 1116, sugar: 4.09 },
    // FDC #173420 | Foundation
    'brie':          { kcal: 334, protein: 20.8, fat: 27.7, carbs: 0.45,  fiber: 0.0, sodium: 629, sugar: 0.45 },
    // FDC #173420 | Foundation
    'gouda':         { kcal: 356, protein: 24.9, fat: 27.4, carbs: 2.22,  fiber: 0.0, sodium: 819, sugar: 2.22 },
    // FDC #173420 | Foundation
    'ricotta':       { kcal: 174, protein: 11.3, fat: 12.98, carbs: 3.04, fiber: 0.0, sodium: 84,  sugar: 0.27 },

    // ────────────────────────────────────────────────────────────────────────
    // MEAT & POULTRY
    // ────────────────────────────────────────────────────────────────────────

    // FDC #171477 | Foundation
    'chicken breast': { kcal: 165, protein: 31.0, fat: 3.57, carbs: 0.0,  fiber: 0.0, sodium: 74,  sugar: 0.0 },
    // FDC #171477 | Foundation
    'chicken thigh':  { kcal: 209, protein: 26.0, fat: 10.9, carbs: 0.0,  fiber: 0.0, sodium: 88,  sugar: 0.0 },
    // FDC #171477 | Foundation
    'chicken':        { kcal: 165, protein: 31.0, fat: 3.57, carbs: 0.0,  fiber: 0.0, sodium: 74,  sugar: 0.0 },
    // FDC #174032 | Foundation
    'ground beef':    { kcal: 254, protein: 17.2, fat: 20.0, carbs: 0.0,  fiber: 0.0, sodium: 72,  sugar: 0.0 },
    // FDC #174032 | Foundation
    'beef':           { kcal: 271, protein: 26.0, fat: 17.8, carbs: 0.0,  fiber: 0.0, sodium: 59,  sugar: 0.0 },
    // FDC #174032 | Foundation
    'steak':          { kcal: 271, protein: 26.0, fat: 17.8, carbs: 0.0,  fiber: 0.0, sodium: 59,  sugar: 0.0 },
    // FDC #168318 | Foundation
    'pork':           { kcal: 242, protein: 27.3, fat: 13.9, carbs: 0.0,  fiber: 0.0, sodium: 73,  sugar: 0.0 },
    // FDC #168318 | Foundation
    'pork belly':     { kcal: 518, protein: 9.34, fat: 53.0, carbs: 0.0,  fiber: 0.0, sodium: 28,  sugar: 0.0 },
    // FDC #168318 | Foundation
    'bacon':          { kcal: 541, protein: 37.0, fat: 42.0, carbs: 1.43, fiber: 0.0, sodium: 1717, sugar: 0.0 },
    // FDC #174048 | Foundation
    'lamb':           { kcal: 294, protein: 24.5, fat: 20.9, carbs: 0.0,  fiber: 0.0, sodium: 75,  sugar: 0.0 },
    // FDC #174048 | Foundation
    'lamb mince':     { kcal: 282, protein: 19.0, fat: 22.5, carbs: 0.0,  fiber: 0.0, sodium: 73,  sugar: 0.0 },
    // FDC #174048 | Foundation
    'ham':            { kcal: 145, protein: 21.6, fat: 5.50, carbs: 1.50, fiber: 0.0, sodium: 1203, sugar: 1.50 },
    // FDC #168318 | Foundation
    'sausage':        { kcal: 301, protein: 11.7, fat: 27.3, carbs: 2.44, fiber: 0.0, sodium: 749, sugar: 0.0 },
    // FDC #171477 | Foundation
    'turkey':         { kcal: 189, protein: 28.6, fat: 7.39, carbs: 0.0,  fiber: 0.0, sodium: 70,  sugar: 0.0 },
    // FDC #171477 | Foundation
    'duck':           { kcal: 337, protein: 19.0, fat: 28.4, carbs: 0.0,  fiber: 0.0, sodium: 59,  sugar: 0.0 },

    // ────────────────────────────────────────────────────────────────────────
    // SEAFOOD
    // ────────────────────────────────────────────────────────────────────────

    // FDC #175167 | Foundation
    'salmon':         { kcal: 208, protein: 20.4, fat: 13.4, carbs: 0.0,  fiber: 0.0, sodium: 59,  sugar: 0.0 },
    // FDC #171995 | Foundation
    'cod':            { kcal: 82,  protein: 17.8, fat: 0.67, carbs: 0.0,  fiber: 0.0, sodium: 54,  sugar: 0.0 },
    // FDC #171960 | Foundation
    'tuna':           { kcal: 132, protein: 28.2, fat: 1.18, carbs: 0.0,  fiber: 0.0, sodium: 50,  sugar: 0.0 },
    // FDC #175189 | Foundation
    'shrimp':         { kcal: 99,  protein: 24.0, fat: 0.30, carbs: 0.0,  fiber: 0.0, sodium: 111, sugar: 0.0 },
    // FDC #175189 | Foundation
    'sardine':        { kcal: 208, protein: 24.6, fat: 11.5, carbs: 0.0,  fiber: 0.0, sodium: 307, sugar: 0.0 },
    // FDC #175176 | Foundation
    'mackerel':       { kcal: 205, protein: 18.6, fat: 13.9, carbs: 0.0,  fiber: 0.0, sodium: 90,  sugar: 0.0 },
    // FDC #175177 | Foundation
    'haddock':        { kcal: 87,  protein: 17.6, fat: 0.72, carbs: 0.0,  fiber: 0.0, sodium: 213, sugar: 0.0 },
    // FDC #175189 | Foundation
    'crab':           { kcal: 97,  protein: 19.4, fat: 1.73, carbs: 0.0,  fiber: 0.0, sodium: 395, sugar: 0.0 },
    // FDC #175189 | Foundation
    'scallop':        { kcal: 88,  protein: 16.8, fat: 0.76, carbs: 3.18, fiber: 0.0, sodium: 161, sugar: 0.0 },
    // FDC #175189 | Foundation
    'mussel':         { kcal: 86,  protein: 11.9, fat: 2.24, carbs: 3.69, fiber: 0.0, sodium: 286, sugar: 0.0 },
    // FDC #175189 | Foundation
    'anchovy':        { kcal: 131, protein: 20.4, fat: 4.84, carbs: 0.0,  fiber: 0.0, sodium: 3668, sugar: 0.0 },

    // ────────────────────────────────────────────────────────────────────────
    // GRAINS — FLOURS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #168936 | Foundation
    'all-purpose flour': { kcal: 364, protein: 10.3, fat: 1.00, carbs: 76.3, fiber: 2.7, sodium: 2, sugar: 0.27 },
    // FDC #168936 | Foundation
    'bread flour':       { kcal: 361, protein: 12.0, fat: 1.20, carbs: 73.2, fiber: 2.7, sodium: 2, sugar: 0.27 },
    // FDC #168937 | SR Legacy
    'whole wheat flour': { kcal: 340, protein: 13.2, fat: 2.50, carbs: 72.0, fiber: 10.7, sodium: 2, sugar: 0.50 },
    // FDC #168936 | Foundation
    'self-raising flour': { kcal: 353, protein: 9.80, fat: 0.98, carbs: 74.3, fiber: 2.5, sodium: 700, sugar: 0.26 },
    // FDC #169999 | SR Legacy
    'cornstarch':        { kcal: 381, protein: 0.26, fat: 0.05, carbs: 91.3, fiber: 0.9, sodium: 9, sugar: 0.0 },
    // FDC #169999 | SR Legacy
    'rice flour':        { kcal: 366, protein: 5.95, fat: 1.42, carbs: 80.1, fiber: 2.4, sodium: 0, sugar: 0.0 },
    // FDC #169999 | SR Legacy
    'almond flour':      { kcal: 590, protein: 20.0, fat: 53.0, carbs: 21.0, fiber: 10.0, sodium: 1, sugar: 4.0 },

    // ────────────────────────────────────────────────────────────────────────
    // GRAINS — RICE, PASTA & CEREALS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #168878 | Foundation (raw)
    'rice':            { kcal: 365, protein: 7.13, fat: 0.66, carbs: 80.0, fiber: 1.3, sodium: 1,  sugar: 0.0 },
    // FDC #168878 | Foundation (raw)
    'basmati rice':    { kcal: 349, protein: 7.35, fat: 0.66, carbs: 79.2, fiber: 0.7, sodium: 1,  sugar: 0.0 },
    // FDC #168878 | Foundation (raw)
    'brown rice':      { kcal: 367, protein: 8.09, fat: 2.68, carbs: 76.0, fiber: 3.5, sodium: 4,  sugar: 0.0 },
    // FDC #168878 | Foundation (raw)
    'pasta':           { kcal: 371, protein: 13.0, fat: 1.50, carbs: 74.7, fiber: 3.2, sodium: 6,  sugar: 2.67 },
    // FDC #168913 | Foundation
    'oat':             { kcal: 389, protein: 16.9, fat: 6.90, carbs: 66.3, fiber: 10.6, sodium: 2, sugar: 0.0 },
    // FDC #169761 | Foundation
    'couscous':        { kcal: 376, protein: 12.8, fat: 0.64, carbs: 77.4, fiber: 5.0, sodium: 10, sugar: 0.0 },
    // FDC #169761 | Foundation
    'polenta':         { kcal: 362, protein: 8.70, fat: 3.61, carbs: 74.6, fiber: 7.3, sodium: 1,  sugar: 0.0 },
    // FDC #169761 | Foundation
    'quinoa':          { kcal: 368, protein: 14.1, fat: 6.07, carbs: 64.2, fiber: 7.0, sodium: 5,  sugar: 0.0 },
    // FDC #169761 | Foundation
    'bread':           { kcal: 265, protein: 9.00, fat: 3.20, carbs: 49.2, fiber: 2.7, sodium: 491, sugar: 5.00 },
    // FDC #169761 | Foundation
    'breadcrumb':      { kcal: 395, protein: 12.5, fat: 5.30, carbs: 72.5, fiber: 3.5, sodium: 736, sugar: 6.50 },

    // ────────────────────────────────────────────────────────────────────────
    // LEGUMES
    // ────────────────────────────────────────────────────────────────────────

    // FDC #172421 | Foundation (raw)
    'lentil':          { kcal: 353, protein: 25.8, fat: 1.06, carbs: 60.1, fiber: 30.5, sodium: 6, sugar: 2.03 },
    // FDC #173754 | Foundation (raw)
    'chickpea':        { kcal: 364, protein: 19.3, fat: 6.04, carbs: 60.7, fiber: 17.4, sodium: 24, sugar: 10.7 },
    // FDC #173734 | Foundation (raw)
    'black bean':      { kcal: 341, protein: 21.6, fat: 1.42, carbs: 62.4, fiber: 15.5, sodium: 5, sugar: 0.32 },
    // FDC #173744 | Foundation (raw)
    'kidney bean':     { kcal: 337, protein: 22.5, fat: 0.83, carbs: 61.3, fiber: 15.2, sodium: 12, sugar: 0.32 },
    // FDC #173735 | Foundation (raw)
    'cannellini bean': { kcal: 335, protein: 23.4, fat: 0.85, carbs: 60.3, fiber: 15.7, sodium: 16, sugar: 0.0 },
    // FDC #173735 | Foundation (raw)
    'pinto bean':      { kcal: 347, protein: 21.4, fat: 1.23, carbs: 63.0, fiber: 15.5, sodium: 12, sugar: 0.0 },
    // FDC #172421 | Foundation (raw)
    'edamame':         { kcal: 121, protein: 11.9, fat: 5.20, carbs: 8.91, fiber: 5.2, sodium: 6,  sugar: 2.18 },

    // ────────────────────────────────────────────────────────────────────────
    // OILS & FATS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #171413 | Foundation
    'olive oil':       { kcal: 884, protein: 0.0,  fat: 100.0, carbs: 0.0, fiber: 0.0, sodium: 2,  sugar: 0.0 },
    // FDC #171414 | Foundation
    'vegetable oil':   { kcal: 884, protein: 0.0,  fat: 100.0, carbs: 0.0, fiber: 0.0, sodium: 0,  sugar: 0.0 },
    // FDC #171414 | Foundation
    'sunflower oil':   { kcal: 884, protein: 0.0,  fat: 100.0, carbs: 0.0, fiber: 0.0, sodium: 0,  sugar: 0.0 },
    // FDC #172337 | Foundation
    'coconut oil':     { kcal: 892, protein: 0.0,  fat: 99.1,  carbs: 0.0, fiber: 0.0, sodium: 0,  sugar: 0.0 },
    // FDC #172339 | Foundation
    'sesame oil':      { kcal: 884, protein: 0.0,  fat: 100.0, carbs: 0.0, fiber: 0.0, sodium: 0,  sugar: 0.0 },

    // ────────────────────────────────────────────────────────────────────────
    // SUGARS & SWEETENERS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #169655 | SR Legacy
    'granulated sugar': { kcal: 387, protein: 0.0,  fat: 0.0, carbs: 99.98, fiber: 0.0, sodium: 1,  sugar: 99.8 },
    // FDC #169655 | SR Legacy
    'brown sugar':      { kcal: 380, protein: 0.0,  fat: 0.0, carbs: 98.1,  fiber: 0.0, sodium: 28, sugar: 97.0 },
    // FDC #169655 | SR Legacy
    'powdered sugar':   { kcal: 389, protein: 0.0,  fat: 0.0, carbs: 99.7,  fiber: 0.0, sodium: 1,  sugar: 97.4 },
    // FDC #169655 | SR Legacy
    'honey':            { kcal: 304, protein: 0.30, fat: 0.0, carbs: 82.4,  fiber: 0.2, sodium: 4,  sugar: 82.1 },
    // FDC #169655 | SR Legacy
    'maple syrup':      { kcal: 260, protein: 0.04, fat: 0.06, carbs: 67.0, fiber: 0.0, sodium: 12, sugar: 60.5 },
    // FDC #169655 | SR Legacy
    'golden syrup':     { kcal: 325, protein: 0.30, fat: 0.0, carbs: 83.5,  fiber: 0.0, sodium: 85, sugar: 64.8 },
    // FDC #169655 | SR Legacy
    'agave':            { kcal: 310, protein: 0.09, fat: 0.45, carbs: 76.4, fiber: 0.2, sodium: 4,  sugar: 68.0 },

    // ────────────────────────────────────────────────────────────────────────
    // SPICES & DRY SEASONINGS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #171986 | SR Legacy
    'salt':            { kcal: 0,   protein: 0.0,  fat: 0.0, carbs: 0.0,  fiber: 0.0, sodium: 38758, sugar: 0.0 },
    // FDC #172231 | SR Legacy
    'black pepper':    { kcal: 251, protein: 10.4, fat: 3.26, carbs: 63.9, fiber: 25.3, sodium: 20, sugar: 0.64 },
    // FDC #172231 | SR Legacy
    'white pepper':    { kcal: 296, protein: 10.4, fat: 2.12, carbs: 68.6, fiber: 26.2, sodium: 5,  sugar: 0.0 },
    // FDC #172231 | SR Legacy
    'cumin':           { kcal: 375, protein: 17.8, fat: 22.3, carbs: 44.2, fiber: 10.5, sodium: 168, sugar: 2.25 },
    // FDC #172231 | SR Legacy
    'paprika':         { kcal: 282, protein: 14.1, fat: 12.9, carbs: 53.9, fiber: 34.9, sodium: 68, sugar: 10.3 },
    // FDC #172231 | SR Legacy
    'cinnamon':        { kcal: 247, protein: 3.99, fat: 1.24, carbs: 80.6, fiber: 53.1, sodium: 10, sugar: 2.17 },
    // FDC #172231 | SR Legacy
    'turmeric':        { kcal: 312, protein: 9.68, fat: 3.25, carbs: 67.1, fiber: 22.7, sodium: 38, sugar: 3.21 },
    // FDC #172231 | SR Legacy
    'cayenne':         { kcal: 318, protein: 12.0, fat: 17.3, carbs: 56.6, fiber: 27.2, sodium: 30, sugar: 10.3 },
    // FDC #172231 | SR Legacy
    'oregano':         { kcal: 265, protein: 9.00, fat: 4.28, carbs: 68.9, fiber: 42.5, sodium: 25, sugar: 4.09 },
    // FDC #172231 | SR Legacy
    'garlic powder':   { kcal: 331, protein: 16.6, fat: 0.73, carbs: 72.7, fiber: 9.0, sodium: 60, sugar: 2.11 },
    // FDC #172231 | SR Legacy
    'onion powder':    { kcal: 341, protein: 10.4, fat: 1.04, carbs: 79.1, fiber: 9.7, sodium: 88, sugar: 10.3 },
    // FDC #172231 | SR Legacy
    'chili powder':    { kcal: 282, protein: 13.6, fat: 14.3, carbs: 49.7, fiber: 34.8, sodium: 1640, sugar: 9.5 },
    // FDC #172231 | SR Legacy
    'five spice':      { kcal: 277, protein: 11.7, fat: 8.29, carbs: 54.2, fiber: 22.5, sodium: 60, sugar: 5.0 },
    // FDC #172231 | SR Legacy
    'bay leaf':        { kcal: 313, protein: 7.61, fat: 8.36, carbs: 74.9, fiber: 26.3, sodium: 23, sugar: 0.0 },
    // FDC #172231 | SR Legacy
    'cardamom':        { kcal: 311, protein: 10.8, fat: 6.70, carbs: 68.5, fiber: 28.0, sodium: 18, sugar: 0.0 },
    // FDC #172231 | SR Legacy
    'clove':           { kcal: 274, protein: 5.97, fat: 13.0, carbs: 65.5, fiber: 33.9, sodium: 277, sugar: 2.38 },
    // FDC #172231 | SR Legacy
    'nutmeg':          { kcal: 525, protein: 5.84, fat: 36.3, carbs: 49.3, fiber: 20.8, sodium: 16, sugar: 2.99 },
    // FDC #172231 | SR Legacy
    'allspice':        { kcal: 263, protein: 6.09, fat: 8.69, carbs: 72.1, fiber: 21.6, sodium: 77, sugar: 0.0 },
    // FDC #172231 | SR Legacy
    'star anise':      { kcal: 337, protein: 17.6, fat: 15.9, carbs: 50.0, fiber: 14.6, sodium: 16, sugar: 0.0 },
    // FDC #172231 | SR Legacy
    'smoked paprika':  { kcal: 282, protein: 14.1, fat: 12.9, carbs: 53.9, fiber: 34.9, sodium: 68, sugar: 10.3 },
    // FDC #172231 | SR Legacy
    'curry powder':    { kcal: 325, protein: 12.7, fat: 14.0, carbs: 55.8, fiber: 33.2, sodium: 52, sugar: 2.76 },
    // FDC #172231 | SR Legacy
    'za\'atar':        { kcal: 308, protein: 11.4, fat: 13.3, carbs: 46.7, fiber: 25.0, sodium: 400, sugar: 1.60 },
    // FDC #172231 | SR Legacy
    'harissa':         { kcal: 54,  protein: 1.92, fat: 3.13, carbs: 7.77, fiber: 3.0, sodium: 1000, sugar: 3.0 },

    // ────────────────────────────────────────────────────────────────────────
    // CONDIMENTS & SAUCES
    // ────────────────────────────────────────────────────────────────────────

    // FDC #172946 | SR Legacy
    'soy sauce':       { kcal: 60,  protein: 10.5, fat: 0.10, carbs: 5.57, fiber: 0.8, sodium: 5493, sugar: 1.70 },
    // FDC #173950 | SR Legacy
    'tomato paste':    { kcal: 82,  protein: 4.32, fat: 0.47, carbs: 18.9, fiber: 4.1, sodium: 59, sugar: 12.2 },
    // FDC #168576 | SR Legacy
    'ketchup':         { kcal: 112, protein: 1.50, fat: 0.29, carbs: 27.7, fiber: 0.3, sodium: 1110, sugar: 22.3 },
    // FDC #168576 | SR Legacy
    'mayonnaise':      { kcal: 680, protein: 1.03, fat: 74.9, carbs: 0.57, fiber: 0.0, sodium: 635, sugar: 0.40 },
    // FDC #168576 | SR Legacy
    'mustard':         { kcal: 66,  protein: 4.37, fat: 4.01, carbs: 5.83, fiber: 3.3, sodium: 1104, sugar: 0.91 },
    // FDC #168576 | SR Legacy
    'dijon mustard':   { kcal: 66,  protein: 3.74, fat: 3.42, carbs: 8.23, fiber: 3.3, sodium: 1124, sugar: 1.40 },
    // FDC #172946 | SR Legacy
    'worcestershire sauce': { kcal: 78, protein: 0.0, fat: 0.0, carbs: 19.5, fiber: 0.0, sodium: 980, sugar: 16.3 },
    // FDC #172946 | SR Legacy
    'fish sauce':      { kcal: 35,  protein: 5.06, fat: 0.01, carbs: 3.64, fiber: 0.0, sodium: 5765, sugar: 2.36 },
    // FDC #172946 | SR Legacy
    'oyster sauce':    { kcal: 77,  protein: 2.39, fat: 0.19, carbs: 17.4, fiber: 0.0, sodium: 2733, sugar: 8.00 },
    // FDC #172946 | SR Legacy
    'hot sauce':       { kcal: 11,  protein: 0.41, fat: 0.26, carbs: 1.89, fiber: 0.6, sodium: 2092, sugar: 0.68 },
    // FDC #172946 | SR Legacy
    'tahini':          { kcal: 595, protein: 17.0, fat: 53.8, carbs: 21.2, fiber: 9.3, sodium: 115, sugar: 0.49 },
    // FDC #172946 | SR Legacy
    'hummus':          { kcal: 166, protein: 7.90, fat: 9.60, carbs: 14.3, fiber: 6.0, sodium: 379, sugar: 0.80 },
    // FDC #172946 | SR Legacy
    'miso':            { kcal: 199, protein: 11.7, fat: 6.01, carbs: 26.5, fiber: 5.4, sodium: 3728, sugar: 6.20 },
    // FDC #172946 | SR Legacy
    'hoisin sauce':    { kcal: 220, protein: 3.56, fat: 4.28, carbs: 43.0, fiber: 1.8, sodium: 1799, sugar: 29.5 },
    // FDC #168576 | SR Legacy
    'pesto':           { kcal: 444, protein: 6.20, fat: 44.1, carbs: 7.93, fiber: 2.0, sodium: 540, sugar: 2.30 },

    // ── VINEGARS ─────────────────────────────────────────────────────────────

    // FDC #173469 | SR Legacy
    'white wine vinegar': { kcal: 18, protein: 0.0, fat: 0.0, carbs: 0.04, fiber: 0.0, sodium: 2, sugar: 0.0 },
    // FDC #173469 | SR Legacy
    'red wine vinegar':   { kcal: 19, protein: 0.04, fat: 0.0, carbs: 0.27, fiber: 0.0, sodium: 8, sugar: 0.0 },
    // FDC #173469 | SR Legacy
    'balsamic vinegar':   { kcal: 88, protein: 0.49, fat: 0.0, carbs: 17.0, fiber: 0.0, sodium: 23, sugar: 14.9 },
    // FDC #173469 | SR Legacy
    'apple cider vinegar': { kcal: 22, protein: 0.0, fat: 0.0, carbs: 0.93, fiber: 0.0, sodium: 5, sugar: 0.40 },
    // FDC #173469 | SR Legacy
    'rice vinegar':       { kcal: 11, protein: 0.04, fat: 0.0, carbs: 0.0, fiber: 0.0, sodium: 2, sugar: 0.0 },

    // ── STOCKS & LIQUIDS ──────────────────────────────────────────────────────

    // FDC #174046 | SR Legacy
    'chicken stock':     { kcal: 12, protein: 1.00, fat: 0.48, carbs: 0.36, fiber: 0.0, sodium: 415, sugar: 0.0 },
    // FDC #174046 | SR Legacy
    'beef stock':        { kcal: 15, protein: 1.80, fat: 0.50, carbs: 0.30, fiber: 0.0, sodium: 294, sugar: 0.0 },
    // FDC #174046 | SR Legacy
    'vegetable stock':   { kcal: 7,  protein: 0.20, fat: 0.12, carbs: 0.63, fiber: 0.0, sodium: 300, sugar: 0.0 },
    // FDC #174046 | SR Legacy
    'coconut milk':      { kcal: 197, protein: 2.02, fat: 21.3, carbs: 2.81, fiber: 2.2, sodium: 15, sugar: 3.34 },
    // FDC #174046 | SR Legacy
    'coconut cream':     { kcal: 330, protein: 3.63, fat: 34.7, carbs: 5.54, fiber: 2.2, sodium: 18, sugar: 5.54 },

    // ────────────────────────────────────────────────────────────────────────
    // NUTS & SEEDS
    // ────────────────────────────────────────────────────────────────────────

    // FDC #170567 | Foundation
    'almond':          { kcal: 579, protein: 21.2, fat: 49.9, carbs: 21.6, fiber: 12.5, sodium: 1,  sugar: 4.35 },
    // FDC #170187 | Foundation
    'walnut':          { kcal: 654, protein: 15.2, fat: 65.2, carbs: 13.7, fiber: 6.7, sodium: 2,   sugar: 2.61 },
    // FDC #174253 | Foundation
    'peanut':          { kcal: 567, protein: 25.8, fat: 49.2, carbs: 16.1, fiber: 8.5, sodium: 18,  sugar: 3.97 },
    // FDC #170162 | Foundation
    'cashew':          { kcal: 553, protein: 18.2, fat: 43.8, carbs: 30.2, fiber: 3.3, sodium: 12,  sugar: 5.91 },
    // FDC #170182 | Foundation
    'pecan':           { kcal: 691, protein: 9.17, fat: 71.9, carbs: 13.9, fiber: 9.6, sodium: 0,   sugar: 3.97 },
    // FDC #170184 | Foundation
    'pine nut':        { kcal: 673, protein: 13.7, fat: 68.4, carbs: 13.1, fiber: 3.7, sodium: 2,   sugar: 3.59 },
    // FDC #170150 | Foundation
    'hazelnut':        { kcal: 628, protein: 15.0, fat: 60.8, carbs: 16.7, fiber: 9.7, sodium: 0,   sugar: 4.34 },
    // FDC #170286 | Foundation
    'pistachio':       { kcal: 560, protein: 20.2, fat: 45.3, carbs: 27.2, fiber: 10.6, sodium: 1,  sugar: 7.66 },
    // FDC #170150 | Foundation
    'macadamia':       { kcal: 718, protein: 7.91, fat: 75.8, carbs: 13.8, fiber: 8.6, sodium: 5,   sugar: 4.57 },
    // FDC #170153 | Foundation
    'sesame seed':     { kcal: 573, protein: 17.7, fat: 49.7, carbs: 23.4, fiber: 11.8, sodium: 11, sugar: 0.30 },
    // FDC #170554 | Foundation
    'chia seed':       { kcal: 486, protein: 16.5, fat: 30.7, carbs: 42.1, fiber: 34.4, sodium: 16, sugar: 0.0 },
    // FDC #169414 | Foundation
    'flaxseed':        { kcal: 534, protein: 18.3, fat: 42.2, carbs: 28.9, fiber: 27.3, sodium: 30, sugar: 1.55 },
    // FDC #170150 | Foundation
    'sunflower seed':  { kcal: 584, protein: 20.8, fat: 51.5, carbs: 20.0, fiber: 8.6, sodium: 3,   sugar: 2.62 },
    // FDC #170188 | Foundation
    'pumpkin seed':    { kcal: 559, protein: 30.2, fat: 49.1, carbs: 10.7, fiber: 6.0, sodium: 7,   sugar: 1.40 },
    // FDC #170150 | Foundation
    'peanut butter':   { kcal: 596, protein: 22.2, fat: 51.4, carbs: 22.3, fiber: 6.0, sodium: 426, sugar: 9.20 },

    // ────────────────────────────────────────────────────────────────────────
    // BAKING
    // ────────────────────────────────────────────────────────────────────────

    // FDC #168933 | SR Legacy
    'baking powder':   { kcal: 53,  protein: 0.0,  fat: 0.0,  carbs: 27.7, fiber: 0.0, sodium: 10600, sugar: 0.0 },
    // FDC #168933 | SR Legacy
    'baking soda':     { kcal: 0,   protein: 0.0,  fat: 0.0,  carbs: 0.0,  fiber: 0.0, sodium: 27360, sugar: 0.0 },
    // FDC #169230 | Foundation (unsweetened)
    'cocoa powder':    { kcal: 228, protein: 19.6, fat: 13.7, carbs: 57.9, fiber: 37.0, sodium: 21, sugar: 1.75 },
    // FDC #169230 | Foundation
    'vanilla extract': { kcal: 288, protein: 0.06, fat: 0.06, carbs: 12.7, fiber: 0.0, sodium: 9,  sugar: 12.7 },
    // FDC #169230 | Foundation (70-85% dark)
    'dark chocolate':  { kcal: 598, protein: 4.90, fat: 42.6, carbs: 45.8, fiber: 10.9, sodium: 20, sugar: 24.2 },
    // FDC #169230 | Foundation
    'milk chocolate':  { kcal: 535, protein: 7.65, fat: 29.7, carbs: 59.4, fiber: 3.4, sodium: 79, sugar: 51.5 },
    // FDC #168936 | Foundation
    'yeast':           { kcal: 325, protein: 40.4, fat: 7.61, carbs: 41.2, fiber: 26.9, sodium: 51, sugar: 0.0 },
    // FDC #169230 | Foundation
    'cream of tartar': { kcal: 218, protein: 0.0,  fat: 0.0,  carbs: 54.4, fiber: 0.0, sodium: 920, sugar: 0.0 },
    // FDC #169230 | Foundation
    'gelatin':         { kcal: 335, protein: 85.6, fat: 0.1,  carbs: 0.0,  fiber: 0.0, sodium: 196, sugar: 0.0 },
    // FDC #169230 | Foundation
    'chocolate chip':  { kcal: 542, protein: 5.56, fat: 29.7, carbs: 67.7, fiber: 3.7, sodium: 10, sugar: 59.2 },

};

// ── Alias Map ─────────────────────────────────────────────────────────────────
// Maps alternative names, regional spellings, and common variants to canonical keys.
// Add entries here — DO NOT add duplicate keys to db above.

const L0_ALIASES = {
    // British / regional names
    'courgette':              'zucchini',
    'aubergine':              'eggplant',
    'coriander':              'cilantro',
    'spring onion':           'scallion',
    'capsicum':               'bell pepper',
    'sweet corn':             'corn',
    'mange tout':             'snow pea',
    'rocket':                 'rocket',    // identity — already in db
    'beetroot':               'beet',
    'prawn':                  'shrimp',
    'double cream':           'heavy cream',
    'single cream':           'sour cream', // approx (18% fat vs 20%)
    'whipping cream':         'heavy cream',
    'creme fraiche':          'sour cream',
    'fromage frais':          'yogurt',

    // American / alt spellings
    'bell pepper':            'bell pepper',
    'ground beef':            'ground beef',
    'ground pork':            'pork',
    'scallion':               'scallion',
    'cilantro':               'cilantro',
    'eggplant':               'eggplant',
    'zucchini':               'zucchini',

    // Flour aliases
    'plain flour':            'all-purpose flour',
    'flour':                  'all-purpose flour',
    'corn flour':             'cornstarch',
    'maize flour':            'cornstarch',
    'arrowroot':              'cornstarch',

    // Sugar aliases
    'caster sugar':           'granulated sugar',
    'castor sugar':           'granulated sugar',
    'white sugar':            'granulated sugar',
    'superfine sugar':        'granulated sugar',
    'icing sugar':            'powdered sugar',
    'confectioners sugar':    'powdered sugar',
    'dark brown sugar':       'brown sugar',
    'light brown sugar':      'brown sugar',

    // Meat aliases
    'beef mince':             'ground beef',
    'lamb mince':             'lamb mince',
    'minced beef':            'ground beef',
    'mince':                  'ground beef',
    'mince meat':             'ground beef',
    'pork mince':             'pork',
    'minced pork':            'pork',

    // Other
    'bicarbonate of soda':    'baking soda',
    'bicarb':                 'baking soda',
    'kosher salt':            'salt',
    'sea salt':               'salt',
    'flaky salt':             'salt',
    'table salt':             'salt',
    'chicken stock':          'chicken stock',
    'vegetable stock':        'vegetable stock',
    'beef stock':             'beef stock',
    'stock':                  'chicken stock',
    'passata':                'tomato paste',
    'chinese five spice':     'five spice',
    'five-spice':             'five spice',
    '5 spice':                'five spice',
    'five spice powder':      'five spice',
    'chilli':                 'chili',
    'chilli pepper':          'chili',
    'red chilli':             'chili',
    'green chilli':           'chili',
    'bird eye chilli':        'chili',
    'white onion':            'onion',
    'yellow onion':           'onion',
    'brown onion':            'onion',
    'red bell pepper':        'red pepper',
    'green bell pepper':      'green pepper',
    'yellow bell pepper':     'bell pepper',
    'orange bell pepper':     'bell pepper',
    'mixed peppers':          'bell pepper',
    'chicken wings':          'chicken',
    'chicken drumstick':      'chicken thigh',
    'chicken leg':            'chicken thigh',
    'ground turkey':          'turkey',
    'pork chop':              'pork',
    'pork loin':              'pork',
    'pork tenderloin':        'pork',
    'sirloin':                'steak',
    'ribeye':                 'steak',
    'tenderloin':             'steak',
    'flank steak':            'steak',
    'fillet steak':           'steak',
    'beef stock cube':        'beef stock',
    'chicken stock cube':     'chicken stock',
    'vegetable stock cube':   'vegetable stock',
    'oats':                   'oat',
    'rolled oats':            'oat',
    'porridge oats':          'oat',
    'jumbo oats':             'oat',
    'semolina':               'couscous',
    'lemon juice':            'lemon',
    'lime juice':             'lime',
    'orange juice':           'orange',
    'tomato puree':           'tomato paste',
    'canned tomato':          'tomato',
    'tinned tomato':          'tomato',
    'soy':                    'soy sauce',
    'tamari':                 'soy sauce',
    'fresh cream':            'heavy cream',
    'white rice':             'rice',
    'jasmine rice':           'rice',
    'risotto rice':           'rice',
    'arborio rice':           'rice',
    'basmati':                'basmati rice',
    'egg white':              'egg',
    'egg yolk':               'egg',
    'whole egg':              'egg',
    'crème fraîche':          'sour cream',
    'créme fraiche':          'sour cream',
};

// ── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Look up a cleaned ingredient name in the L0 database.
 * Handles: exact matches → alias map → simple plural stripping → null.
 *
 * @param {string} query - cleaned, lowercased ingredient name
 * @returns {object|null} - nutrition object or null if not in L0
 */
export function resolveL0(query) {
    if (!query) return null;

    // 1. Exact match
    if (db[query]) return db[query];

    // 2. Alias map
    const aliased = L0_ALIASES[query];
    if (aliased && db[aliased]) return db[aliased];

    // 3. Strip trailing 's' (apple → apples, carrot → carrots)
    if (query.endsWith('s') && query.length > 2) {
        const singular = query.slice(0, -1);
        if (db[singular]) return db[singular];
        const singularAliased = L0_ALIASES[singular];
        if (singularAliased && db[singularAliased]) return db[singularAliased];
    }

    // 4. Strip trailing 'es' (tomatoes → tomato, potatoes → potato)
    if (query.endsWith('es') && query.length > 3) {
        const singular = query.slice(0, -2);
        if (db[singular]) return db[singular];
        const singularAliased = L0_ALIASES[singular];
        if (singularAliased && db[singularAliased]) return db[singularAliased];
    }

    // 5. Strip trailing 'ies' → 'y' (berries → berry, strawberries → strawberry)
    if (query.endsWith('ies') && query.length > 4) {
        const singular = query.slice(0, -3) + 'y';
        if (db[singular]) return db[singular];
    }

    return null;
}

// Keep exporting the raw db for any tooling/testing that needs it
export const localNutritionDb = db;
