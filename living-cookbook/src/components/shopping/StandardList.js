import { displayUnit, estimateIngredientPrice } from "@/lib/recipe-utils";
import { Icon } from "@/components/icons";
import ClearButton from "@/components/shopping/ClearButton";

/**
 * StandardList — household / personal shopping list view.
 * Shows items as a single checklist with optional "move to another list" action.
 * Extracted from shopping/page.js (B10).
 */
export default function StandardList({
    displayItems, tabs, viewGroupId,
    onToggle, onDelete, onReassign,
    reassigningId, setReassigningId,
    onClear, activeViewLabel,
}) {
    return (
        <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-divider)",
            borderRadius: "16px",
            marginBottom: "16px",
            overflow: "hidden",
        }}>
            {/* Header strip */}
            <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 20px",
                background: "rgba(235,220,178,0.03)",
                borderBottom: "1px solid var(--color-divider)",
            }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-accent-amber)", flex: 1 }}>
                    {Icon.cart} {activeViewLabel}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {displayItems.length} {displayItems.length === 1 ? "item" : "items"}
                </span>
                <ClearButton onClear={onClear} label={activeViewLabel} />
            </div>

            {/* Item list */}
            <ul className="ingredients-list" style={{ margin: 0, padding: "0 24px" }}>
                {displayItems.map((item, idx) => (
                    <li key={idx}
                        className={`ingredient-item ${item.original_items.every(i => i.is_checked) ? "checked" : ""}`}
                        onClick={() => { if (reassigningId !== null) return; onToggle(item); }}
                        style={{ padding: "18px 0", borderBottom: idx === displayItems.length - 1 ? "none" : "1px solid rgba(235,220,178,0.05)", cursor: "pointer" }}
                    >
                        <div className="checkbox" style={{
                            width: "24px", height: "24px",
                            background: item.original_items.every(i => i.is_checked) ? "var(--color-accent)" : "transparent",
                            border: "2px solid var(--color-accent)", borderRadius: "6px",
                        }} />
                        <span className="ingredient-text" style={{ fontSize: "1.2rem", flex: 1, marginLeft: "15px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <strong style={{ opacity: 0.9 }}>{item.qty || ""} {displayUnit(item.qty, item.unit)}</strong>
                            <span>{item.item_name}</span>
                            {estimateIngredientPrice(item.item_name, item.qty, item.unit) && (
                                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", opacity: 0.6 }}>
                                    · ${estimateIngredientPrice(item.item_name, item.qty, item.unit).toFixed(2)}
                                </span>
                            )}
                        </span>
                        {tabs.length > 1 && (
                            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                                {reassigningId === item.item_name ? (
                                    <select autoFocus onBlur={() => setReassigningId(null)} onChange={e => onReassign(item, e.target.value)} defaultValue=""
                                        style={{ background: "var(--color-surface)", border: "1px solid var(--color-accent-amber)", borderRadius: "8px", color: "var(--color-text-papyrus)", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", outline: "none" }}>
                                        <option value="" disabled>Move to…</option>
                                        {tabs.filter(t => t.id !== viewGroupId).map(t => (
                                            <option key={t.id} value={t.id}>{t.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <button onClick={() => setReassigningId(item.item_name)} title="Move to another list"
                                        style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "0 6px", fontSize: "1rem", opacity: 0.5 }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                        onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>⇄</button>
                                )}
                            </div>
                        )}
                        <button onClick={e => { e.stopPropagation(); onDelete(item); }}
                            style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.4rem", padding: "0 10px", cursor: "pointer" }}
                            onMouseEnter={e => e.target.style.color = "#ff6b6b"}
                            onMouseLeave={e => e.target.style.color = "var(--color-text-muted)"}>{Icon.x}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
