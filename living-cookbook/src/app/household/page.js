"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";
import { PageHeader, Alert } from "@/components/ui";

const proAccent = "#00c896";
const amber     = "#f59e0b";
const green     = "#2ecc71";

function InfoRow({ label, value, mono = false, highlight = false }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '11px 28px',
            borderTop: '1px solid var(--color-divider)',
            background: 'rgba(0,0,0,0.1)',
            gap: '16px',
        }}>
            <span style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {label}
            </span>
            <span style={{
                fontSize: '0.83rem',
                fontFamily: mono ? 'monospace' : 'inherit',
                color: highlight ? 'var(--color-accent-amber)' : 'var(--color-text-papyrus)',
                fontWeight: highlight ? 700 : 400,
                textAlign: 'right',
                wordBreak: 'break-all',
            }}>
                {value}
            </span>
        </div>
    );
}

export default function HouseholdPage() {
    const [groups, setGroups]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [newGroupName, setNewGroupName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError]           = useState(null);
    const [success, setSuccess]       = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userTier, setUserTier]     = useState('free'); // default safe

    // H13: members panel — keyed by group id
    const [expandedMembers, setExpandedMembers] = useState(new Set());
    const [membersCache, setMembersCache]       = useState({});  // groupId → members[]
    const [removingId, setRemovingId]           = useState(null); // userId being removed

    // PKP2: Pro Kitchen profile edit state — keyed by group id
    const [profileEdit, setProfileEdit]   = useState({}); // groupId → { company_name, company_address, contact_email }
    const [profileSaving, setProfileSaving] = useState(null);

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            setCurrentUserId(user.id);
            // Fetch the user's subscription tier to gate Pro Kitchen creation
            const { data: profile } = await supabase
                .from('profiles')
                .select('tier')
                .eq('id', user.id)
                .single();
            if (profile?.tier) setUserTier(profile.tier);
        });
        loadGroups();
    }, [supabase]);

    const loadGroups = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
            .from("group_members")
            .select("groups(*), role")
            .eq("user_id", user.id);
        if (!error && data) {
            setGroups(data);
            data.forEach(g => loadMembers(g.groups.id));
        }
        setLoading(false);
    };

    // F-003: accepts group_type ('household' | 'pro_kitchen')
    const createGroup = async (groupType) => {
        if (!newGroupName.trim()) { setError("Please enter a name first."); return; }
        setError(null); setSuccess(null);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { setError("Session unavailable — please refresh."); return; }

        const { data: group, error: gError } = await supabase
            .from("groups")
            .insert([{ name: newGroupName.trim(), owner_id: user.id, group_type: groupType }])
            .select().single();

        if (gError) { setError("Failed to create. Try another name."); return; }

        const { error: mError } = await supabase
            .from("group_members")
            .insert([{ group_id: group.id, user_id: user.id, role: "owner" }]);

        const label = groupType === "pro_kitchen" ? "Pro Kitchen" : "Household";
        if (mError) {
            setError(`Failed to set up your ${label}. Unexpected error.`);
        } else {
            setSuccess(`🎉 ${label} "${group.name}" created! Share code "${group.invite_code}" with others.`);
            setNewGroupName("");
            loadGroups();
        }
    };

    const joinGroup = async (e) => {
        e.preventDefault();
        if (!inviteCode) return;
        setError(null); setSuccess(null);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { setError("Session unavailable — please refresh."); return; }

        const { data: group, error: fError } = await supabase
            .from("groups")
            .select("id, name, group_type")
            .eq("invite_code", inviteCode.trim())
            .single();

        if (fError || !group) { setError("Invalid invite code. Ask the owner for their join code."); return; }

        const { error: jError } = await supabase
            .from("group_members")
            .insert([{ group_id: group.id, user_id: user.id, role: "member" }]);

        if (jError) {
            setError(jError.code === "23505" ? "You are already a member!" : "Failed to join. Check your permissions.");
        } else {
            const label = group.group_type === "pro_kitchen" ? "Pro Kitchen" : "Household";
            setSuccess(`Welcome to the "${group.name}" ${label}!`);
            setInviteCode("");
            loadGroups();
        }
    };

    const leaveGroup = async (groupId) => {
        if (!confirm("Leave this kitchen? You will lose shared access to recipes and market lists.")) return;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { setError("Session unavailable — please refresh."); return; }
        const { error } = await supabase.from("group_members").delete()
            .eq("group_id", groupId).eq("user_id", user.id);
        if (error) setError("Failed to leave kitchen.");
        else loadGroups();
    };

    // ── H13: Load member list for a group ─────────────────────────────────────
    const loadMembers = async (groupId) => {
        if (membersCache[groupId]) return; // already fetched

        // Step 1: fetch group_members rows
        const { data: memberRows, error } = await supabase
            .from("group_members")
            .select("user_id, role")
            .eq("group_id", groupId);

        if (error || !memberRows) {
            // Always set cache so we don't stay stuck on "Loading..."
            setMembersCache(prev => ({ ...prev, [groupId]: [] }));
            return;
        }

        // Step 2: fetch display names from profiles (no direct FK from group_members → profiles)
        const userIds = memberRows.map(m => m.user_id).filter(Boolean);
        let profileMap = {};
        if (userIds.length > 0) {
            const { data: profileRows } = await supabase
                .from("profiles")
                .select("id, display_name")
                .in("id", userIds);
            for (const p of (profileRows || [])) profileMap[p.id] = p.display_name;
        }

        const members = memberRows.map(m => ({
            ...m,
            profiles: { display_name: profileMap[m.user_id] || null },
        }));

        setMembersCache(prev => ({ ...prev, [groupId]: members }));
    };

    const toggleMembers = async (groupId) => {
        const next = new Set(expandedMembers);
        if (next.has(groupId)) {
            next.delete(groupId);
        } else {
            next.add(groupId);
            await loadMembers(groupId);
        }
        setExpandedMembers(next);
    };

    // ── H12: Remove a member from a group (owner only) ────────────────────────
    const removeMember = async (groupId, userId) => {
        if (!confirm("Remove this member from the kitchen?")) return;
        setRemovingId(userId);
        const { error } = await supabase.from("group_members").delete()
            .eq("group_id", groupId).eq("user_id", userId);
        setRemovingId(null);
        if (!error) {
            // Update cache
            setMembersCache(prev => ({
                ...prev,
                [groupId]: (prev[groupId] || []).filter(m => m.user_id !== userId),
            }));
        }
    };

    // ── PKP2: Save Pro Kitchen profile ────────────────────────────────────────
    const saveProfile = async (groupId) => {
        const edit = profileEdit[groupId];
        if (!edit) return;
        setProfileSaving(groupId);
        const { error } = await supabase
            .from("groups")
            .update({
                company_name:    edit.company_name    || null,
                company_address: edit.company_address || null,
                contact_email:   edit.contact_email   || null,
            })
            .eq("id", groupId);
        setProfileSaving(null);
        if (!error) {
            // Patch groups state
            setGroups(prev => prev.map(g => g.groups.id === groupId
                ? { ...g, groups: { ...g.groups, ...edit } }
                : g
            ));
            setSuccess("Profile updated ✓");
            setTimeout(() => setSuccess(null), 3000);
        } else {
            setError("Failed to save profile.");
        }
    };

    const startProfileEdit = (g) => {
        setProfileEdit(prev => ({
            ...prev,
            [g.groups.id]: {
                company_name:    g.groups.company_name    || "",
                company_address: g.groups.company_address || "",
                contact_email:   g.groups.contact_email   || "",
            },
        }));
    };

    // ── Shared styles ─────────────────────────────────────────────────────────
    const cardStyle = {
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "24px",
        padding: "30px",
    };

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

    return (
        <div className="pp-page-card">
            <PageHeader
                overline="Kitchens"
                title="Manage Kitchens"
                subtitle="Create a Household to share recipes and shopping lists with family or friends, or a Pro Kitchen to unlock production planning, order management, and more."
            />

            <Alert variant="error">{error}</Alert>
            <Alert variant="success">{success}</Alert>

            {/* ── Create New ─────────────────────────────────────────────── */}
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
                <h2 className="pp-section-heading">Create New</h2>
                <input
                    placeholder="Give it a name…"
                    className="form-control"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
                    style={{ marginBottom: "20px" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Household */}
                    <button onClick={() => createGroup("household")} style={{
                        background: "rgba(235,220,178,0.05)", border: "1.5px solid var(--color-divider)",
                        borderRadius: "16px", padding: "22px", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-accent-amber)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-divider)"}
                    >
                        <div style={{ marginBottom: "10px", color: "var(--color-accent-amber)" }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        </div>
                        <div className="font-heading" style={{ fontSize: "1.05rem", color: "var(--color-on-surface)", marginBottom: "6px" }}>Household</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.45 }}>Share recipes and shopping lists with family or friends.</div>
                    </button>

                    {/* Pro Kitchen — gated on tier */}
                    {userTier === 'free' ? (
                        // Free tier: show locked card
                        <Link href="/upgrade" style={{
                            display: "block", textDecoration: "none",
                            background: "rgba(0,200,150,0.02)", border: "1.5px dashed rgba(0,200,150,0.4)",
                            borderRadius: "16px", padding: "22px", textAlign: "left",
                            position: "relative", cursor: "pointer", transition: "all 0.2s"
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = proAccent; e.currentTarget.style.background = "rgba(0,200,150,0.05)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,200,150,0.4)"; e.currentTarget.style.background = "rgba(0,200,150,0.02)"; }}
                        >
                            <span style={{
                                position: "absolute", top: "12px", right: "12px",
                                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
                                color: proAccent, background: "rgba(0,200,150,0.14)",
                                padding: "2px 8px", borderRadius: "20px",
                            }}>EARLY ACCESS</span>
                            <div style={{ marginBottom: "10px", color: proAccent }}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/><line x1="6" y1="13" x2="18" y2="13"/></svg>
                            </div>
                            <div className="font-heading" style={{ fontSize: "1.05rem", color: "var(--color-on-surface)", marginBottom: "6px" }}>Pro Kitchen</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.45 }}>Sign up to be one of the first 50 founding members and get early access to production tools.</div>
                        </Link>
                    ) : (
                        // Paid tier: full clickable button
                        <button onClick={() => createGroup("pro_kitchen")} style={{
                            background: "rgba(0,200,150,0.04)", border: "1.5px solid var(--color-divider)",
                            borderRadius: "16px", padding: "22px", cursor: "pointer", textAlign: "left",
                            transition: "border-color 0.2s", position: "relative",
                        }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = proAccent}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-divider)"}
                        >
                            <span style={{
                                position: "absolute", top: "12px", right: "12px",
                                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
                                color: proAccent, background: "rgba(0,200,150,0.14)",
                                padding: "2px 8px", borderRadius: "20px",
                            }}>PRO</span>
                            <div style={{ marginBottom: "10px", color: proAccent }}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/><line x1="6" y1="13" x2="18" y2="13"/></svg>
                            </div>
                            <div className="font-heading" style={{ fontSize: "1.05rem", color: "var(--color-on-surface)", marginBottom: "6px" }}>Pro Kitchen</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.45 }}>All household features + production planning, order management, and more.</div>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Join with Code ─────────────────────────────────────────── */}
            <div style={{ ...cardStyle, marginBottom: "60px" }}>
                <h2 className="pp-section-heading">Join with Invite Code</h2>
                <form onSubmit={joinGroup} style={{ display: "flex", gap: "12px" }}>
                    <input placeholder="Paste invite code…" className="form-control"
                        value={inviteCode} onChange={e => setInviteCode(e.target.value)} style={{ flex: 1 }} />
                    <button type="submit" className="btn-add" style={{ whiteSpace: "nowrap" }}>Join Kitchen</button>
                </form>
            </div>

            {/* ── Active Kitchens ─────────────────────────────────────────── */}
            <main>
                <h2 className="pp-section-heading">Your Kitchens</h2>
                {loading ? (
                    <p style={{ opacity: 0.5 }}>Checking memberships…</p>
                ) : groups.length === 0 ? (
                    <div style={{ textAlign: "center", opacity: 0.5, padding: "40px" }}>
                        You are not part of any kitchens yet. Create one above, or ask for an invite code.
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                        {groups.map((g, idx) => {
                            const isPro     = g.groups.group_type === "pro_kitchen";
                            const isOwner   = g.role === "owner";
                            const groupId   = g.groups.id;
                            const showMembers = expandedMembers.has(groupId);
                            const members   = membersCache[groupId] || [];
                            const editing   = profileEdit[groupId];

                            return (
                                <div key={idx} style={{
                                    background: "var(--color-surface)",
                                    border: `1px solid ${isPro ? "rgba(0,200,150,0.25)" : "var(--color-divider)"}`,
                                    borderRadius: "20px",
                                    overflow: "hidden",
                                }}>
                                    {/* Card header */}
                                    <div style={{ padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", color: isPro ? proAccent : "var(--color-accent-amber)" }}>{isPro ? Icon.chef : Icon.house}</span>
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

                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            {/* Invite Code inline */}
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '8px', 
                                                background: 'rgba(0,0,0,0.15)', border: '1px solid var(--color-divider)', 
                                                padding: '4px 4px 4px 12px', borderRadius: '10px' 
                                            }}>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Code:</span>
                                                <span style={{ fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--color-accent-amber)', fontWeight: 700 }}>{g.groups.invite_code}</span>
                                                <button onClick={() => {
                                                    navigator.clipboard.writeText(g.groups.invite_code);
                                                    setCopiedCode(`code_${groupId}`);
                                                    setTimeout(() => setCopiedCode(null), 2000);
                                                }} title="Copy Code" style={{
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

                                    {/* ── Key-Value Info Rows ──────────────────────────────── */}
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
                                                                onClick={() => removeMember(groupId, m.user_id)}
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

                                     {/* ── PKP2: Pro Kitchen profile editor ───────────────────── */}
                                    {isPro && isOwner && (
                                        <div style={{
                                            borderTop: "1px solid rgba(0,200,150,0.15)",
                                            padding: "16px 0",
                                            background: "rgba(0,200,150,0.02)",
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", padding: "0 28px" }}>
                                                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: proAccent, margin: 0 }}>
                                                    Business Profile
                                                </p>
                                                {!editing && (
                                                    <button onClick={() => startProfileEdit(g)} style={{
                                                        background: "none", border: "1px solid rgba(0,200,150,0.3)",
                                                        color: proAccent, borderRadius: "8px",
                                                        padding: "3px 12px", cursor: "pointer", fontSize: "0.75rem",
                                                    }}>
                                                        {g.groups.company_name ? "Edit" : "+ Add profile"}
                                                    </button>
                                                )}
                                            </div>

                                            {!editing ? (
                                                /* Read-only view */
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    {g.groups.company_name && (
                                                        <InfoRow label="Company Name" value={g.groups.company_name} />
                                                    )}
                                                    {g.groups.company_address && (
                                                        <InfoRow label="Address" value={<span style={{ whiteSpace: "pre-line", textAlign: "right" }}>{g.groups.company_address}</span>} />
                                                    )}
                                                    {g.groups.contact_email && (
                                                        <InfoRow label="Order Contact Email" value={g.groups.contact_email} />
                                                    )}
                                                    {!g.groups.company_name && !g.groups.company_address && !g.groups.contact_email && (
                                                        <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "16px 28px" }}>
                                                            No business profile yet — click <em>+ Add profile</em> to add company details that appear on order PDFs.
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Edit form */
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
                                                        <button onClick={() => saveProfile(groupId)} disabled={profileSaving === groupId} style={{
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

                                    {/* ── Actions: Share / Leave ───────────────────────────────────── */}
                                    <div style={{
                                        borderTop: "1px solid var(--color-divider)",
                                        display: "flex", flexDirection: "column"
                                    }}>
                                        <button onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/join/${g.groups.invite_code}`);
                                                setCopiedCode(`share_${groupId}`);
                                                setTimeout(() => setCopiedCode(null), 2500);
                                            }} 
                                            style={{
                                                background: "rgba(176,173,218,0.05)",
                                                border: "none", borderBottom: "1px solid rgba(176,173,218,0.15)",
                                                color: "var(--color-primary)",
                                                cursor: "pointer", fontSize: "0.85rem", fontWeight: 700,
                                                padding: "16px", width: "100%", transition: "all 0.2s",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(176,173,218,0.12)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(176,173,218,0.05)"; }}
                                        >
                                            {copiedCode === `share_${groupId}` ? "✓ Link Copied!" : (<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Share Invite Link</>)}
                                        </button>

                                        <button onClick={() => leaveGroup(groupId)}
                                            style={{
                                                background: "rgba(255,107,107,0.02)", border: "none", color: "#ff6b6b", opacity: 0.8,
                                                cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                                                padding: "16px", width: "100%", transition: "all 0.2s"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,107,0.06)"; e.currentTarget.style.opacity = "1"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,107,107,0.02)"; e.currentTarget.style.opacity = "0.8"; }}
                                        >
                                            Leave Kitchen
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
