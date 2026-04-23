import { Icon } from "@/components/icons";

const proAccent = "#00c896";
const amber     = "#f59e0b";
const green     = "#2ecc71";

/**
 * InfoRow — simple key/value display row used inside kitchen cards.
 * Shared between the member list and Pro Kitchen profile editor.
 */
function InfoRow({ label, value, mono = false, highlight = false }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '11px 28px', borderTop: '1px solid var(--color-divider)',
            background: 'rgba(0,0,0,0.1)', gap: '16px',
        }}>
            <span style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {label}
            </span>
            <span style={{
                fontSize: '0.83rem',
                fontFamily: mono ? 'monospace' : 'inherit',
                color: highlight ? 'var(--color-accent-amber)' : 'var(--color-text-papyrus)',
                fontWeight: highlight ? 700 : 400,
                textAlign: 'right', wordBreak: 'break-all',
            }}>
                {value}
            </span>
        </div>
    );
}

const labelStyle = {
    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--color-text-muted)",
    display: "block", marginBottom: "4px",
};

const inputStyle = {
    background: "var(--color-bg)", border: "1px solid var(--color-divider)",
    borderRadius: "8px", color: "var(--color-text-papyrus)",
    padding: "8px 12px", fontSize: "0.88rem", outline: "none",
    width: "100%", transition: "border-color 0.2s",
};

/**
 * KitchenCard — renders a single kitchen (household or pro kitchen) in the
 * Manage Kitchens page. Extracted from household/page.js (B11).
 *
 * Receives all data and callbacks as props — no internal DB calls.
 */
export default function KitchenCard({
    g,
    currentUserId,
    membersCache,
    copiedCode,
    setCopiedCode,
    removingId,
    onRemoveMember,
    profileEdit,
    setProfileEdit,
    profileSaving,
    onSaveProfile,
    onStartProfileEdit,
    onLeave,
}) {
    const isPro       = g.groups.group_type === "pro_kitchen";
    const isOwner     = g.role === "owner";
    const groupId     = g.groups.id;
    const members     = membersCache[groupId] || [];
    const editing     = profileEdit[groupId];

    return (
        <div style={{
            background: "var(--color-surface)",
            border: `1px solid ${isPro ? "rgba(0,200,150,0.25)" : "var(--color-divider)"}`,
            borderRadius: "20px", overflow: "hidden",
        }}>
            {/* ── Card header ── */}
            <div style={{ padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", color: isPro ? proAccent : "var(--color-accent-amber)" }}>
                            {isPro ? Icon.chef : Icon.house}
                        </span>
                        <h3 className="font-heading" style={{ margin: 0 }}>{g.groups.name}</h3>
                        {isPro && (
                            <span style={{
                                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
                                color: proAccent, background: "rgba(0,200,150,0.14)",
                                padding: "2px 8px", borderRadius: "20px",
                            }}>PRO</span>
                        )}
                    </div>
                </div>

                {/* Invite code pill */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(0,0,0,0.15)', border: '1px solid var(--color-divider)',
                        padding: '4px 4px 4px 12px', borderRadius: '10px',
                    }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Code:</span>
                        <span style={{ fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--color-accent-amber)', fontWeight: 700 }}>
                            {g.groups.invite_code}
                        </span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(g.groups.invite_code);
                                setCopiedCode(`code_${groupId}`);
                                setTimeout(() => setCopiedCode(null), 2000);
                            }}
                            title="Copy Code"
                            style={{
                                background: copiedCode === `code_${groupId}` ? 'rgba(46,204,113,0.1)' : 'rgba(235,220,178,0.06)',
                                border: `1px solid ${copiedCode === `code_${groupId}` ? 'rgba(46,204,113,0.3)' : 'transparent'}`,
                                color: copiedCode === `code_${groupId}` ? green : 'var(--color-text-muted)',
                                borderRadius: "6px", width: "24px", height: "24px", cursor: "pointer",
                                transition: "all 0.2s", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            }}
                            onMouseEnter={e => { if (copiedCode !== `code_${groupId}`) { e.currentTarget.style.background = "rgba(235,220,178,0.12)"; e.currentTarget.style.color = "var(--color-text-papyrus)"; } }}
                            onMouseLeave={e => { if (copiedCode !== `code_${groupId}`) { e.currentTarget.style.background = "rgba(235,220,178,0.06)"; e.currentTarget.style.color = "var(--color-text-muted)"; } }}
                        >
                            {copiedCode === `code_${groupId}` ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            )}
                        </button>
                    </span>
                </div>
            </div>

            {/* ── Member list ── */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {membersCache[groupId] ? membersCache[groupId].map(m => (
                    <InfoRow
                        key={m.user_id}
                        label={m.profiles?.display_name || "Unknown user"}
                        value={
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{
                                    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em",
                                    color: m.role === "owner" ? amber : "var(--color-text-muted)",
                                    textTransform: "uppercase",
                                }}>{m.role} {m.user_id === currentUserId && "(YOU)"}</span>
                                {isOwner && m.user_id !== currentUserId && (
                                    <button
                                        onClick={() => onRemoveMember(groupId, m.user_id)}
                                        disabled={removingId === m.user_id}
                                        style={{
                                            background: "none", border: "1px solid rgba(255,107,107,0.3)",
                                            color: "#ff6b6b", opacity: 0.8,
                                            cursor: removingId === m.user_id ? "not-allowed" : "pointer",
                                            fontSize: "0.78rem", padding: "3px 10px",
                                            borderRadius: "6px", transition: "all 0.15s",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "rgba(255,107,107,0.1)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.background = "none"; }}
                                    >
                                        {removingId === m.user_id ? "Removing…" : "Remove"}
                                    </button>
                                )}
                            </span>
                        }
                    />
                )) : <InfoRow label="Loading members…" value="" />}
            </div>

            {/* ── PKP2: Pro Kitchen profile editor ── */}
            {isPro && isOwner && (
                <div style={{
                    borderTop: "1px solid rgba(0,200,150,0.15)",
                    padding: "16px 0", background: "rgba(0,200,150,0.02)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", padding: "0 28px" }}>
                        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: proAccent, margin: 0 }}>
                            Business Profile
                        </p>
                        {!editing && (
                            <button onClick={() => onStartProfileEdit(g)} style={{
                                background: "none", border: "1px solid rgba(0,200,150,0.3)",
                                color: proAccent, borderRadius: "8px",
                                padding: "3px 12px", cursor: "pointer", fontSize: "0.75rem",
                            }}>
                                {g.groups.company_name ? "Edit" : "+ Add profile"}
                            </button>
                        )}
                    </div>

                    {!editing ? (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {g.groups.company_name && <InfoRow label="Company Name" value={g.groups.company_name} />}
                            {g.groups.company_address && <InfoRow label="Address" value={<span style={{ whiteSpace: "pre-line", textAlign: "right" }}>{g.groups.company_address}</span>} />}
                            {g.groups.contact_email && <InfoRow label="Order Contact Email" value={g.groups.contact_email} />}
                            {!g.groups.company_name && !g.groups.company_address && !g.groups.contact_email && (
                                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "16px 28px" }}>
                                    No business profile yet — click <em>+ Add profile</em> to add company details that appear on order PDFs.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "12px", padding: "0 28px" }}>
                            <div>
                                <label style={labelStyle}>Company Name</label>
                                <input style={inputStyle} placeholder="e.g. The Grand Bistro"
                                    value={editing.company_name}
                                    onChange={e => setProfileEdit(prev => ({ ...prev, [groupId]: { ...editing, company_name: e.target.value } }))}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Business Address</label>
                                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "64px" }}
                                    placeholder={"e.g. 12 Market Street\nCape Town, 8001"}
                                    value={editing.company_address}
                                    onChange={e => setProfileEdit(prev => ({ ...prev, [groupId]: { ...editing, company_address: e.target.value } }))}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Order Contact Email</label>
                                <input style={inputStyle} type="email" placeholder="orders@yourkitchen.com"
                                    value={editing.contact_email}
                                    onChange={e => setProfileEdit(prev => ({ ...prev, [groupId]: { ...editing, contact_email: e.target.value } }))}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => onSaveProfile(groupId)} disabled={profileSaving === groupId} style={{
                                    background: proAccent, border: "none", color: "#0a1a0f",
                                    borderRadius: "8px", padding: "8px 20px",
                                    cursor: profileSaving === groupId ? "not-allowed" : "pointer",
                                    fontWeight: 700, fontSize: "0.85rem",
                                }}>
                                    {profileSaving === groupId ? "Saving…" : "Save Profile"}
                                </button>
                                <button onClick={() => setProfileEdit(prev => { const n = { ...prev }; delete n[groupId]; return n; })} style={{
                                    background: "none", border: "1px solid var(--color-divider)",
                                    color: "var(--color-text-muted)", borderRadius: "8px",
                                    padding: "8px 16px", cursor: "pointer", fontSize: "0.85rem",
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Actions: Share / Leave ── */}
            <div style={{ borderTop: "1px solid var(--color-divider)", display: "flex", flexDirection: "column" }}>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/join/${g.groups.invite_code}`);
                        setCopiedCode(`share_${groupId}`);
                        setTimeout(() => setCopiedCode(null), 2500);
                    }}
                    style={{
                        background: "rgba(176,173,218,0.05)", border: "none",
                        borderBottom: "1px solid rgba(176,173,218,0.15)",
                        color: "var(--color-primary)", cursor: "pointer",
                        fontSize: "0.85rem", fontWeight: 700,
                        padding: "16px", width: "100%", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(176,173,218,0.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(176,173,218,0.05)"; }}
                >
                    {copiedCode === `share_${groupId}` ? "✓ Link Copied!" : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            Share Invite Link
                        </>
                    )}
                </button>

                <button
                    onClick={() => onLeave(groupId)}
                    style={{
                        background: "rgba(255,107,107,0.02)", border: "none", color: "#ff6b6b", opacity: 0.8,
                        cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                        padding: "16px", width: "100%", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,107,0.06)"; e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,107,107,0.02)"; e.currentTarget.style.opacity = "0.8"; }}
                >
                    Leave Kitchen
                </button>
            </div>
        </div>
    );
}
