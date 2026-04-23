/**
 * shopping-utils.js — Pure utility functions for the Shopping List feature.
 * Extracted from shopping/page.js (B10) to keep the page component lean.
 */

/** Format a date for display */
export function fmtDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Format a timestamp for display */
export function fmtTs(ts) {
    if (!ts) return null;
    return new Date(ts).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Group shopping list items by supplier_order_id */
export function groupByOrder(items, orders) {
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
export function buildOrderText(order, items, listLabel, userName, profile) {
    const co      = profile?.company_name ? `${profile.company_name}` : listLabel;
    const header  = `🍳 *${co} — Order for ${order?.supplier_name || "Supplier"}*`;
    const dateStr = order?.order_date ? `\nOrder date: ${fmtDate(order.order_date)}` : "";
    const addr    = profile?.company_address ? `\n${profile.company_address}` : "";
    const by      = userName ? `\nPrepared by: ${userName}${profile?.contact_email ? ` <${profile.contact_email}>` : ""}` : "";
    const lines   = items.map(i => `• ${i.qty || ""} ${i.unit || ""} ${i.item_name}`.trim()).join("\n");
    return `${header}${addr}${dateStr}${by}\n\n${lines}\n\n🔗 Living Cookbook: https://living-cookbook.vercel.app/shopping`;
}

/** Open a print-to-PDF window for a supplier order */
export function downloadOrderPDF(order, items, listLabel, userName, profile) {
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
