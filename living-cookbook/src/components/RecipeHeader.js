"use client";

import Link from "next/link";

export default function RecipeHeader({ recipe, currentServings, onServingsChange, children }) {
    if (!recipe) return null;

    return (
        <header className="cooking-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
                <div className="cooking-reference" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {recipe.sources && (
                        <span style={{ fontWeight: 600, color: "var(--color-accent-amber)" }}>
                            {recipe.sources.book_title || "Unknown Source"}{recipe.page_number ? ` (p. ${recipe.page_number})` : ""}
                        </span>
                    )}
                    {recipe.sources?.author && (
                        <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>by {recipe.sources.author}</span>
                    )}
                    {recipe.updated_by_profile?.display_name && (
                        <span style={{ fontSize: "0.75rem", opacity: 0.4, fontStyle: "italic", marginTop: "4px" }}>
                            Last modified by {recipe.updated_by_profile.display_name}
                        </span>
                    )}
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button onClick={() => window.print()} className="btn-scan" style={{ fontSize: "0.9rem", padding: "8px 16px", background: "rgba(235, 220, 178, 0.05)", borderStyle: "solid", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                        Print
                    </button>
                    <Link href="/shopping" className="btn-scan" style={{ fontSize: "0.9rem", padding: "8px 16px", background: "rgba(235, 220, 178, 0.05)", textDecoration: "none", borderStyle: "solid", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                        Market List
                    </Link>
                    {children}
                </div>
            </div>

            <h1 className="cooking-title font-heading">{recipe.title}</h1>

            <div className="cooking-meta-row" style={{ marginTop: "20px", alignItems: "center" }}>
                <span><strong>Prep:</strong> {recipe.prep_time_minutes || 0} mins</span>
                <span><strong>Cook:</strong> {recipe.cook_time_minutes || 0} mins</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <strong>Serves:</strong>
                    <div style={{ display: "flex", alignItems: "center", background: "var(--color-surface)", borderRadius: "20px", padding: "2px 8px", border: "1px solid var(--color-divider)" }}>
                        <button onClick={() => onServingsChange(Math.max(1, currentServings - 1))} style={{ fontSize: "1.2rem", padding: "0 8px", color: "var(--color-accent-amber)" }}>−</button>
                        <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "600" }}>{currentServings}</span>
                        <button onClick={() => onServingsChange(currentServings + 1)} style={{ fontSize: "1.2rem", padding: "0 8px", color: "var(--color-accent-amber)" }}>+</button>
                    </div>
                </div>
            </div>
        </header>
    );
}
