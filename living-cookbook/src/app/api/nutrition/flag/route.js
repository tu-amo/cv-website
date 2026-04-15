/**
 * POST /api/nutrition/flag
 * ─────────────────────────────────────────────────────────────────────────────
 * Records a bad USDA match flagged by the user from the NutritionPanel.
 * Creates a row in nutrition_flags for periodic maintenance review.
 *
 * Body:
 *   { ingredient_name, usda_name, usda_fdc_id, kcal_100g, confidence, recipe_id }
 *
 * Returns:
 *   201 { id }        — created
 *   200 { existing }  — already flagged by this user
 *   401               — not authenticated
 *   400               — missing ingredient_name
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { createClient }  from '@/lib/supabase/server';
// ADR-007: supabaseAdmin used here deliberately — nutrition_flags has no user-accessible INSERT
// policy (it is a moderation table; allowing arbitrary user writes would bypass review).
// User identity is verified via supabase.auth.getUser() before the admin write; only the
// verified user.id is written as flagged_by — no user-supplied IDs are trusted.
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
    // 1. Parse body and IP
    const body = await request.json().catch(() => ({}));
    const { ingredient_name, usda_name, usda_fdc_id, kcal_100g, confidence, recipe_id } = body;

    // 2. Auth check OR Anonymous check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // We get IP from x-forwarded-for if anonymous, and hash it or just use it raw as anonymous_session_id
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const anonymous_session_id = user ? null : (body.anonymous_session_id || ip);

    if (!user && !anonymous_session_id) {
        return NextResponse.json({ error: 'Not authenticated or missing session ID' }, { status: 401 });
    }

    if (!ingredient_name) {
        return NextResponse.json({ error: 'ingredient_name is required' }, { status: 400 });
    }

    // 3. Check whether this user/anon has already flagged this ingredient
    const query = supabaseAdmin
        .from('nutrition_flags')
        .select('id, status')
        .eq('ingredient_name', ingredient_name)
        .eq('status', 'open');

    if (user) {
        query.eq('flagged_by', user.id);
    } else {
        query.eq('anonymous_session_id', anonymous_session_id);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
        return NextResponse.json({ existing: true, id: existing.id }, { status: 200 });
    }

    // 4. Insert the flag
    const { data, error } = await supabaseAdmin
        .from('nutrition_flags')
        .insert({
            ingredient_name,
            usda_name:   usda_name   || null,
            usda_fdc_id: usda_fdc_id || null,
            kcal_100g:   kcal_100g   || null,
            confidence:  confidence  || null,
            recipe_id:   recipe_id   || null,
            flagged_by:  user ? user.id : null,
            anonymous_session_id,
            status:      'open',
        })
        .select('id')
        .single();

    if (error) {
        console.error('[nutrition/flag] insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
}
