"use client";

/**
 * PlanProductionModal — PK2
 *
 * Opens when a Pro Kitchen member clicks "Plan Production" on a recipe detail page.
 * Captures planned servings, date, and optional team member assignment, then
 * inserts a row into production_plans and forwards the user to the stock check.
 *
 * Props:
 *   recipe       — { id, title, servings } from the parent page
 *   groupId      — activeGroupId from HouseholdContext
 *   onClose      — () => void — dismiss the modal
 *   onCreated    — (plan) => void — called after successful INSERT
 */

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PlanProductionModal({ recipe, groupId, onClose, onCreated }) {
    const supabase = useMemo(() => createClient(), []);

    const [servings, setServings]     = useState(recipe?.servings || 1);
    const [date, setDate]             = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [notes, setNotes]           = useState("");
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setError(null);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            setError("Session unavailable — please refresh and try again.");
            setSaving(false);
            return;
        }

        const { data: plan, error: insertError } = await supabase
            .from("production_plans")
            .insert([{
                recipe_id:        recipe.id,
                group_id:         groupId,
                planned_servings: Number(servings),
                planned_date:     date || null,
                assigned_to:      assignedTo.trim() || null,
                notes:            notes.trim() || null,
                status:           "draft",
                created_by:       user.id,
            }])
            .select()
            .single();

        if (insertError) {
            setError("Failed to create plan. Please try again.");
            setSaving(false);
            return;
        }

        onCreated(plan);
    };

    // ── Styles ─────────────────────────────────────────────────────────────
    const overlayStyle = {
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
    };
    const modalStyle = {
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "24px",
        padding: "36px",
        width: "100%",
        maxWidth: "480px",
        position: "relative",
    };
    const labelStyle = {
        display: "block",
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "var(--color-text-muted)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: "8px",
    };
    const fieldWrap = { marginBottom: "20px" };
    const proAccent = "#00c896";

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>

                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: "16px", right: "20px",
                        background: "none", border: "none",
                        color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.3rem",
                    }}
                    aria-label="Close"
                >×</button>

                {/* Header */}
                <div style={{ marginBottom: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "1.3rem" }}>🍳</span>
                        <span style={{
                            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                            color: proAccent, background: "rgba(0,200,150,0.14)",
                            padding: "2px 8px", borderRadius: "20px",
                        }}>PRO</span>
                    </div>
                    <h2 className="font-heading" style={{ fontSize: "1.8rem", margin: 0 }}>
                        Plan Production
                    </h2>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "6px" }}>
                        {recipe?.title}
                    </p>
                </div>

                {error && (
                    <div style={{
                        color: "#ff6b6b", background: "rgba(255,107,107,0.1)",
                        padding: "12px 16px", borderRadius: "10px", marginBottom: "20px",
                        fontSize: "0.88rem",
                    }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* Planned Servings */}
                    <div style={fieldWrap}>
                        <label style={labelStyle} htmlFor="pk-servings">Planned Servings</label>
                        <input
                            id="pk-servings"
                            type="number"
                            min="1"
                            max="9999"
                            className="form-control"
                            value={servings}
                            onChange={e => setServings(e.target.value)}
                            required
                        />
                        {recipe?.servings && (
                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "5px" }}>
                                Recipe default: {recipe.servings} · Scale factor:{" "}
                                <strong style={{ color: proAccent }}>
                                    {(servings / recipe.servings).toFixed(2)}×
                                </strong>
                            </p>
                        )}
                    </div>

                    {/* Planned Date */}
                    <div style={fieldWrap}>
                        <label style={labelStyle} htmlFor="pk-date">Planned Date <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                        <input
                            id="pk-date"
                            type="date"
                            className="form-control"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={{ colorScheme: "dark" }}
                        />
                    </div>

                    {/* Assigned To */}
                    <div style={fieldWrap}>
                        <label style={labelStyle} htmlFor="pk-assigned">Assigned To <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                        <input
                            id="pk-assigned"
                            type="text"
                            placeholder="e.g. Chef Marco"
                            className="form-control"
                            value={assignedTo}
                            onChange={e => setAssignedTo(e.target.value)}
                            maxLength={100}
                        />
                    </div>

                    {/* Notes */}
                    <div style={fieldWrap}>
                        <label style={labelStyle} htmlFor="pk-notes">Notes <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                        <textarea
                            id="pk-notes"
                            placeholder="e.g. Double the sauce, use organic flour"
                            className="form-control"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            style={{ resize: "vertical" }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: "none",
                                border: "1px solid var(--color-divider)",
                                color: "var(--color-text-muted)",
                                borderRadius: "10px",
                                padding: "10px 20px",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                background: saving ? "rgba(0,200,150,0.4)" : proAccent,
                                border: "none",
                                color: "#0a1a0f",
                                fontWeight: 700,
                                borderRadius: "10px",
                                padding: "10px 24px",
                                cursor: saving ? "not-allowed" : "pointer",
                                fontSize: "0.9rem",
                                transition: "all 0.2s",
                            }}
                        >
                            {saving ? "Creating…" : "Start Stock Check →"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
