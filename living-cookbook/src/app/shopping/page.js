"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { aggregateShoppingList, displayUnit, calculateListBudget } from "@/lib/recipe-utils";
import { buildOrderText, downloadOrderPDF } from "@/lib/shopping-utils";
import { useHousehold } from "@/lib/HouseholdContext";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import StandardList from "@/components/shopping/StandardList";
import ProKitchenList from "@/components/shopping/ProKitchenList";

// ── Main component ────────────────────────────────────────────────────────────
export default function ShoppingListPage() {
    const supabase = useMemo(() => createClient(), []);
    const { groups, activeGroupId, activeGroup, isPro } = useHousehold();

    const [viewGroupId, setViewGroupId]       = useState("");
    const [originalItems, setOriginalItems]   = useState([]);
    const [displayItems, setDisplayItems]     = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [groupProfile, setGroupProfile]     = useState(null);
    const [loading, setLoading]               = useState(true);
    const [toast, setToast]                   = useState(null);
    const [newItem, setNewItem]               = useState({ name: "", qty: "", unit: "" });
    const [isAdding, setIsAdding]             = useState(false);
    const [reassigningId, setReassigningId]   = useState(null);
    const [userName, setUserName]             = useState("");

    const viewGroup  = groups.find(g => g.id === viewGroupId);
    const isProView  = viewGroup?.group_type === "pro_kitchen";

    useEffect(() => { setViewGroupId(activeGroupId ?? ""); }, [activeGroupId]);
    useEffect(() => { loadItems(); }, [viewGroupId]);

    // Load current user's display name for order attribution
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const user = session?.user;
            if (!user) return;
            supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
                .then(({ data }) => setUserName(data?.display_name || user.email?.split("@")[0] || ""));
        });
    }, []);

    const loadItems = async () => {
        setLoading(true);
        let q = supabase.from("shopping_list").select("*").order("created_at", { ascending: false });
        q = viewGroupId ? q.eq("group_id", viewGroupId) : q.is("group_id", null);
        const { data, error } = await q;
        if (!error && data) {
            setOriginalItems(data);
            setDisplayItems(aggregateShoppingList(data));
        }

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

    const assignSupplier = async (itemIds, supplierName) => {
        if (!supplierName.trim()) return;
        let order = supplierOrders.find(o => o.supplier_name.toLowerCase() === supplierName.toLowerCase());
        if (!order) {
            const { data: newOrder, error } = await supabase.from("supplier_orders").insert([{
                group_id: viewGroupId, supplier_name: supplierName.trim(),
            }]).select().single();
            if (error || !newOrder) { showToast("⚠️ Could not create supplier"); return; }
            order = newOrder;
            setSupplierOrders(prev => [...prev, newOrder]);
        }
        const { error } = await supabase.from("shopping_list")
            .update({ supplier_order_id: order.id }).in("id", itemIds);
        if (!error) {
            const updated = originalItems.map(i =>
                itemIds.includes(i.id) ? { ...i, supplier_order_id: order.id } : i
            );
            setOriginalItems(updated);
            setDisplayItems(aggregateShoppingList(updated));
            showToast(`Assigned to ${supplierName} ✓`);
        }
    };

    const setOrderDate = async (orderId, date) => {
        const { error } = await supabase.from("supplier_orders").update({ order_date: date || null }).eq("id", orderId);
        if (!error) setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_date: date } : o));
    };

    const markOrderSent = async (orderId) => {
        const { data: { user } } = await supabase.auth.getUser();
        const ts = new Date().toISOString();
        const { error } = await supabase.from("supplier_orders").update({ ordered_at: ts, ordered_by: user?.id }).eq("id", orderId);
        if (!error) {
            setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, ordered_at: ts } : o));
            showToast("Order marked as sent ✓");
        }
    };

    const clearOrderSent = async (orderId) => {
        const { error } = await supabase.from("supplier_orders").update({ ordered_at: null, ordered_by: null }).eq("id", orderId);
        if (!error) setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, ordered_at: null } : o));
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
