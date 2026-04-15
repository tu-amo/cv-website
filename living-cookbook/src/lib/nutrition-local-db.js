/**
 * nutrition-local-db.js
 * 
 * This file serves as an L0 Cache / "Ground Truth" dictionary for core ingredients.
 * The Nutrition API matches ingredients here FIRST before falling back to the USDA API.
 * This ensures basic staples are perfectly accurate and zero-latency.
 */

export const localNutritionDb = {
    // ── Produce ───────────────────────────────────────────────────────────────
    'apple': { kcal: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
    'apples': { kcal: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
    'yellow onion': { kcal: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },
    'yellow onions': { kcal: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },
    'onion': { kcal: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },
    'onions': { kcal: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },

    // ── Meat & Poultry ────────────────────────────────────────────────────────
    'chicken breast': { kcal: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
    'chicken breasts': { kcal: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
    'chicken': { kcal: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 }, // Map generic chicken to breast for safety
};
