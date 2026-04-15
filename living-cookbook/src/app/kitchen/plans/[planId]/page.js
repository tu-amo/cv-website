"use client";

/**
 * /kitchen/plans/[planId] — PK3, PK4, PK5
 *
 * PK3: Displays a production plan with all recipe ingredients scaled to
 *      the planned_servings quantity.
 * PK4: Allows the user to enter on-hand quantities for each ingredient.
 *      These values are session-only (useState) — not persisted to the DB.
 * PK5: Row turns green (covered) or amber (shortfall) only after the user
 *      manually ticks the checkbox.
 * PK4+: Toggle to display/compare all quantities in grams (using
 *      ingredient-to-grams utility).
 */

import { useEffect, useState, use, useMemo, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/lib/HouseholdContext";
import { toGrams } from "@/lib/ingredient-to-grams";

export default function StockCheckPage({ params }) {
    const { planId } = use(params);
    const supabase   = useMemo(() => createClient(), []);
    const { isPro, activeGroupId } = useHousehold();
    const router = useMemo(() => ({ push: (url) => window.location.assign(url) }), []);

    const [plan, setPlan]               = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);

    // on-hand quantities — session only, keyed by recipe_ingredient id
    const [onHand, setOnHand]           = useState({});
    // manual row confirmation
    const [checked, setChecked]         = useState({});
    // grams toggle
    const [useGrams, setUseGrams]       = useState(false);

    // Plan confirmation
    const [confirming, setConfirming]   = useState(false);
    // PK6: push to order list
    const [generating, setGenerating]   = useState(false);
    const [generated, setGenerated]     = useState(false);
    const [confirmed, setConfirmed]     = useState(false);

    useEffect(() => {
        if (!planId) return;
        loadPlan();
    }, [planId, supabase]);

    const loadPlan = async () => {
        setLoading(true);
        setError(null);

        const { data: planData, error: planErr } = await supabase
            .from("production_plans")
            .select("*, recipes(id, title, servings)")
            .eq("id", planId)
            .single();

        if (planErr || !planData) {
            setError("Plan not found or you don't have access to it.");
            setLoading(false);
            return;
        }

        setPlan(planData);
        setConfirmed(planData.status === "confirmed");

        // Fetch all rows, filter __header__ client-side (PostgREST .neq excludes NULLs — LL-040)
        const { data: ings, error: ingsErr } = await supabase
            .from("recipe_ingredients")
            .select("*")
            .eq("recipe_id", planData.recipe_id)
            .order("sort_order", { ascending: true });

        if (!ingsErr && ings) {
            const filtered = ings.filter(i => i.display_name && i.section !== "__header__");
            setIngredients(filtered);
            initOnHand(filtered, planData, false);
            setChecked({});
        }

        setLoading(false);
    };

    /** Initialise on-hand values for all ingredients in either original unit or grams */
    const initOnHand = useCallback((ings, planData, inGrams) => {
        const scale = planData.planned_servings / (planData.recipes?.servings || planData.planned_servings);
        const prefilled = {};
        ings.forEach(i => {
            if (i.quantity == null) return;
            const req = parseFloat((i.quantity * scale).toFixed(3));
            if (inGrams) {
                const result = toGrams(req, i.unit, i.display_name);
                prefilled[i.id] = result ? String(result.grams) : "";
            } else {
                prefilled[i.id] = String(req);
            }
        });
        setOnHand(prefilled);
    }, []);

    /** Toggle grams mode — reinitialise prefills and clear checked state */
    const handleGramsToggle = () => {
        if (!plan) return;
        const next = !useGrams;
        setUseGrams(next);
        setChecked({});
        initOnHand(ingredients, plan, next);
    };

    const toggleChecked = (id) =>
        setChecked(prev => ({ ...prev, [id]: !prev[id] }));

    /** PK6: push confirmed shortfall rows to the kitchen's shopping list */
    const generateOrderList = async () => {
        const shortfallRows = rows.filter(r => r.hasShortfall);
        if (shortfallRows.length === 0) return;
        setGenerating(true);

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) { setGenerating(false); return; }

        const items = shortfallRows.map(r => ({
            item_name:  r.ing.display_name,
            quantity:   String(r.shortfall % 1 === 0 ? r.shortfall : r.shortfall.toFixed(2)),
            unit:       r.displayUnit,
            group_id:   activeGroupId,
            user_id:    user.id,
            source:     'plan',
            is_checked: false,
        }));

        const { error } = await supabase.from('shopping_list').insert(items);
        setGenerating(false);
        if (!error) {
            setGenerated(true);
            // Navigate to the kitchen's shopping list after a brief moment
            setTimeout(() => window.location.assign('/shopping'), 1200);
        }
    };

    const confirmPlan = async () => {
        setConfirming(true);
        const { error: err } = await supabase
            .from("production_plans")
            .update({ status: "confirmed" })
            .eq("id", planId);
        if (!err) setConfirmed(true);
        setConfirming(false);
    };

    // ── Derived values ────────────────────────────────────────────────────────
    const scaleFactor = plan
        ? plan.planned_servings / (plan.recipes?.servings || plan.planned_servings)
        : 1;

    const rows = ingredients.map(ing => {
        // Required in original unit
        const requiredRaw = ing.quantity != null
            ? parseFloat((ing.quantity * scaleFactor).toFixed(3))
            : null;

        // Required in display unit (grams or original)
        let required = requiredRaw;
        let displayUnit = ing.unit || "";
        let canConvert = true;

        if (useGrams && requiredRaw != null) {
            const result = toGrams(requiredRaw, ing.unit, ing.display_name);
            if (result) {
                required = result.grams;
                displayUnit = "g";
            } else {
                // Can't convert — stay in original unit, mark it
                canConvert = false;
            }
        }

        const available    = parseFloat(onHand[ing.id] ?? "");
        const isTicked     = !!checked[ing.id];
        const shortfall    = isTicked && required != null && !isNaN(available)
            ? Math.max(0, required - available)
            : null;
        const hasShortfall = shortfall != null && shortfall > 0;
        const isCovered    = isTicked && shortfall != null && shortfall === 0;

        return { ing, required, displayUnit, canConvert, available, shortfall, hasShortfall, isCovered, isTicked };
    });

    const tickedCount    = rows.filter(r => r.isTicked).length;
    const coveredCount   = rows.filter(r => r.isCovered).length;
    const shortfallCount = rows.filter(r => r.hasShortfall).length;
    const allTicked      = tickedCount === rows.length && rows.length > 0;

    // ── Design tokens ─────────────────────────────────────────────────────────
    const proAccent = "#00c896";
    const amber     = "#f59e0b";
    const green     = "#2ecc71";

    const cardStyle = {
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "20px",
        padding: "28px",
        marginBottom: "24px",
    };

    const thStyle = {
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        padding: "10px 14px",
        textAlign: "left",
        borderBottom: "1px solid var(--color-divider)",
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (!isPro) {
        return (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <p style={{ color: "var(--color-text-muted)" }}>
                    Production plans are a <strong style={{ color: proAccent }}>Pro Kitchen</strong> feature.
                    Switch to a Pro Kitchen to view this plan.
                </p>
                <Link href="/" style={{ color: proAccent, marginTop: "16px", display: "inline-block" }}>← Back to Library</Link>
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: "60px 20px", textAlign: "center", opacity: 0.5 }}>Loading stock check…</div>;
    }

    if (error || !plan) {
        return (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <p style={{ color: "#ff6b6b" }}>{error || "Plan not found."}</p>
                <Link href="/" style={{ color: proAccent, marginTop: "16px", display: "inline-block" }}>← Back to Library</Link>
            </div>
        );
    }

    const recipe      = plan.recipes;
    const plannedDate = plan.planned_date
        ? new Date(plan.planned_date).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
          })
        : null;

    const fmtQty = (n) => n == null ? "—" : (n % 1 === 0 ? String(n) : n.toFixed(2));

    return (
        <div style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto" }}>

            {/* ── Breadcrumb ── */}
            <nav style={{ marginBottom: "32px" }}>
                <Link href={`/recipe/${recipe?.id}`}
                    style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", textDecoration: "none" }}>
                    ← {recipe?.title || "Recipe"}
                </Link>
            </nav>

            {/* ── Plan header card ── */}
            <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "1.1rem" }}>🍳</span>
                            <span style={{
                                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                                color: proAccent, background: "rgba(0,200,150,0.14)",
                                padding: "2px 8px", borderRadius: "20px",
                            }}>PRO · STOCK CHECK</span>
                            <span style={{
                                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em",
                                color: confirmed ? green : amber,
                                background: confirmed ? "rgba(46,204,113,0.14)" : "rgba(245,158,11,0.14)",
                                padding: "2px 8px", borderRadius: "20px", textTransform: "uppercase",
                            }}>{confirmed ? "Confirmed" : plan.status}</span>
                        </div>
                        <h1 className="font-heading" style={{ fontSize: "2.4rem", margin: 0, lineHeight: 1.1 }}>
                            {recipe?.title}
                        </h1>
                    </div>

                    {!confirmed && (
                        <button onClick={confirmPlan} disabled={confirming} style={{
                            background: confirming ? "rgba(0,200,150,0.4)" : proAccent,
                            border: "none", color: "#0a1a0f", fontWeight: 700,
                            borderRadius: "12px", padding: "10px 22px",
                            cursor: confirming ? "not-allowed" : "pointer",
                            fontSize: "0.9rem", transition: "all 0.2s", whiteSpace: "nowrap",
                        }}>
                            {confirming ? "Confirming…" : "✓ Confirm Plan"}
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "20px" }}>
                    <div>
                        <div className="pp-overline">Planned Servings</div>
                        <div className="font-heading" style={{ fontSize: "1.6rem", color: proAccent }}>
                            {plan.planned_servings}
                            <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "6px" }}>
                                ({scaleFactor.toFixed(2)}× recipe)
                            </span>
                        </div>
                    </div>
                    {plannedDate && (
                        <div>
                            <div className="pp-overline">Date</div>
                            <div style={{ fontSize: "1rem", color: "var(--color-text-papyrus)", marginTop: "4px" }}>{plannedDate}</div>
                        </div>
                    )}
                    {plan.assigned_to && (
                        <div>
                            <div className="pp-overline">Assigned To</div>
                            <div style={{ fontSize: "1rem", color: "var(--color-text-papyrus)", marginTop: "4px" }}>{plan.assigned_to}</div>
                        </div>
                    )}
                    {plan.notes && (
                        <div style={{ flexBasis: "100%" }}>
                            <div className="pp-overline">Notes</div>
                            <div style={{ fontSize: "0.9rem", color: "var(--color-text-papyrus)", marginTop: "4px", fontStyle: "italic" }}>{plan.notes}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PK5: Summary bar ── */}
            {tickedCount > 0 && (
                <div style={{
                    ...cardStyle,
                    display: "flex", gap: "32px", flexWrap: "wrap",
                    background: shortfallCount > 0 ? "rgba(245,158,11,0.06)" : "rgba(46,204,113,0.06)",
                    border: `1px solid ${shortfallCount > 0 ? "rgba(245,158,11,0.3)" : "rgba(46,204,113,0.3)"}`,
                    padding: "20px 28px",
                }}>
                    <div>
                        <div className="pp-overline">Confirmed</div>
                        <div className="font-heading" style={{ fontSize: "1.6rem" }}>{tickedCount} / {rows.length}</div>
                    </div>
                    <div>
                        <div className="pp-overline">In Stock ✓</div>
                        <div className="font-heading" style={{ fontSize: "1.6rem", color: green }}>{coveredCount}</div>
                    </div>
                    <div>
                        <div className="pp-overline">Shortfall ⚠</div>
                        <div className="font-heading" style={{ fontSize: "1.6rem", color: shortfallCount > 0 ? amber : green }}>
                            {shortfallCount}
                        </div>
                    </div>
                    {allTicked && shortfallCount === 0 && (
                        <div style={{ display: "flex", alignItems: "center", color: green, fontWeight: 600, fontSize: "0.95rem" }}>
                            ✓ All ingredients confirmed in stock — ready to cook!
                        </div>
                    )}
                </div>
            )}

            {/* ── Ingredient stock table ── */}
            <div style={cardStyle}>
                {/* Header + grams toggle */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                    <div>
                        <h2 className="font-heading" style={{ fontSize: "1.5rem", margin: "0 0 4px" }}>
                            Ingredient Stock Check
                        </h2>
                        <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: 0 }}>
                            Adjust on-hand qty if below required, then tick ✓ to confirm each line.
                        </p>
                    </div>

                    {/* Grams toggle */}
                    <button
                        onClick={handleGramsToggle}
                        title={useGrams ? "Switch back to recipe units" : "Convert all quantities to grams"}
                        style={{
                            display: "flex", alignItems: "center", gap: "7px",
                            background: useGrams ? "rgba(0,200,150,0.14)" : "var(--color-bg)",
                            border: `1px solid ${useGrams ? proAccent : "var(--color-divider)"}`,
                            color: useGrams ? proAccent : "var(--color-text-muted)",
                            borderRadius: "10px", padding: "8px 16px",
                            cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                            transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
                        }}
                    >
                        <span style={{ fontSize: "1rem" }}>⚖</span>
                        {useGrams ? "Showing grams" : "Show in grams"}
                    </button>
                </div>

                {useGrams && (
                    <div style={{
                        background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.2)",
                        borderRadius: "10px", padding: "8px 14px", marginBottom: "16px",
                        fontSize: "0.78rem", color: "var(--color-text-muted)",
                    }}>
                        ⚖ Quantities converted to grams using density &amp; average weight estimates.
                        Rows marked <strong>?</strong> cannot be converted (e.g. "large" or "to taste") — original unit shown.
                        Switching modes resets your on-hand entries.
                    </div>
                )}

                {ingredients.length === 0 ? (
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>No ingredients found for this recipe.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, width: "36%" }}>Ingredient</th>
                                    <th style={{ ...thStyle, width: "16%", textAlign: "right" }}>
                                        Required {useGrams && <span style={{ color: proAccent }}>(g)</span>}
                                    </th>
                                    <th style={{ ...thStyle, width: "20%", textAlign: "right" }}>
                                        On Hand {useGrams && <span style={{ color: proAccent }}>(g)</span>}
                                    </th>
                                    <th style={{ ...thStyle, width: "16%", textAlign: "right" }}>Shortfall</th>
                                    <th style={{ ...thStyle, width: "12%", textAlign: "center" }}>Confirm</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(({ ing, required, displayUnit, canConvert, shortfall, hasShortfall, isCovered, isTicked }) => (
                                    <tr key={ing.id} style={{
                                        background: !isTicked
                                            ? "transparent"
                                            : hasShortfall
                                                ? "rgba(245,158,11,0.07)"
                                                : "rgba(46,204,113,0.05)",
                                        borderBottom: "1px solid var(--color-divider)",
                                        transition: "background 0.25s",
                                        opacity: isTicked ? 1 : 0.85,
                                    }}>

                                        {/* Ingredient name */}
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ color: "var(--color-text-papyrus)", fontSize: "0.95rem" }}>
                                                {ing.display_name}
                                            </span>
                                            {ing.preparation && (
                                                <span className="pp-hint">
                                                    {ing.preparation}
                                                </span>
                                            )}
                                            {/* Conversion warning */}
                                            {useGrams && !canConvert && (
                                                <span style={{ fontSize: "0.7rem", color: amber, display: "block" }}>
                                                    ? cannot convert
                                                </span>
                                            )}
                                        </td>

                                        {/* Required qty */}
                                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                            {required != null ? (
                                                <span style={{ fontWeight: 600, color: "var(--color-text-papyrus)" }}>
                                                    {fmtQty(required)}{displayUnit ? ` ${displayUnit}` : ""}
                                                </span>
                                            ) : (
                                                <span style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>—</span>
                                            )}
                                        </td>

                                        {/* On-hand input */}
                                        <td style={{ padding: "8px 14px", textAlign: "right" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={onHand[ing.id] ?? ""}
                                                    onChange={e => setOnHand(prev => ({ ...prev, [ing.id]: e.target.value }))}
                                                    style={{
                                                        width: "72px",
                                                        background: "var(--color-bg)",
                                                        border: `1px solid ${
                                                            !isTicked ? "var(--color-divider)" :
                                                            hasShortfall ? amber : green
                                                        }`,
                                                        borderRadius: "8px",
                                                        color: "var(--color-text-papyrus)",
                                                        padding: "6px 10px",
                                                        fontSize: "0.9rem",
                                                        textAlign: "right",
                                                        outline: "none",
                                                        transition: "border-color 0.2s",
                                                    }}
                                                />
                                                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", minWidth: "24px" }}>
                                                    {displayUnit}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Shortfall */}
                                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                            {hasShortfall ? (
                                                <span style={{ color: amber, fontWeight: 700, fontSize: "0.9rem" }}>
                                                    {fmtQty(shortfall)}{displayUnit ? ` ${displayUnit}` : ""}
                                                </span>
                                            ) : isCovered ? (
                                                <span style={{ color: green, fontSize: "0.85rem" }}>✓</span>
                                            ) : (
                                                <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>—</span>
                                            )}
                                        </td>

                                        {/* Confirm checkbox */}
                                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                            <button
                                                onClick={() => toggleChecked(ing.id)}
                                                title={isTicked ? "Mark as unchecked" : "Confirm this ingredient"}
                                                style={{
                                                    width: "28px", height: "28px",
                                                    borderRadius: "8px",
                                                    border: `2px solid ${
                                                        isTicked
                                                            ? hasShortfall ? amber : green
                                                            : "var(--color-divider)"
                                                    }`,
                                                    background: isTicked
                                                        ? hasShortfall ? "rgba(245,158,11,0.18)" : "rgba(46,204,113,0.18)"
                                                        : "transparent",
                                                    cursor: "pointer",
                                                    display: "flex", alignItems: "center",
                                                    justifyContent: "center",
                                                    margin: "0 auto",
                                                    transition: "all 0.18s",
                                                    fontSize: "0.85rem",
                                                    color: isTicked
                                                        ? hasShortfall ? amber : green
                                                        : "transparent",
                                                }}
                                            >
                                                {isTicked ? (hasShortfall ? "!" : "✓") : ""}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "20px", opacity: 0.7 }}>
                    ⓘ On-hand quantities are not saved — they reset when you leave this page.
                </p>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingBottom: "60px" }}>
                <Link href={`/recipe/${recipe?.id}`} style={{
                    background: "none", border: "1px solid var(--color-divider)",
                    color: "var(--color-text-muted)", borderRadius: "12px",
                    padding: "10px 22px", textDecoration: "none", fontSize: "0.9rem",
                }}>
                    ← Back to Recipe
                </Link>
                <button
                    onClick={generateOrderList}
                    disabled={generating || generated || shortfallCount === 0}
                    title={shortfallCount === 0 ? "No shortfalls to order" : `Add ${shortfallCount} shortfall item${shortfallCount > 1 ? 's' : ''} to kitchen order list`}
                    style={{
                        background: generated
                            ? "rgba(46,204,113,0.14)"
                            : shortfallCount === 0
                                ? "rgba(0,200,150,0.06)"
                                : "rgba(0,200,150,0.14)",
                        border: `1px solid ${generated ? "rgba(46,204,113,0.4)" : shortfallCount === 0 ? "rgba(0,200,150,0.15)" : "rgba(0,200,150,0.4)"}`,
                        color: generated ? green : shortfallCount === 0 ? "rgba(0,200,150,0.35)" : proAccent,
                        borderRadius: "12px", padding: "10px 22px",
                        cursor: (generating || generated || shortfallCount === 0) ? "not-allowed" : "pointer",
                        fontSize: "0.9rem", fontWeight: 600,
                        transition: "all 0.2s",
                    }}
                >
                    {generated ? "✓ Added to Order List" : generating ? "Adding…" : `Add ${shortfallCount > 0 ? shortfallCount + ' item' + (shortfallCount > 1 ? 's' : '') + ' to' : 'to'} Order List →`}
                </button>
            </div>
        </div>
    );
}
