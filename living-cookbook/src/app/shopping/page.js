"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { aggregateShoppingList, displayUnit, estimateIngredientPrice, calculateListBudget } from "@/lib/recipe-utils";
import { useHousehold } from "@/lib/HouseholdContext";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a date for display */
function fmtDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Format a timestamp for display */
function fmtTs(ts) {
    if (!ts) return null;
    return new Date(ts).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Group shopping list items by supplier_order_id */
function groupByOrder(items, orders) {
    const orderMap = Object.fromEntries(orders.map(o => [o.id, o]));
    const groups = {};

    for (const item of items) {
        const key = item.supplier_order_id || "__unassigned__";
        if (!groups[key]) groups[key] = { order: orderMap[key] || null, items: [] };
        groups[key].items.push(item);
    }

    return groups;
}

/** Build clipboard text for a supplier order */
function buildOrderText(order, items, listLabel, userName, profile) {
    const co      = profile?.company_name ? `${profile.company_name}` : listLabel;
    const header  = `🍳 *${co} — Order for ${order?.supplier_name || "Supplier"}*`;
    const dateStr = order?.order_date ? `\nOrder date: ${fmtDate(order.order_date)}` : "";
    const addr    = profile?.company_address ? `\n${profile.company_address}` : "";
    const by      = userName ? `\nPrepared by: ${userName}${profile?.contact_email ? ` <${profile.contact_email}>` : ""}` : "";
    const lines   = items.map(i => `• ${i.qty || ""} ${i.unit || ""} ${i.item_name}`.trim()).join("\n");
    return `${header}${addr}${dateStr}${by}\n\n${lines}\n\n🔗 Living Cookbook: https://living-cookbook.vercel.app/shopping`;
}

/** Open a print-to-PDF window for a supplier order */
function downloadOrderPDF(order, items, listLabel, userName, profile) {
    const dateStr      = order?.order_date ? fmtDate(order.order_date) : "";
    const generatedOn  = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const companyName  = profile?.company_name  || listLabel;
    const companyAddr  = profile?.company_address || "";
    const contactEmail = profile?.contact_email || "";
    const itemRows = items
        .map(i => `<tr><td>${i.item_name}</td><td style="text-align:right;white-space:nowrap">${i.qty || ""} ${i.unit || ""}</td></tr>`)
        .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order — ${order?.supplier_name || "Supplier"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Arial', sans-serif; max-width: 620px; margin: 48px auto; color: #1a1a1a; font-size: 14px; }
    .company { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 6px; }
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 16px; }
    .meta { color: #555; font-size: 13px; line-height: 1.8; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid #1a1a1a; }
    .meta-addr { font-size: 12px; color: #777; white-space: pre-line; }
    table { width: 100%; border-collapse: collapse; }
    thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 0; border-bottom: 1px solid #ccc; color: #666; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 9px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .footer { margin-top: 36px; font-size: 11px; color: #aaa; text-align: center; }
    @media print { body { margin: 20mm; } }
  </style>
</head>
<body>
  <div class="company">${companyName}</div>
  <h1>Order — ${order?.supplier_name || "Supplier"}</h1>
  <div class="meta">
    ${companyAddr ? `<div class="meta-addr">${companyAddr}</div>` : ""}
    ${dateStr ? `Order date: <strong>${dateStr}</strong><br>` : ""}
    Prepared by: <strong>${userName || "Kitchen team"}</strong>${contactEmail ? ` &lt;${contactEmail}&gt;` : ""}<br>
    Generated: ${generatedOn}
  </div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="footer">Living Cookbook &mdash; living-cookbook.vercel.app</div>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const proAccent = "#00c896";
const amber = "#f59e0b";
const green = "#2ecc71";

// ── Main component ────────────────────────────────────────────────────────────
export default function ShoppingListPage() {
    const supabase = useMemo(() => createClient(), []);
    const { groups, activeGroupId, activeGroup, isPro } = useHousehold();

    const [viewGroupId, setViewGroupId]       = useState("");
    const [originalItems, setOriginalItems]   = useState([]);
    const [displayItems, setDisplayItems]     = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [groupProfile, setGroupProfile]     = useState(null); // PKP3/PKP4
    const [loading, setLoading]               = useState(true);
    const [toast, setToast]                   = useState(null);
    const [newItem, setNewItem]               = useState({ name: "", qty: "", unit: "" });
    const [isAdding, setIsAdding]             = useState(false);
    const [reassigningId, setReassigningId]   = useState(null);
    const [userName, setUserName]             = useState(""); // for order attribution

    // Track the group type of the currently viewed tab
    const viewGroup = groups.find(g => g.id === viewGroupId);
    const isProView = viewGroup?.group_type === "pro_kitchen";

    useEffect(() => { setViewGroupId(activeGroupId ?? ""); }, [activeGroupId]);
    useEffect(() => { loadItems(); }, [viewGroupId]);

    // Load current user's display name for order attribution
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
                .then(({ data }) => setUserName(data?.display_name || user.email?.split("@")[0] || ""));
        });
    }, []);

    const loadItems = async () => {
        setLoading(true);
        let q = supabase.from("shopping_list").select("*").order("created_at", { ascending: false });
        if (viewGroupId) {
            q = q.eq("group_id", viewGroupId);
        } else {
            q = q.is("group_id", null);
        }
        const { data, error } = await q;
        if (!error && data) {
            setOriginalItems(data);
            setDisplayItems(aggregateShoppingList(data));
        }

        // Load supplier orders + group profile for pro kitchen views
        if (viewGroupId) {
            const [{ data: orders }, { data: grp }] = await Promise.all([
                supabase.from("supplier_orders").select("*").eq("group_id", viewGroupId)
                    .order("order_date", { ascending: true, nullsFirst: false }),
                supabase.from("groups").select("company_name,company_address,contact_email").eq("id", viewGroupId).single(),
            ]);
            setSupplierOrders(orders || []);
            setGroupProfile(grp || null);
        } else {
            setSupplierOrders([]);
            setGroupProfile(null);
        }

        setLoading(false);
    };

    // ── Standard list actions ─────────────────────────────────────────────────

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.name) return;
        setIsAdding(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("shopping_list").insert([{
            item_name: newItem.name,
            quantity: newItem.qty || "1",
            unit: newItem.unit || "",
            is_checked: false,
            user_id: user.id,
            group_id: viewGroupId || null,
            source: "manual",
        }]).select().single();
        setIsAdding(false);
        if (!error) {
            const updated = [data, ...originalItems];
            setOriginalItems(updated);
            setDisplayItems(aggregateShoppingList(updated));
            setNewItem({ name: "", qty: "", unit: "" });
            showToast("Added to list! 🛒");
        }
    };

    const reassignItem = async (aggregatedItem, newGroupId) => {
        setReassigningId(null);
        const idsToMove = aggregatedItem.original_items.map(i => i.id);
        const { error } = await supabase.from("shopping_list").update({ group_id: newGroupId || null }).in("id", idsToMove);
        if (!error) {
            const updated = originalItems.filter(item => !idsToMove.includes(item.id));
            setOriginalItems(updated);
            setDisplayItems(aggregateShoppingList(updated));
            const targetLabel = newGroupId ? (groups.find(g => g.id === newGroupId)?.name ?? "Household") : "Personal";
            showToast(`Moved to ${targetLabel} ✓`);
        }
    };

    const toggleItem = async (aggregatedItem) => {
        const newStatus = !aggregatedItem.is_checked;
        const idsToUpdate = aggregatedItem.original_items.map(i => i.id);
        const { error } = await supabase.from("shopping_list").update({ is_checked: newStatus }).in("id", idsToUpdate);
        if (!error) {
            const updated = originalItems.map(item =>
                idsToUpdate.includes(item.id) ? { ...item, is_checked: newStatus } : item
            );
            setOriginalItems(updated);
            setDisplayItems(aggregateShoppingList(updated));
        }
    };

    const deleteItem = async (aggregatedItem) => {
        const idsToDelete = aggregatedItem.original_items.map(i => i.id);
        const { error } = await supabase.from("shopping_list").delete().in("id", idsToDelete);
        if (!error) {
            const updated = originalItems.filter(item => !idsToDelete.includes(item.id));
            setOriginalItems(updated);
            setDisplayItems(aggregateShoppingList(updated));
            showToast("Item removed.");
        }
    };

    const clearAll = async () => {
        const label = viewGroupId ? (activeGroup?.name ?? "this kitchen") : "your personal list";
        if (!confirm(`Are you sure you want to clear ${label}?`)) return;
        let q = supabase.from("shopping_list").delete();
        q = viewGroupId ? q.eq("group_id", viewGroupId) : q.is("group_id", null);
        const { error } = await q;
        if (!error) { setOriginalItems([]); setDisplayItems([]); showToast("List cleared! 🧹"); }
    };

    // ── Pro supplier order actions (PK7–PK9) ──────────────────────────────────

    /** Assign an item to a supplier — creates supplier_order if needed */
    const assignSupplier = async (itemIds, supplierName) => {
        if (!supplierName.trim()) return;

        // Find or create a supplier_order for this supplier in this group
        let order = supplierOrders.find(o => o.supplier_name.toLowerCase() === supplierName.toLowerCase());
        if (!order) {
            const { data: newOrder, error } = await supabase.from("supplier_orders").insert([{
                group_id: viewGroupId,
                supplier_name: supplierName.trim(),
            }]).select().single();
            if (error || !newOrder) { showToast("⚠️ Could not create supplier"); return; }
            order = newOrder;
            setSupplierOrders(prev => [...prev, newOrder]);
        }

        // Link the item(s) to this supplier_order
        const { error } = await supabase.from("shopping_list")
            .update({ supplier_order_id: order.id })
            .in("id", itemIds);

        if (!error) {
            const updated = originalItems.map(i =>
                itemIds.includes(i.id) ? { ...i, supplier_order_id: order.id } : i
            );
            setOriginalItems(updated);
            setDisplayItems(aggregateShoppingList(updated));
            showToast(`Assigned to ${supplierName} ✓`);
        }
    };

    /** Update order_date on a supplier_order (PK8 scheduling) */
    const setOrderDate = async (orderId, date) => {
        const { error } = await supabase.from("supplier_orders")
            .update({ order_date: date || null })
            .eq("id", orderId);
        if (!error) {
            setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_date: date } : o));
        }
    };

    /** Mark a supplier order as sent (PK9) */
    const markOrderSent = async (orderId) => {
        const { data: { user } } = await supabase.auth.getUser();
        const ts = new Date().toISOString();
        const { error } = await supabase.from("supplier_orders")
            .update({ ordered_at: ts, ordered_by: user?.id })
            .eq("id", orderId);
        if (!error) {
            setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, ordered_at: ts } : o));
            showToast("Order marked as sent ✓");
        }
    };

    /** Clear the ordered_at timestamp to allow resend */
    const clearOrderSent = async (orderId) => {
        const { error } = await supabase.from("supplier_orders")
            .update({ ordered_at: null, ordered_by: null })
            .eq("id", orderId);
        if (!error) {
            setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, ordered_at: null } : o));
        }
    };

    const copyOrderText = (order, items) => {
        const listLabel = activeGroup?.name ?? "Kitchen";
        navigator.clipboard.writeText(buildOrderText(order, items, listLabel, userName, groupProfile));
        showToast(`Copied order for ${order?.supplier_name || "supplier"} 📋`);
    };

    const handleDownloadPDF = (order, items) => {
        const listLabel = activeGroup?.name ?? "Kitchen";
        downloadOrderPDF(order, items, listLabel, userName, groupProfile);
    };

    // ── Clipboard helpers ─────────────────────────────────────────────────────
    const copyToClipboard = () => {
        const listLabel = viewGroupId ? (activeGroup?.name ?? "Household") : "Personal";
        const items = displayItems
            .map(item => `${item.is_checked ? "✓" : "☐"} ${item.qty || ""} ${displayUnit(item.qty, item.unit)} ${item.item_name}`)
            .join("\n");
        navigator.clipboard.writeText(`🛒 *${listLabel} Shopping List (Living Cookbook)*\n\n${items}\n\n🔗 https://living-cookbook.vercel.app/shopping`);
        showToast("Copied to clipboard! 📋");
    };

    const shareWhatsApp = () => {
        const listLabel = viewGroupId ? (activeGroup?.name ?? "Household") : "Personal";
        const items = displayItems
            .map(item => `${item.is_checked ? "✓" : "☐"} ${item.qty || ""} ${displayUnit(item.qty, item.unit)} ${item.item_name}`)
            .join("\n");
        const text = `🛒 *${listLabel} Shopping List (Living Cookbook)*\n\n${items}\n\n🔗 https://living-cookbook.vercel.app/shopping`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

    // ── Tab definitions ───────────────────────────────────────────────────────
    const tabs = [
        { id: "", label: "Personal" },
        ...groups.map(g => ({ id: g.id, label: g.name, isPro: g.group_type === "pro_kitchen" })),
    ];
    const activeViewLabel = tabs.find(t => t.id === viewGroupId)?.label ?? "Personal";

    // ── Styles ────────────────────────────────────────────────────────────────
    const cardStyle = {
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "16px",
        padding: "20px 24px",
        marginBottom: "12px",
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="pp-page-card">

            <PageHeader
                title="Market List"
                actions={<>
                    <button onClick={copyToClipboard} className="btn-scan" style={{ fontSize: "0.9rem", padding: "10px 20px" }}>{Icon.clipboard} Copy</button>
                    <button onClick={shareWhatsApp} className="btn-scan" style={{ fontSize: "0.9rem", padding: "10px 20px", background: "#25D366", color: "white", border: "none" }}>{Icon.whatsapp} WhatsApp</button>
                </>}
            />
            {/* Metadata: active view + budget */}
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "-20px", marginBottom: "28px" }}>
                <p style={{ color: "var(--color-text-muted)", margin: 0 }}>{activeViewLabel}</p>
                {displayItems.length > 0 && (
                    <span style={{
                        background: "var(--color-accent-amber-glow)", border: "1px solid var(--color-accent-amber)",
                        color: "var(--color-accent-amber)", padding: "4px 12px",
                        borderRadius: "15px", fontSize: "0.8rem", fontWeight: 700,
                    }}>
                        Est. Budget: ${calculateListBudget(displayItems).toFixed(2)}
                    </span>
                )}
            </div>

            {/* Tabs */}
            {tabs.length > 1 && (
                <div style={{ display: "flex", gap: "6px", marginBottom: "28px", flexWrap: "wrap" }}>
                    {tabs.map(tab => {
                        const active = tab.id === viewGroupId;
                        return (
                            <button key={tab.id} onClick={() => setViewGroupId(tab.id)} style={{
                                padding: "8px 18px", borderRadius: "10px", border: "none",
                                cursor: "pointer", fontSize: "0.85rem", fontWeight: active ? 700 : 500,
                                background: active ? "var(--color-accent-amber)" : "rgba(255,255,255,0.05)",
                                color: active ? "var(--color-bg-deep-olive)" : "var(--color-text-muted)",
                                transition: "all 0.2s ease",
                            }}>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Quick Add */}
            <form onSubmit={handleAddItem} style={{
                background: "rgba(235,220,178,0.03)", borderRadius: "20px", padding: "24px",
                marginBottom: "32px", border: "1px solid rgba(235,220,178,0.1)",
                display: "flex", gap: "12px", flexWrap: "wrap",
            }}>
                <input placeholder="Item name (e.g. Milk)" className="form-control" style={{ flex: 3, minWidth: "200px" }}
                    value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                <input placeholder="Qty" className="form-control" style={{ flex: 1, minWidth: "80px" }}
                    value={newItem.qty} onChange={e => setNewItem({ ...newItem, qty: e.target.value })} />
                <input placeholder="Unit" className="form-control" style={{ flex: 1, minWidth: "80px" }}
                    value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} />
                <button type="submit" disabled={isAdding} className="btn-add" style={{ padding: "0 25px" }}>
                    {isAdding ? "Adding..." : "+ Add"}
                </button>
            </form>

            <main>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "100px", opacity: 0.5 }}>Gathering items…</div>
                ) : displayItems.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">{Icon.cart}</div>
                        <h2 className="empty-state-title">
                            {viewGroupId ? `${activeGroup?.name ?? "Kitchen"} list is empty` : "Your personal list is empty"}
                        </h2>
                        <p className="empty-state-text">
                            {isProView
                                ? "Add items manually above, or generate an order list from a production plan's stock check."
                                : "Add items manually above or click ingredients in recipes."}
                        </p>
                        <Link href="/" className="btn-add-recipe" style={{ marginTop: "20px" }}>Go to Library</Link>
                    </div>
                ) : isProView ? (
                    // ── PRO KITCHEN VIEW (PK7–PK9) ──────────────────────────
                    <ProKitchenList
                        displayItems={displayItems}
                        originalItems={originalItems}
                        supplierOrders={supplierOrders}
                        tabs={tabs}
                        viewGroupId={viewGroupId}
                        onToggle={toggleItem}
                        onDelete={deleteItem}
                        onAssignSupplier={assignSupplier}
                        onSetOrderDate={setOrderDate}
                        onMarkSent={markOrderSent}
                        onClearSent={clearOrderSent}
                        onCopyOrder={copyOrderText}
                        onDownloadPDF={handleDownloadPDF}
                        onReassign={reassignItem}
                        reassigningId={reassigningId}
                        setReassigningId={setReassigningId}
                        activeGroup={activeGroup}
                        onClear={clearAll}
                        activeViewLabel={activeViewLabel}
                    />
                ) : (
                    // ── STANDARD VIEW ─────────────────────────────────────────
                    <StandardList
                        displayItems={displayItems}
                        tabs={tabs}
                        viewGroupId={viewGroupId}
                        onToggle={toggleItem}
                        onDelete={deleteItem}
                        onReassign={reassignItem}
                        reassigningId={reassigningId}
                        setReassigningId={setReassigningId}
                        onClear={clearAll}
                        activeViewLabel={activeViewLabel}
                    />
                )}
            </main>

            {toast && (
                <div role="alert" aria-live="assertive" style={{
                    position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)",
                    background: "var(--color-footer)", color: "var(--color-text-papyrus)",
                    padding: "12px 24px", borderRadius: "100px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 1000,
                    border: "1px solid var(--color-divider)",
                }}>{toast}</div>
            )}
        </div>
    );
}

// ── Standard (household / personal) list ─────────────────────────────────────
function StandardList({ displayItems, tabs, viewGroupId, onToggle, onDelete, onReassign, reassigningId, setReassigningId, onClear, activeViewLabel }) {
    return (
        <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-divider)",
            borderRadius: "16px",
            marginBottom: "16px",
            overflow: "hidden",
        }}>
            {/* Header strip — mirrors SupplierOrderCard */}
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

// ── Pro Kitchen list (PK7–PK9) ────────────────────────────────────────────────
function ProKitchenList({
    displayItems, originalItems, supplierOrders,
    tabs, viewGroupId, onToggle, onDelete,
    onAssignSupplier, onSetOrderDate, onMarkSent, onClearSent, onCopyOrder, onDownloadPDF,
    onReassign, reassigningId, setReassigningId,
    activeGroup, onClear, activeViewLabel, userName,
}) {
    const [assigningId, setAssigningId]     = useState(null); // item_name being assigned
    const [supplierInput, setSupplierInput] = useState("");

    // Build a lookup: supplier_order_id → order
    const orderMap = Object.fromEntries(supplierOrders.map(o => [o.id, o]));

    // Group displayItems by supplier_order_id
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
    const isSent    = !!order.ordered_at;
    const allDone   = items.length > 0 && items.every(item => item.original_items.every(i => i.is_checked));

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
                {/* Supplier name */}
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

                {/* Copy & PDF buttons */}
                <button onClick={() => onCopyOrder(order, items)}
                    title="Copy order as email text"
                    style={{
                        background: "none", border: "1px solid var(--color-divider)",
                        color: "var(--color-text-muted)", borderRadius: "8px",
                        padding: "4px 12px", cursor: "pointer", fontSize: "0.78rem",
                        transition: "all 0.15s",
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
                        padding: "4px 12px", cursor: "pointer", fontSize: "0.78rem",
                        transition: "all 0.15s",
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
                            style={{
                                background: "none", border: "none",
                                color: "var(--color-text-muted)", cursor: "pointer",
                                fontSize: "0.75rem", padding: "2px 6px",
                            }}>Resend</button>
                    </div>
                ) : (
                    <button onClick={() => onMarkSent(order.id)}
                        style={{
                            background: "rgba(0,200,150,0.14)", border: "1px solid rgba(0,200,150,0.35)",
                            color: proAccent, borderRadius: "8px",
                            padding: "5px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                            transition: "all 0.15s",
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
    const isChecked = item.original_items.every(i => i.is_checked);
    const isFromPlan = item.original_items.some(i => i.source === "plan");

    return (
        <li style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 0",
            borderBottom: last ? "none" : "1px solid rgba(235,220,178,0.05)",
            opacity: isChecked ? 0.5 : 1,
            cursor: "pointer",
            transition: "opacity 0.2s",
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

            {/* Assign supplier button (PK7) */}
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
                            padding: "3px 10px", cursor: "pointer", fontSize: "0.75rem",
                            transition: "all 0.15s",
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

// ── Shared clear button ───────────────────────────────────────────────────────
function ClearButton({ onClear, label }) {
    return (
        <div style={{ marginTop: "20px", padding: "10px 0" }}>
            <button onClick={onClear} style={{
                width: "100%", padding: "16px", borderRadius: "16px",
                background: "transparent", color: "rgba(255,107,107,0.8)",
                border: "1px dashed rgba(255,107,107,0.4)", fontSize: "0.9rem",
                fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
            }}
                onMouseEnter={e => { e.target.style.background = "rgba(255,107,107,0.05)"; e.target.style.borderColor = "#ff6b6b"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(255,107,107,0.4)"; }}
            >
                {Icon.trash} Clear {label} List
            </button>
        </div>
    );
}
