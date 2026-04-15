"use strict";

/**
 * density-miss-logger.js
 *
 * Accumulates ingredient names that couldn't be converted to grams
 * (because no density entry exists) into localStorage for periodic review.
 *
 * Periodic review command — paste in browser console:
 *   console.table(JSON.parse(localStorage.getItem('density_misses') || '{}'))
 *
 * After reviewing, add meaningful entries to INGREDIENT_DENSITY in unit-converter.js
 * and commit: git commit -m "feat(converter): expand density table — [ingredients added]"
 */

const STORAGE_KEY = 'density_misses';

/**
 * Log an ingredient that had a recognised volumetric unit but no density match.
 * @param {string} ingredientName - The raw ingredient name from the recipe
 */
export const logDensityMiss = (ingredientName) => {
    if (typeof window === 'undefined') return; // SSR guard
    try {
        const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const key = ingredientName.toLowerCase().trim();
        if (!log[key]) {
            log[key] = { firstSeen: new Date().toISOString(), count: 0 };
        }
        log[key].count += 1;
        log[key].lastSeen = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch (_) {
        // Never throw — logging is best-effort only.
        // Fails silently in private browsing or when localStorage is unavailable.
    }
};

/**
 * Returns the current miss log as a plain object, for use in debugging or reporting.
 * @returns {Object} e.g. { 'za'atar': { firstSeen: '...', lastSeen: '...', count: 3 } }
 */
export const getDensityMissLog = () => {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) {
        return {};
    }
};

/**
 * Clears the miss log. Call after updating the density table and verifying.
 */
export const clearDensityMissLog = () => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
};
