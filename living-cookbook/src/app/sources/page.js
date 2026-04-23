import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata = {
    title: "Sources & References — The Living Cookbook",
    description: "Every cookbook, website, and publication cited across the community's public recipes — a living bibliography.",
};

// ── Data fetching ──────────────────────────────────────────────────────────────
// Server component — no client state needed for this read-only page.

async function getSources() {
    const supabase = await createClient();

    const { data: recipes, error } = await supabase
        .from("recipes")
        .select("source_id, sources!source_id(id, book_title, author, publisher, link, page_number)")
        .eq("is_public", true)
        .not("source_id", "is", null);

    if (error || !recipes) return { books: [], websites: [] };

    const sourceMap = new Map();
    for (const r of recipes) {
        if (!r.sources) continue;
        const s = r.sources;
        if (!s.book_title && !s.link) continue;
        if (sourceMap.has(s.id)) {
            sourceMap.get(s.id).count++;
        } else {
            sourceMap.set(s.id, { ...s, count: 1 });
        }
    }

    const all = [...sourceMap.values()].sort((a, b) => b.count - a.count);
    const books       = all.filter(s => s.book_title && !s.link);
    const linkedBooks = all.filter(s => s.book_title && s.link);
    const websites    = all.filter(s => s.link);

    return {
        books:    [...books, ...linkedBooks].sort((a, b) => b.count - a.count),
        websites: websites.sort((a, b) => b.count - a.count),
    };
}

function getDomain(url) {
    try { return new URL(url).hostname.replace("www.", ""); }
    catch { return url; }
}

// ── SourceCard ─────────────────────────────────────────────────────────────────
// Inline styles used only where values are static one-offs; §A tokens throughout.
// --color-primary replaces --color-accent-amber (§B deprecated).
// Hardcoded rgba(212,175,55,...) replaced with var(--color-primary-container/glow).

function SourceCard({ source, type }) {
    const cardContent = (
        <div style={{
            padding: "20px 24px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-sm)",
            transition: "border-color var(--motion-fast), background var(--motion-fast)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {type === "website" ? (
                        <>
                            <div style={{ fontSize: "0.78rem", color: "var(--color-on-surface-muted)", marginBottom: "2px" }}>
                                {getDomain(source.link)}
                            </div>
                            {source.book_title && (
                                <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--color-on-surface)", lineHeight: 1.4 }}>
                                    {source.book_title}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--color-on-surface)", lineHeight: 1.4 }}>
                                {source.book_title}
                            </div>
                            {source.author && (
                                <div style={{ fontSize: "0.8rem", color: "var(--color-on-surface-muted)" }}>
                                    by {source.author}
                                </div>
                            )}
                            {source.publisher && (
                                <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-muted)" }}>
                                    {source.publisher}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Recipe count badge — §A tokens */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    background: "var(--color-primary-container)",
                    border: "1px solid var(--color-primary)",
                    borderRadius: "20px", padding: "3px 10px", flexShrink: 0,
                    opacity: 0.8,
                }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-on-primary-container)", whiteSpace: "nowrap" }}>
                        {source.count} {source.count === 1 ? "recipe" : "recipes"}
                    </span>
                </div>
            </div>

            {type === "website" && (
                <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", color: "var(--color-primary)" }}>
                    {/* External link indicator — inline SVG kept small (10px decorative context, no Icon.* equivalent) */}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    <span style={{ fontSize: "0.75rem" }}>
                        {getDomain(source.link)}
                    </span>
                </div>
            )}
        </div>
    );

    if (type === "website" && source.link) {
        return (
            <a href={source.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
                {cardContent}
            </a>
        );
    }
    return cardContent;
}

// ── Page ───────────────────────────────────────────────────────────────────────
// Shell: pp-page-card (architecture rule — all interior pages, LL-049).
// h1: <PageHeader> (architecture rule — one h1 per page via PageHeader).
// h2: pp-section-heading with style={{ margin: 0 }} (flex-row exception — h2 shares
//     a row with the count badge, so the 40px gap moves to the containing section).

export default async function SourcesPage() {
    const { books, websites } = await getSources();
    const total = books.length + websites.length;

    return (
        <div className="pp-page-card">

            <PageHeader
                title="Sources & References"
                subtitle="A living bibliography — every cookbook, journal, and website that has contributed to recipes in this community."
            />

            {total > 0 && (
                <p style={{ color: "var(--color-on-surface-muted)", fontSize: "0.9rem", marginTop: "-12px", marginBottom: "40px" }}>
                    <strong style={{ color: "var(--color-on-surface)" }}>{total} source{total !== 1 ? "s" : ""}</strong>
                    {" "}cited across {books.length} book{books.length !== 1 ? "s" : ""} and {websites.length} website{websites.length !== 1 ? "s" : ""}.
                </p>
            )}

            {total === 0 && (
                <div style={{
                    padding: "48px 24px", textAlign: "center",
                    background: "var(--color-surface-container)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-on-surface-muted)", fontSize: "0.9rem",
                    border: "1px solid var(--color-hairline)",
                }}>
                    No sources have been cited in public recipes yet.<br/>
                    <Link href="/add" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Add a recipe with a source reference →</Link>
                </div>
            )}

            {/* Books — section header in a flex row: h2 gets margin:0, gap moved to <section> */}
            {books.length > 0 && (
                <section style={{ marginBottom: "48px" }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        marginBottom: "20px", paddingBottom: "12px",
                        borderBottom: "1px solid var(--color-hairline)",
                    }}>
                        {/* Icon.book is 18px SVG from the icon library */}
                        <span style={{ color: "var(--color-primary)" }} aria-hidden="true">{Icon.book}</span>
                        <h2 className="pp-section-heading" style={{ margin: 0 }}>
                            Books
                            <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--color-on-surface-muted)", marginLeft: "8px" }}>
                                {books.length}
                            </span>
                        </h2>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {books.map(s => <SourceCard key={s.id} source={s} type="book" />)}
                    </div>
                </section>
            )}

            {/* Websites */}
            {websites.length > 0 && (
                <section style={{ marginBottom: "48px" }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        marginBottom: "20px", paddingBottom: "12px",
                        borderBottom: "1px solid var(--color-hairline)",
                    }}>
                        <span style={{ color: "var(--color-primary)" }} aria-hidden="true">{Icon.globe}</span>
                        <h2 className="pp-section-heading" style={{ margin: 0 }}>
                            Websites
                            <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--color-on-surface-muted)", marginLeft: "8px" }}>
                                {websites.length}
                            </span>
                        </h2>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {websites.map(s => <SourceCard key={s.id} source={s} type="website" />)}
                    </div>
                </section>
            )}

            <p style={{ fontSize: "0.78rem", color: "var(--color-on-surface-muted)", fontStyle: "italic", textAlign: "center" }}>
                Only sources cited in public recipes are shown here. Add a source reference when creating or editing a recipe to contribute to this bibliography.
            </p>
        </div>
    );
}
