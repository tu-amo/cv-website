/**
 * /api/nutrition/route.js
 *
 * Server-side proxy to USDA FoodData Central.
 * Implements a two-level cache to eliminate cold-start misses on Vercel:
 *
 *   L1 — In-memory Map     (fast, same serverless instance only)
 *   L2 — Supabase DB       (persistent, shared across all instances/deploys)
 *   Origin — USDA FDC API  (authoritative source, 90-day TTL on cached data)
 *
 * BATCH MODE (preferred — solves N+1 problem):
 *   GET /api/nutrition?ingredients=butter|plain flour|egg
 *   → { "butter": {...}, "plain flour": {...}, "egg": {...} }
 *
 * SINGLE MODE (backward compat):
 *   GET /api/nutrition?q=butter
 *   → { found, name, per100g: { kcal, protein, fat, carbs } }
 */

import { NextResponse } from 'next/server';
// ADR-007: supabaseAdmin used here deliberately — nutrition_cache has no user-session-accessible
// INSERT policy. This route is public (no auth required — ADR-005), so there is no JWT to pass.
// The write is fire-and-forget to a shared, non-user-scoped cache table. See ADR-004 + ADR-007.
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
    logNutritionLookup,
    logNutritionAnomaly,
    logLowConfidenceSkip,
} from '@/lib/observability';
import { localNutritionDb } from '@/lib/nutrition-local-db';

export const dynamic = 'force-dynamic'; // Prevent build-time execution (which fails if keys are missing in Vercel)

const USDA_API_KEY = process.env.USDA_FDC_API_KEY;
const BASE_URL     = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

// L1: In-memory Map — instant, lives only while the function instance is warm
const L1 = new Map();

// ── Nutrient extraction ──────────────────────────────────────────────────────
// Name-based rather than ID-based because:
//   SR Legacy  → nutrientId 1008  "Energy" (kcal)
//   Foundation → nutrientId 2047  "Energy, Atwater General Factors" (kcal)
function getNutrientByName(nutrients, nameSubstring, unit = null) {
    const matches = nutrients.filter(n => {
        const name = (n.nutrientName || '').toLowerCase();
        return name.includes(nameSubstring.toLowerCase())
            && (!unit || (n.unitName || '').toLowerCase() === unit.toLowerCase());
    });
    if (!matches.length) return null;
    const best = matches.find(n => (n.unitName || '').toLowerCase() === 'kcal') || matches[0];
    return best.value != null ? Math.round(best.value * 10) / 10 : null;
}

// ── Name cleaning ────────────────────────────────────────────────────────────
function cleanIngredientName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/,.*$/, '')
        .replace(/\b(fresh|dried|chopped|diced|minced|sliced|grated|peeled|halved|quartered|crushed|ground|roasted|raw|cooked|frozen|canned|large|small|medium|whole|boneless|skinless|room temperature|softened|melted|sifted)\b/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ── Query boosts ─────────────────────────────────────────────────────────────
const QUERY_BOOSTS = {
    'butter':            'butter salted',
    'flour':             'flour wheat all-purpose',
    'plain flour':       'flour wheat all-purpose',
    'all-purpose flour': 'flour wheat all-purpose',
    'bread flour':       'bread flour wheat',
    'sugar':             'sugars granulated',
    'caster sugar':      'sugar granulated',
    'milk':              'milk whole',
    'cream':             'cream heavy whipping',
    'double cream':      'cream heavy whipping',
    'olive oil':         'oil olive salad or cooking',
    'vegetable oil':     'oil vegetable salad or cooking',
    'egg':               'egg whole raw',
    'eggs':              'egg whole raw',
    'chicken':           'chicken broilers breast raw',
    'garlic':            'garlic raw',
    'onion':             'onions raw',
    'yellow onion':      'onions raw',
    'whole yellow onion':'onions raw',
    'red onion':         'onions red raw',
    'tomato':            'tomatoes raw',
    'tomato paste':      'tomato paste canned no salt',      // LL-043 flag: was matching oily compound product
    'potato':            'potatoes raw',
    'carrot':            'carrots raw',
    'lemon':             'lemons raw',
    'salt':              'salt table',
    'kosher salt':       'salt table',                       // LL-043 flag: kosher salt = pure NaCl, 0 kcal
    'sea salt':          'salt table',
    'pepper':            'spices pepper black',
    'black pepper':      'spices pepper black',
    'bell pepper':       'peppers sweet raw',
    'bell peppers':      'peppers sweet raw',
    'red bell pepper':   'peppers sweet red raw',
    'green bell pepper': 'peppers sweet green raw',
    'yellow bell pepper':'peppers sweet yellow raw',
    'red pepper':        'peppers sweet red raw',
    'green pepper':      'peppers sweet green raw',
    'mixed peppers':     'peppers sweet raw',
    'honey':             'honey',
    'cheddar':           'cheese cheddar',
    'parmesan':          'cheese parmesan grated',
    'rice':              'rice white long-grain raw',
    'pasta':             'pasta dry enriched',
    'chinese spice':     'spices five spice powder',         // LL-043 flag: 5-spice is ~280 kcal/100g
    'five spice':        'spices five spice powder',
    'five-spice':        'spices five spice powder',
    '5 spice':           'spices five spice powder',
    'five spice powder': 'spices five spice powder',
};

// ── Shape a DB row into our standard result object ───────────────────────────
function rowToResult(row) {
    return {
        found:         true,
        query:         row.ingredient_name,
        name:          row.usda_name,
        dataType:      row.usda_datatype,
        fdcId:         row.usda_fdc_id,
        confidence:    row.confidence,
        lowConfidence: row.confidence === 'low', // UI indicator flag — BUG-001
        per100g: {
            kcal:    row.kcal_100g,
            protein: row.protein_100g,
            fat:     row.fat_100g,
            carbs:   row.carbs_100g,
            fiber:   row.fiber_100g,
        },
    };
}

// ── Core lookup — L1 → L2 → USDA ────────────────────────────────────────────
async function lookupSingle(rawName) {
    const query = cleanIngredientName(rawName);
    if (!query) return { found: false, query: '' };

    // ── L0: Hardcoded Local Database ──────────────────────────────────────────
    if (localNutritionDb[query]) {
        const local = localNutritionDb[query];
        // Capitalize first letter for display UI
        const capitalizedName = query.charAt(0).toUpperCase() + query.slice(1);
        const result = {
            found: true,
            query: query,
            name: capitalizedName,
            dataType: 'Local Ground Truth',
            fdcId: 'L0',
            confidence: 'high',
            lowConfidence: false,
            per100g: local
        };
        logNutritionLookup({ ingredient: query, result, source: 'L0' });
        return { ...result, cacheLevel: 'L0' };
    }

    // ── L1: In-memory Map ─────────────────────────────────────────────────────
    if (L1.has(query)) {
        logNutritionLookup({ ingredient: query, result: L1.get(query), source: 'L1' }); // OBS-005
        return { ...L1.get(query), cacheLevel: 'L1' };
    }

    // ── L2: Supabase nutrition_cache ──────────────────────────────────────────
    try {
        const ttlCutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
        const { data: row } = await supabaseAdmin
            .from('nutrition_cache')
            .select('*')
            .eq('ingredient_name', query)
            .gt('fetched_at', ttlCutoff)
            .maybeSingle();

        if (row) {
            const result = rowToResult(row);
            L1.set(query, result); // populate L1 so next request in this instance is instant
            logNutritionLookup({ ingredient: query, result, source: 'L2' }); // OBS-005
            return { ...result, cacheLevel: 'L2' };
        }
    } catch (dbErr) {
        // L2 failure is non-fatal — fall through to USDA
        console.warn('[nutrition] L2 read failed:', dbErr.message);
    }

    // ── Origin: USDA FoodData Central ─────────────────────────────────────────
    if (!USDA_API_KEY) throw new Error('USDA_FDC_API_KEY not configured');

    const searchTerm = QUERY_BOOSTS[query] || query;
    const url = new URL(BASE_URL);
    url.searchParams.set('query', searchTerm);
    url.searchParams.set('dataType', 'Foundation,SR Legacy');
    url.searchParams.set('pageSize', '5');
    url.searchParams.set('api_key', USDA_API_KEY);

    const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'TheLivingCookbook/1.0' },
        next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error(`USDA API error: ${res.status}`);

    const data  = await res.json();
    const foods = data.foods || [];

    if (foods.length === 0) {
        const result = { found: false, query };
        L1.set(query, result);
        logNutritionLookup({ ingredient: query, result: null, source: 'origin' }); // OBS-005
        return result;
    }

    const queryLower = query.toLowerCase();
    const best = foods.find(f => f.description.toLowerCase().startsWith(queryLower))
              || foods.find(f => f.dataType === 'SR Legacy')
              || foods.find(f => f.dataType === 'Foundation')
              || foods[0];

    // BUG-001: Three-tier confidence to prevent caching wrong USDA matches
    // 'high'   → USDA description starts with the query  → cache normally
    // 'medium' → USDA description contains the query      → cache normally
    // 'low'    → USDA description does NOT contain query  → serve but DO NOT write to L2
    const descLower = (best.description || '').toLowerCase();
    let confidence;
    if (descLower.startsWith(queryLower))    confidence = 'high';
    else if (descLower.includes(queryLower)) confidence = 'medium';
    else                                     confidence = 'low';

    const nutrients = best.foodNutrients || [];
    const result = {
        found:         true,
        query,
        name:          best.description,
        dataType:      best.dataType,
        fdcId:         best.fdcId,
        confidence,
        lowConfidence: confidence === 'low', // explicit flag for NutritionPanel ⚠ indicator
        per100g: {
            kcal:    getNutrientByName(nutrients, 'energy', 'kcal'),
            protein: getNutrientByName(nutrients, 'protein'),
            fat:     getNutrientByName(nutrients, 'total lipid'),
            carbs:   getNutrientByName(nutrients, 'carbohydrate, by difference'),
            fiber:   getNutrientByName(nutrients, 'fiber, total dietary'),
        },
        cacheLevel: 'origin',
    };

    // Populate L1 immediately (even low-confidence — avoids repeat USDA calls per instance)
    L1.set(query, result);

    // OBS-005: log every USDA origin call with confidence level
    logNutritionLookup({ ingredient: query, result, source: 'origin' });

    // OBS-005: secondary anomaly flag for implausible kcal (supplements BUG-001 guard)
    if (result.per100g.kcal != null) {
        logNutritionAnomaly({ ingredient: query, usdaResult: best, kcal: result.per100g.kcal });
    }

    // BUG-001: Only write to L2 for 'high' or 'medium' confidence.
    // Low-confidence results are served but NOT persisted — prevents 90-day cache poisoning.
    if (confidence !== 'low') {
        supabaseAdmin.from('nutrition_cache').upsert({
            ingredient_name: query,
            usda_fdc_id:     result.fdcId,
            usda_name:       result.name,
            usda_datatype:   result.dataType,
            kcal_100g:       result.per100g.kcal,
            protein_100g:    result.per100g.protein,
            fat_100g:        result.per100g.fat,
            carbs_100g:      result.per100g.carbs,
            fiber_100g:      result.per100g.fiber,
            confidence,
            fetched_at:      new Date().toISOString(),
        }, { onConflict: 'ingredient_name' })
        .then(() => {}) // intentionally not awaited
        .catch(e => console.warn('[nutrition] L2 write failed:', e.message));
    } else {
        // OBS-005: log every prevented cache write — helps identify USDA coverage gaps
        logLowConfidenceSkip({ ingredient: query, usdaName: result.name, fdcId: result.fdcId });
    }

    return result;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const batchParam = searchParams.get('ingredients');

    // ── BATCH MODE ────────────────────────────────────────────────────────────
    if (batchParam) {
        const rawNames = batchParam.split('|').filter(Boolean);

        // Deduplicate by cleaned name so "butter" & "butter, softened" → one lookup
        const cleanedToOriginals = new Map();
        for (const raw of rawNames) {
            const cleaned = cleanIngredientName(raw);
            if (!cleaned) continue;
            if (!cleanedToOriginals.has(cleaned)) cleanedToOriginals.set(cleaned, []);
            cleanedToOriginals.get(cleaned).push(raw);
        }

        // Fan out — L1/L2 hits return instantly, only true misses hit USDA
        const uniqueCleaned = [...cleanedToOriginals.keys()];
        const settled = await Promise.allSettled(
            uniqueCleaned.map(name => lookupSingle(name))
        );

        // Key response by ORIGINAL name so client does nutritionMap[originalName]
        const responseMap = {};
        settled.forEach((result, i) => {
            const cleaned = uniqueCleaned[i];
            const originals = cleanedToOriginals.get(cleaned);
            const value = result.status === 'fulfilled'
                ? result.value
                : { found: false, query: cleaned };
            for (const orig of originals) responseMap[orig] = value;
        });

        return NextResponse.json(responseMap);
    }

    // ── SINGLE MODE (backward compat) ─────────────────────────────────────────
    const rawQuery = searchParams.get('q');
    if (!rawQuery) {
        return NextResponse.json({ error: 'Missing q or ingredients parameter' }, { status: 400 });
    }

    try {
        return NextResponse.json(await lookupSingle(rawQuery));
    } catch (err) {
        console.error('[/api/nutrition] Error:', err);
        return NextResponse.json({ error: err.message, found: false }, { status: 500 });
    }
}
