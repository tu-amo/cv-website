"use client";

import { useState } from "react";
import { displayUnit } from "@/lib/recipe-utils";
import { fmtTs } from "@/lib/shopping-utils";
import { Icon } from "@/components/icons";
import ClearButton from "@/components/shopping/ClearButton";

const proAccent = "#00c896";
const amber     = "#f59e0b";
const green     = "#2ecc71";

/**
 * ProKitchenList — Pro Kitchen shopping view (PK7–PK9).
 * Groups items by supplier order. Unassigned items shown at the top.
 * Extracted from shopping/page.js (B10).
 */
export default function ProKitchenList({
    displayItems, originalItems, supplierOrders,
    tabs, viewGroupId, onToggle, onDelete,
    onAssignSupplier, onSetOrderDate, onMarkSent, onClearSent, onCopyOrder, onDownloadPDF,
    onReassign, reassigningId, setReassigningId,
    activeGroup, onClear, activeViewLabel,
}) {
    const [assigningId, setAssigningId]     = useState(null);
    const [supplierInput, setSupplierInput] = useState("");

    const unassigned = displayItems.filter(item =>
        item.original_items.every(i => !i.supplier_order_id)
    );
    const orderGroups = supplierOrders.map(order => ({
        order,
        items: displayItems.filter(item =>
            item.original_items.some(i => i.supplier_order_id === order.id)
        ),
    })).filter(g => g.items.length > 0);

    const handleAssign = (item) => {
        const itemIds = item.original_items.map(i => i.id);
        onAssignSupplier(itemIds, supplierInput);
        setAssigningId(null);
        setSupplierInput("");
    };

    const supplierNames = [...new Set(supplierOrders.map(o => o.supplier_name))];

    return (
        <div>
            {/* ── Unassigned items ── */}
            {unassigned.length > 0 && (
                <div style={{
                    background: "var(--color-surface)", border: "1px solid var(--color-divider)",
                    borderRadius: "16px", padding: "16px 24px", marginBottom: "16px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                            Unassigned ({unassigned.length})
                        </span>
                    </div>
                    <ul className="ingredients-list" style={{ margin: 0 }}>
                        {unassigned.map((item, idx) => (
                            <ProItem key={idx} item={item} last={idx === unassigned.length - 1}
                                onToggle={onToggle} onDelete={onDelete}
                                assigningId={assigningId} setAssigningId={setAssigningId}
                                supplierInput={supplierInput} setSupplierInput={setSupplierInput}
                                supplierNames={supplierNames}
                                onAssign={handleAssign}
                                tabs={tabs} viewGroupId={viewGroupId}
                                onReassign={onReassign} reassigningId={reassigningId} setReassigningId={setReassigningId}
                            />
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Supplier order groups ── */}
            {orderGroups.map(({ order, items }) => (
                <SupplierOrderCard key={order.id}
                    order={order} items={items}
                    tabs={tabs} viewGroupId={viewGroupId}
                    onToggle={onToggle} onDelete={onDelete}
                    onSetOrderDate={onSetOrderDate}
                    onMarkSent={onMarkSent} onClearSent={onClearSent}
                    onCopyOrder={onCopyOrder} onDownloadPDF={onDownloadPDF}
                    onAssignSupplier={onAssignSupplier}
                    assigningId={assigningId} setAssigningId={setAssigningId}
                    supplierInput={supplierInput} setSupplierInput={setSupplierInput}
                    supplierNames={supplierNames}
                    onAssign={handleAssign}
                    onReassign={onReassign} reassigningId={reassigningId} setReassigningId={setReassigningId}
                    activeGroup={activeGroup}
                />
            ))}

            <ClearButton onClear={onClear} label={activeViewLabel} />
        </div>
    );
}

// ── Supplier order card ───────────────────────────────────────────────────────
function SupplierOrderCard({
    order, items, tabs, viewGroupId,
    onToggle, onDelete, onSetOrderDate, onMarkSent, onClearSent, onCopyOrder, onDownloadPDF,
    assigningId, setAssigningId, supplierInput, setSupplierInput, supplierNames, onAssign,
    onReassign, reassigningId, setReassigningId, activeGroup,
}) {
    const isSent  = !!order.ordered_at;
    const allDone = items.length > 0 && items.every(item => item.original_items.every(i => i.is_checked));

    return (
        <div style={{
            background: "var(--color-surface)",
            border: `1px solid ${isSent ? "rgba(46,204,113,0.3)" : order.order_date ? "rgba(0,200,150,0.25)" : "var(--color-divider)"}`,
            borderRadius: "16px", marginBottom: "16px", overflow: "hidden",
        }}>
            {/* Card header */}
            <div style={{
                display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px",
                padding: "14px 20px",
                background: isSent ? "rgba(46,204,113,0.05)" : "rgba(0,200,150,0.04)",
                borderBottom: "1px solid var(--color-divider)",
            }}>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: proAccent, flex: 1 }}>
                    {Icon.store} {order.supplier_name}
                </span>

                {/* Order date (PK8) */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="pp-overline">Order by</span>
                    <input type="date" value={order.order_date || ""}
                        onChange={e => onSetOrderDate(order.id, e.target.value)}
                        style={{
                            background: "var(--color-bg)", border: "1px solid var(--color-divider)",
                            borderRadius: "8px", color: order.order_date ? proAccent : "var(--color-text-muted)",
                            padding: "4px 8px", fontSize: "0.8rem", outline: "none", cursor: "pointer",
                        }}
                    />
                </div>

                {/* Copy & PDF */}
                <button onClick={() => onCopyOrder(order, items)}
                    title="Copy order as email text"
                    style={{
                        background: "none", border: "1px solid var(--color-divider)",
                        color: "var(--color-text-muted)", borderRadius: "8px",
                        padding: "4px 12px", cursor: "pointer", fontSize: "0.78rem", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = proAccent; e.currentTarget.style.color = proAccent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-divider)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
                >
                    {Icon.clipboard} Copy
                </button>
                <button onClick={() => onDownloadPDF(order, items)}
                    title="Download as PDF"
                    style={{
                        background: "none", border: "1px solid var(--color-divider)",
                        color: "var(--color-text-muted)", borderRadius: "8px",
                        padding: "4px 12px", cursor: "pointer", fontSize: "0.78rem", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = amber; e.currentTarget.style.color = amber; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-divider)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
                >
                    {Icon.file} PDF
                </button>

                {/* Mark sent / sent status (PK9) */}
                {isSent ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.78rem", color: green, fontWeight: 600 }}>
                            ✓ Sent {fmtTs(order.ordered_at)}
                        </span>
                        <button onClick={() => onClearSent(order.id)}
                            title="Clear sent status"
                            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.75rem", padding: "2px 6px" }}
                        >Resend</button>
                    </div>
                ) : (
                    <button onClick={() => onMarkSent(order.id)}
                        style={{
                            background: "rgba(0,200,150,0.14)", border: "1px solid rgba(0,200,150,0.35)",
                            color: proAccent, borderRadius: "8px",
                            padding: "5px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,200,150,0.25)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(0,200,150,0.14)"}
                    >
                        Mark as Sent →
                    </button>
                )}
            </div>

            {/* Items */}
            <ul className="ingredients-list" style={{ margin: 0, padding: "0 24px" }}>
                {items.map((item, idx) => (
                    <ProItem key={idx} item={item} last={idx === items.length - 1}
                        onToggle={onToggle} onDelete={onDelete}
                        assigningId={assigningId} setAssigningId={setAssigningId}
                        supplierInput={supplierInput} setSupplierInput={setSupplierInput}
                        supplierNames={supplierNames} onAssign={onAssign}
                        tabs={tabs} viewGroupId={viewGroupId}
                        onReassign={onReassign} reassigningId={reassigningId} setReassigningId={setReassigningId}
                        currentOrderId={order.id}
                    />
                ))}
            </ul>
        </div>
    );
}

// ── Single item row (Pro view) ─────────────────────────────────────────────────
function ProItem({
    item, last, onToggle, onDelete,
    assigningId, setAssigningId, supplierInput, setSupplierInput,
    supplierNames, onAssign,
    tabs, viewGroupId, onReassign, reassigningId, setReassigningId,
    currentOrderId,
}) {
    const isChecked  = item.original_items.every(i => i.is_checked);
    const isFromPlan = item.original_items.some(i => i.source === "plan");

    return (
        <li style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 0",
            borderBottom: last ? "none" : "1px solid rgba(235,220,178,0.05)",
            opacity: isChecked ? 0.5 : 1,
            cursor: "pointer", transition: "opacity 0.2s",
        }} onClick={() => { if (assigningId || reassigningId) return; onToggle(item); }}>

            {/* Checkbox */}
            <div style={{
                width: "22px", height: "22px", flexShrink: 0,
                background: isChecked ? "var(--color-accent)" : "transparent",
                border: "2px solid var(--color-accent)", borderRadius: "6px",
            }} />

            {/* Name + badges */}
            <span style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "1rem" }}>
                <strong style={{ opacity: 0.9 }}>{item.qty || ""} {displayUnit(item.qty, item.unit)}</strong>
                <span style={{ textDecoration: isChecked ? "line-through" : "none" }}>{item.item_name}</span>
                {isFromPlan && (
                    <span style={{
                        fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em",
                        color: proAccent, background: "rgba(0,200,150,0.14)",
                        padding: "1px 6px", borderRadius: "10px", textTransform: "uppercase",
                    }}>{Icon.plan} From Plan</span>
                )}
            </span>

            {/* Assign supplier (PK7) */}
            <div onClick={e => e.stopPropagation()}>
                {assigningId === item.item_name ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <input
                            list="supplier-options"
                            autoFocus
                            placeholder="Supplier name…"
                            value={supplierInput}
                            onChange={e => setSupplierInput(e.target.value)}
                            onBlur={() => { if (!supplierInput) setAssigningId(null); }}
                            onKeyDown={e => {
                                if (e.key === "Enter") onAssign(item);
                                if (e.key === "Escape") { setAssigningId(null); setSupplierInput(""); }
                            }}
                            style={{
                                background: "var(--color-bg)", border: `1px solid ${proAccent}`,
                                borderRadius: "8px", color: "var(--color-text-papyrus)",
                                padding: "4px 10px", fontSize: "0.82rem", outline: "none", width: "140px",
                            }}
                        />
                        <datalist id="supplier-options">
                            {supplierNames.map(n => <option key={n} value={n} />)}
                        </datalist>
                        <button onClick={() => onAssign(item)}
                            style={{ background: proAccent, border: "none", color: "#0a1a0f", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>
                            ✓
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => { setAssigningId(item.item_name); setSupplierInput(""); }}
                        title={currentOrderId ? "Reassign supplier" : "Assign to supplier"}
                        style={{
                            background: "none", border: "1px solid var(--color-divider)",
                            color: "var(--color-text-muted)", borderRadius: "8px",
                            padding: "3px 10px", cursor: "pointer", fontSize: "0.75rem", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = proAccent; e.currentTarget.style.color = proAccent; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-divider)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
                    >
                        {currentOrderId ? "⇄ supplier" : "+ supplier"}
                    </button>
                )}
            </div>

            {/* Delete */}
            <button onClick={e => { e.stopPropagation(); onDelete(item); }}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.2rem", padding: "0 6px", cursor: "pointer" }}
                onMouseEnter={e => e.target.style.color = "#ff6b6b"}
                onMouseLeave={e => e.target.style.color = "var(--color-text-muted)"}>{Icon.x}</button>
        </li>
    );
}
