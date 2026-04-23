"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * RecipeVersionHistory — shows the owner a chronological list of saved versions.
 * Each version card shows the version number, date, and an optional change note.
 * Clicking a version fetches the full JSONB snapshot and renders a read-only modal.
 * 
 * Props:
 *   versions  — array of { id, version_number, saved_at, change_note } (no snapshot — fetched on demand)
 *   recipeId  — used to fetch snapshot on click
 */

export default function RecipeVersionHistory({ versions = [], recipeId }) {
    const [open, setOpen]           = useState(false);
    const [activeSnap, setActiveSnap] = useState(null); // { version_number, saved_at, snapshot }
    const [loading, setLoading]     = useState(false);
    const supabase = useState(() => createClient())[0];

    if (versions.length === 0) return null;

    const fmtDate = (iso) => {
        const d = new Date(iso);
        const now = new Date();
        const diffDays = Math.floor((now - d) / 86400000);
        if (diffDays === 0) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (diffDays === 1) return `Yesterday`;
        if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'long' });
        return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: diffDays > 365 ? 'numeric' : undefined });
    };

    const handleViewVersion = async (v) => {
        setLoading(true);
        const { data } = await supabase
            .from("recipe_versions")
            .select("snapshot")
            .eq("id", v.id)
            .single();
        setLoading(false);
        if (data) setActiveSnap({ ...v, snapshot: data.snapshot });
    };

    const snap = activeSnap?.snapshot;

    return (
        <>
            {/* ── Collapsible trigger ── */}
            <div
                style={{
                    borderTop: '1px solid var(--color-hairline)',
                    paddingTop: '16px',
                    marginTop: '12px',
                }}
            >
                <button
                    onClick={() => setOpen(o => !o)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', background: 'none', border: 'none',
                        cursor: 'pointer', padding: 0,
                    }}
                >
                    <span className="pp-overline">Version History · {versions.length}</span>
                    <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="var(--color-on-surface-muted)" strokeWidth="2"
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    >
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>

                {open && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {versions.map((v, i) => (
                            <div
                                key={v.id}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    background: i === 0 ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '8px',
                                    gap: '8px',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{
                                        fontSize: '0.78rem', fontWeight: 700,
                                        color: i === 0 ? 'var(--color-accent-amber)' : 'var(--color-on-surface-muted)',
                                        marginRight: '8px',
                                    }}>
                                        v{v.version_number}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-muted)' }}>
                                        {fmtDate(v.saved_at)}
                                        {v.change_note && ` · "${v.change_note}"`}
                                    </span>
                                    {i === 0 && (
                                        <span style={{
                                            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                                            color: 'var(--color-accent-amber)', marginLeft: '8px',
                                            textTransform: 'uppercase',
                                        }}>current</span>
                                    )}
                                </div>
                                {i > 0 && (
                                    <button
                                        onClick={() => handleViewVersion(v)}
                                        style={{
                                            fontSize: '0.72rem', padding: '4px 10px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px', cursor: 'pointer',
                                            color: 'var(--color-on-surface)',
                                            whiteSpace: 'nowrap', flexShrink: 0,
                                        }}
                                    >
                                        View
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Snapshot modal ── */}
            {(activeSnap || loading) && (
                <div
                    onClick={() => setActiveSnap(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(6px)', zIndex: 9000,
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        padding: '0',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '560px', maxHeight: '80vh',
                            background: 'var(--color-surface)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px 20px 0 0',
                            padding: '28px 24px',
                            overflowY: 'auto',
                        }}
                    >
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-on-surface-muted)' }}>
                                Loading snapshot…
                            </div>
                        ) : snap && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <span className="pp-overline">v{activeSnap.version_number} · {fmtDate(activeSnap.saved_at)}</span>
                                        <h2 className="font-heading" style={{ fontSize: '1.3rem', marginTop: '4px' }}>
                                            {snap.title}
                                        </h2>
                                    </div>
                                    <button onClick={() => setActiveSnap(null)} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-on-surface-muted)', fontSize: '1.4rem', lineHeight: 1,
                                    }}>✕</button>
                                </div>

                                {/* Meta */}
                                <p style={{ fontSize: '0.82rem', color: 'var(--color-on-surface-muted)', marginBottom: '16px' }}>
                                    {snap.prep_time_minutes || 0} min prep · {snap.cook_time_minutes || 0} min cook · {snap.servings} servings
                                </p>

                                {/* Source */}
                                {snap.source?.book_title && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-muted)', marginBottom: '16px', fontStyle: 'italic' }}>
                                        From: {snap.source.book_title}{snap.source.author ? ` by ${snap.source.author}` : ''}{snap.source.page_number ? ` p.${snap.source.page_number}` : ''}
                                    </p>
                                )}

                                {/* Ingredients */}
                                {snap.ingredients?.length > 0 && (
                                    <section style={{ marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)', marginBottom: '8px' }}>
                                            Ingredients
                                        </h3>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {snap.ingredients.map((ing, i) => (
                                                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--color-on-surface)' }}>
                                                    {[ing.qty, ing.unit, ing.name, ing.prep && `(${ing.prep})`].filter(Boolean).join(' ')}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Steps */}
                                {snap.steps?.length > 0 && (
                                    <section>
                                        <h3 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)', marginBottom: '8px' }}>
                                            Method
                                        </h3>
                                        <ol style={{ padding: '0 0 0 20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {snap.steps.map((s, i) => (
                                                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--color-on-surface)', lineHeight: 1.6 }}>{s}</li>
                                            ))}
                                        </ol>
                                    </section>
                                )}

                                <p style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-muted)', marginTop: '24px', fontStyle: 'italic' }}>
                                    This is a read-only snapshot. Restore from version history coming soon.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
