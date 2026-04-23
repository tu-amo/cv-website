/**
 * src/lib/ai/gemini.js
 *
 * Shared Gemini AI client — single source of truth for the GoogleGenerativeAI
 * instance and model name. Both /api/scan and /api/brief import from here.
 *
 * DRY fix: previously each route instantiated its own client with a different
 * variable name (ai vs genAI) and a potentially missing || "" fallback.
 *
 * Usage:
 *   import { getGeminiModel } from '@/lib/ai/gemini'
 *   const model = getGeminiModel()        // flash (default)
 *   const model = getGeminiModel('pro')   // pro if needed
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
    // Surface the misconfiguration at startup-time, not at first request
    console.warn('[gemini] GEMINI_API_KEY is not set — AI routes will fail')
}

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

/** Default model — flash for cost/speed balance across scan + brief */
const DEFAULT_MODEL = 'gemini-3-flash-preview'

/**
 * Returns a configured Gemini GenerativeModel instance.
 * @param {string} [modelId] - Override the default model name
 * @param {object} [config]  - Optional generationConfig overrides
 */
export function getGeminiModel(modelId = DEFAULT_MODEL, config = {}) {
    return gemini.getGenerativeModel({ model: modelId, ...config })
}
