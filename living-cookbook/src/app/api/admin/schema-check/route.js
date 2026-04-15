/**
 * /api/admin/schema-check/route.js
 *
 * OBS-009: Supabase schema drift detection.
 *
 * Called by Vercel Cron daily. Compares the live Supabase schema (via
 * information_schema.columns) against a known-good column snapshot.
 *
 * On drift: logs to Sentry and returns 500 so the cron is marked as failed
 *           (visible in Vercel → Cron Jobs dashboard).
 * On match: returns 200 OK.
 *
 * Auth: Bearer SUPABASE_SERVICE_ROLE_KEY  (same pattern as /api/admin/cache-flush)
 * Schedule: see vercel.json crons config — runs daily at 06:00 UTC
 *
 * Usage (manual test):
 *   curl -X GET $URL/api/admin/schema-check \
 *        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
 */

import { NextResponse } from "next/server";
import { supabaseAdmin }  from "@/lib/supabase/admin";
import * as Sentry from "@sentry/nextjs";

// ── Expected schema snapshot ─────────────────────────────────────────────────
// Format: { table: [required_column, ...], ... }
// Only tracks columns that are critical to app correctness.
// Add new columns here whenever a migration adds a required field.

const EXPECTED = {
    // ── Core recipe tables ────────────────────────────────────────────────────
    recipes: [
        "id", "title", "user_id", "group_id", "is_public",
        "servings", "source_id", "updated_by", "created_at",
        "prep_time_minutes", "cook_time_minutes", "image", "images",
    ],
    recipe_ingredients: [
        "id", "recipe_id", "display_name", "quantity", "unit",
        "sort_order", "section", "ingredient_id", "preparation",
    ],
    instruction_steps: [
        "id", "recipe_id", "step_number", "instruction_text",  // NOT "instruction"
    ],
    recipe_notes: [
        "id", "recipe_id", "content",  // NOT "note"
    ],
    sources: [
        "id", "book_title", "author",  // book_title is what the code reads/writes
    ],
    ingredients: [
        "id", "name", "default_unit",
    ],
    // ── User / auth tables ────────────────────────────────────────────────────
    profiles: [
        "id", "display_name", "tier",  // tier added — usage gate (2026-04-14 migration)
    ],
    // ── Household / group tables ──────────────────────────────────────────────
    groups: [
        "id", "name", "owner_id", "invite_code", "group_type",
        "company_name", "company_address", "contact_email",
    ],
    group_members: [
        "id", "group_id", "user_id", "role",
    ],
    // ── Shopping / procurement ────────────────────────────────────────────────
    shopping_list: [
        "id", "user_id", "group_id", "item_name", "quantity", "unit",
        "is_checked", "source", "supplier_order_id",
    ],
    supplier_orders: [
        "id", "group_id", "supplier_name", "order_date", "ordered_at", "ordered_by",
    ],
    // ── Pro Kitchen ───────────────────────────────────────────────────────────
    production_plans: [
        "id", "group_id", "recipe_id", "planned_servings", "planned_date",
        "assigned_to", "status", "created_by", "created_at",
    ],
    // ── Nutrition ─────────────────────────────────────────────────────────────
    nutrition_cache: [
        // No "id" column — PK is ingredient_name
        "ingredient_name", "kcal_100g", "protein_100g", "fat_100g",
        "carbs_100g", "fiber_100g", "confidence", "fetched_at",
    ],
    nutrition_flags: [
        "id", "ingredient_name", "flagged_by", "flagged_at", "recipe_id", "anonymous_session_id", // NOT "user_id"/"created_at"
    ],
    // ── Usage / monetisation ──────────────────────────────────────────────────
    usage_tracking: [
        "user_id", "month", "briefs_used", "scans_used", "updated_at",
    ],
    anonymous_rate_limit: [
        "ip_address", "requests_today", "last_reset_date",
    ],
};

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
    // Auth guard — same pattern as cache-flush (OBS-006)
    const authHeader = request.headers.get("authorization") || "";
    const token      = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token || token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch live columns for all tables we care about
        const tables  = Object.keys(EXPECTED);
        const { data, error } = await supabaseAdmin.rpc("get_columns_for_tables", { _tables: tables });

        if (error) {
            // Fallback: query information_schema directly via raw SQL if the RPC doesn't exist
            const { data: rawData, error: rawError } = await supabaseAdmin
                .from("information_schema.columns")
                .select("table_name, column_name")
                .in("table_name", tables)
                .eq("table_schema", "public");

            if (rawError) throw rawError;
            return checkDrift(rawData.map(r => ({ table_name: r.table_name, column_name: r.column_name })));
        }

        return checkDrift(data);
    } catch (err) {
        Sentry.captureException(err, { tags: { component: "schema-check" } });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function checkDrift(rows) {
    // Build a map of actual columns: { table → Set<column> }
    const actual = {};
    for (const { table_name, column_name } of rows) {
        if (!actual[table_name]) actual[table_name] = new Set();
        actual[table_name].add(column_name);
    }

    const drifts = [];

    for (const [table, expectedCols] of Object.entries(EXPECTED)) {
        const liveCols = actual[table] || new Set();

        // Missing columns — in snapshot but not in DB
        const missing = expectedCols.filter(c => !liveCols.has(c));
        if (missing.length) {
            drifts.push({ table, type: "missing_columns", columns: missing });
        }

        // Table entirely absent
        if (!actual[table]) {
            drifts.push({ table, type: "missing_table" });
        }
    }

    if (drifts.length > 0) {
        const summary = drifts.map(d => `${d.table}: ${d.type} [${(d.columns || []).join(", ")}]`).join("; ");
        Sentry.captureMessage(`[OBS-009] Schema drift detected: ${summary}`, {
            level: "error",
            tags: { component: "schema-check" },
            extra: { drifts },
        });
        return NextResponse.json({
            status: "drift_detected",
            drifts,
            summary,
        }, { status: 500 });
    }

    return NextResponse.json({
        status: "ok",
        tables_checked: Object.keys(EXPECTED).length,
        checked_at: new Date().toISOString(),
    });
}
