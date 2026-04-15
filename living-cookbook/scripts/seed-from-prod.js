/**
 * scripts/seed-from-prod.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Copies production data into the staging (dev) Supabase project.
 *
 * What gets copied:
 *   ✅ nutrition_cache   — USDA lookup cache (no user dependency)
 *   ✅ ingredients       — ingredient name catalogue
 *   ✅ recipes           — all recipes, user_id remapped to STAGING_USER_ID
 *   ✅ recipe_ingredients, instruction_steps, recipe_notes, adaptation_notes
 *      — child tables, recipe_id remapped using prod→staging ID map
 *
 * What is intentionally NOT copied:
 *   ❌ profiles / group_members / groups — tied to real auth.users
 *   ❌ shopping_list — user-specific, not useful for dev
 *   ❌ nutrition_flags — empty in prod, fresh start in staging is fine
 *
 * Usage:
 *   1. Sign up on localhost:3000 to create your staging account
 *   2. Get your staging user ID from:
 *      Supabase staging dashboard → Authentication → Users
 *   3. Paste the UUID into STAGING_USER_ID below
 *   4. Run: node scripts/seed-from-prod.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync } from 'fs';

// ── ⚙️  CONFIG — set your staging user ID here ─────────────────────────────
const STAGING_USER_ID = 'd03274cc-fd2e-4415-84fe-8abe8ddb2d6a';
// ─────────────────────────────────────────────────────────────────────────────

if (STAGING_USER_ID === 'PASTE_YOUR_STAGING_USER_UUID_HERE') {
    console.error('❌  Set STAGING_USER_ID at the top of this script first.');
    process.exit(1);
}

// ── Load env files ────────────────────────────────────────────────────────────
function loadEnv(path) {
    const raw = readFileSync(path, 'utf8');
    return Object.fromEntries(
        raw.split('\n')
           .filter(l => l && !l.startsWith('#') && l.includes('='))
           .map(l => {
               const i = l.indexOf('=');
               return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
           })
    );
}

const prod    = loadEnv('.env.local.production');
const staging = loadEnv('.env.local');

const PROD_URL     = prod['NEXT_PUBLIC_SUPABASE_URL'];
const PROD_KEY     = prod['SUPABASE_SERVICE_ROLE_KEY'];
const STAGING_URL  = staging['NEXT_PUBLIC_SUPABASE_URL'];
const STAGING_KEY  = staging['SUPABASE_SERVICE_ROLE_KEY'];

if (PROD_URL === STAGING_URL) {
    console.error('❌  Prod and staging URLs are the same — aborting to protect production.');
    process.exit(1);
}

console.log(`\n📦  Seeding staging from production`);
console.log(`    PROD:    ${PROD_URL}`);
console.log(`    STAGING: ${STAGING_URL}\n`);

// ── Helper: fetch all rows from a prod table ──────────────────────────────────
async function readProd(table, select = '*') {
    const res = await fetch(`${PROD_URL}/rest/v1/${table}?select=${select}&limit=10000`, {
        headers: {
            'Authorization': `Bearer ${PROD_KEY}`,
            'apikey': PROD_KEY,
        }
    });
    if (!res.ok) throw new Error(`Prod read ${table} failed: ${res.status} ${await res.text()}`);
    return res.json();
}

// ── Helper: upsert rows into staging ─────────────────────────────────────────
async function writeStaging(table, rows, onConflict = '') {
    if (!rows.length) { console.log(`   ⏭  ${table}: nothing to insert`); return; }
    const url = `${STAGING_URL}/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${STAGING_KEY}`,
            'apikey': STAGING_KEY,
            'Content-Type': 'application/json',
            'Prefer': onConflict ? 'resolution=merge-duplicates' : 'return=minimal',
        },
        body: JSON.stringify(rows),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Staging write ${table} failed: ${res.status} ${err}`);
    }
    console.log(`   ✅  ${table}: ${rows.length} rows`);
}

// ── Helper: insert recipes and get back staging IDs ──────────────────────────
async function writeRecipesGetIds(rows) {
    if (!rows.length) return [];
    const res = await fetch(`${STAGING_URL}/rest/v1/recipes`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${STAGING_KEY}`,
            'apikey': STAGING_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        },
        body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`Recipe insert failed: ${res.status} ${await res.text()}`);
    const inserted = await res.json();
    console.log(`   ✅  recipes: ${inserted.length} rows`);
    return inserted; // array of inserted rows including new staging IDs
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {

    // Safety check — abort if staging already has recipe data to prevent duplication
    const existingCheck = await fetch(`${STAGING_URL}/rest/v1/recipes?select=id&limit=1`, {
        headers: { 'Authorization': `Bearer ${STAGING_KEY}`, 'apikey': STAGING_KEY }
    });
    const existing = await existingCheck.json();
    if (existing.length > 0) {
        console.error('⚠️  Staging already has recipe data. To re-seed, run this SQL first:');
        console.error('   DELETE FROM recipes; DELETE FROM nutrition_cache;');
        console.error('   Then re-run this script.');
        process.exit(1);
    }

    console.log('1️⃣  Copying nutrition_cache...');
    const cache = await readProd('nutrition_cache');
    await writeStaging('nutrition_cache', cache, 'ingredient_name');

    // 2. ingredients — skip: production uses bigint IDs we can't replicate with
    // GENERATED ALWAYS AS IDENTITY. The UI uses display_name on recipe_ingredients,
    // not ingredient_id, so this is safe for dev purposes.
    console.log('2️⃣  Skipping ingredients (bigint PK, no insert override in staging)');

    // 3. recipes — strip user_id and group_id, remap to staging user
    console.log('3️⃣  Copying recipes...');
    const prodRecipes = await readProd('recipes');

    // Build staging recipe rows — omit id (bigint identity auto-assigns)
    const recipePayload = prodRecipes.map(r => ({
        title:             r.title,
        description:       r.description,
        servings:          r.servings,
        prep_time_minutes: r.prep_time_minutes,
        cook_time_minutes: r.cook_time_minutes,
        difficulty:        r.difficulty,
        tags:              r.tags,
        images:            r.images,
        image:             r.image,
        is_public:         r.is_public ?? false,
        ai_images_used:    r.ai_images_used ?? 0,
        page_number:       r.page_number,
        user_id:           STAGING_USER_ID,
        group_id:          null,
        created_at:        r.created_at,
    }));

    const insertedRecipes = await writeRecipesGetIds(recipePayload);

    // Build prod_id → staging_id map
    const prodIdToStagingId = new Map();
    for (let i = 0; i < prodRecipes.length; i++) {
        prodIdToStagingId.set(prodRecipes[i].id, insertedRecipes[i]?.id);
    }

    // 4. recipe_ingredients — null out ingredient_id (bigint FK can't be remapped)
    console.log('4️⃣  Copying recipe_ingredients...');
    const prodRI = await readProd('recipe_ingredients');
    const stagingRI = prodRI
        .map(ri => ({
            // omit id — prod uses bigint, staging uses UUID (auto-generated)
            recipe_id:     prodIdToStagingId.get(ri.recipe_id),
            ingredient_id: null,
            display_name:  ri.display_name,
            quantity:      ri.quantity,
            unit:          ri.unit,
            preparation:   ri.preparation,
            section:       ri.section,
            sort_order:    ri.sort_order,
        }))
        .filter(ri => ri.recipe_id);
    await writeStaging('recipe_ingredients', stagingRI);

    // 5. instruction_steps
    console.log('5️⃣  Copying instruction_steps...');
    const prodSteps = await readProd('instruction_steps');
    const stagingSteps = prodSteps
        .map(s => ({
            // omit id — prod bigint incompatible with staging UUID
            recipe_id:        prodIdToStagingId.get(s.recipe_id),
            step_number:      s.step_number,
            instruction_text: s.instruction_text,
            duration_minutes: s.duration_minutes,
        }))
        .filter(s => s.recipe_id);
    await writeStaging('instruction_steps', stagingSteps);

    // 6. recipe_notes
    console.log('6️⃣  Copying recipe_notes...');
    const prodNotes = await readProd('recipe_notes');
    const stagingNotes = prodNotes
        .map(n => ({
            recipe_id:  prodIdToStagingId.get(n.recipe_id),
            content:    n.content,
            created_at: n.created_at,
        }))
        .filter(n => n.recipe_id);
    await writeStaging('recipe_notes', stagingNotes);

    // 7. adaptation_notes
    console.log('7️⃣  Copying adaptation_notes...');
    const prodAdapt = await readProd('adaptation_notes');
    const stagingAdapt = prodAdapt
        .map(a => ({
            recipe_id:  prodIdToStagingId.get(a.recipe_id),
            content:    a.content,
            created_at: a.created_at,
        }))
        .filter(a => a.recipe_id);
    await writeStaging('adaptation_notes', stagingAdapt);

    console.log('\n🎉  Seed complete! Staging database is ready.\n');
    console.log('   Note: Recipe images reference production Supabase Storage URLs.');
    console.log('   Images will still display (they are public URLs) but new image');
    console.log('   uploads in staging will go to the staging bucket.\n');
}

main().catch(err => {
    console.error('\n❌  Seed failed:', err.message);
    process.exit(1);
});
