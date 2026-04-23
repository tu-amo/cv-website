"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";
import { PageHeader, Alert } from "@/components/ui";
import KitchenCard from "@/components/household/KitchenCard";

export default function HouseholdPage() {
    const [groups, setGroups]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [newGroupName, setNewGroupName]   = useState("");
    const [inviteCode, setInviteCode]       = useState("");
    const [error, setError]                 = useState(null);
    const [success, setSuccess]             = useState(null);
    const [copiedCode, setCopiedCode]       = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userTier, setUserTier]           = useState('free');

    // H13: member panels — keyed by group id
    const [membersCache, setMembersCache]   = useState({});
    const [removingId, setRemovingId]       = useState(null);

    // PKP2: Pro Kitchen profile edit state
    const [profileEdit, setProfileEdit]     = useState({});
    const [profileSaving, setProfileSaving] = useState(null);

    const supabase = useMemo(() => createClient(), []);

    const proAccent = "#00c896";

    const cardStyle = {
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "24px",
        padding: "30px",
    };

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            setCurrentUserId(user.id);
            const { data: profile } = await supabase
                .from('profiles').select('tier').eq('id', user.id).single();
            if (profile?.tier) setUserTier(profile.tier);
        });
        loadGroups();
    }, [supabase]);

    const loadGroups = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
            .from("group_members").select("groups(*), role").eq("user_id", user.id);
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
            .from("groups").insert([{ name: newGroupName.trim(), owner_id: user.id, group_type: groupType }])
            .select().single();

        if (gError) { setError("Failed to create. Try another name."); return; }

        const { error: mError } = await supabase
            .from("group_members").insert([{ group_id: group.id, user_id: user.id, role: "owner" }]);

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
            .from("groups").select("id, name, group_type").eq("invite_code", inviteCode.trim()).single();

        if (fError || !group) { setError("Invalid invite code. Ask the owner for their join code."); return; }

        const { error: jError } = await supabase
            .from("group_members").insert([{ group_id: group.id, user_id: user.id, role: "member" }]);

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
        if (membersCache[groupId]) return;

        const { data: memberRows, error } = await supabase
            .from("group_members").select("user_id, role").eq("group_id", groupId);

        if (error || !memberRows) {
            setMembersCache(prev => ({ ...prev, [groupId]: [] }));
            return;
        }

        const userIds = memberRows.map(m => m.user_id).filter(Boolean);
        let profileMap = {};
        if (userIds.length > 0) {
            const { data: profileRows } = await supabase
                .from("profiles").select("id, display_name").in("id", userIds);
            for (const p of (profileRows || [])) profileMap[p.id] = p.display_name;
        }

        const members = memberRows.map(m => ({
            ...m,
            profiles: { display_name: profileMap[m.user_id] || null },
        }));

        setMembersCache(prev => ({ ...prev, [groupId]: members }));
    };

    // ── H12: Remove a member from a group (owner only) ────────────────────────
    const removeMember = async (groupId, userId) => {
        if (!confirm("Remove this member from the kitchen?")) return;
        setRemovingId(userId);
        const { error } = await supabase.from("group_members").delete()
            .eq("group_id", groupId).eq("user_id", userId);
        setRemovingId(null);
        if (!error) {
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
        const { error } = await supabase.from("groups").update({
            company_name:    edit.company_name    || null,
            company_address: edit.company_address || null,
            contact_email:   edit.contact_email   || null,
        }).eq("id", groupId);
        setProfileSaving(null);
        if (!error) {
            setGroups(prev => prev.map(g => g.groups.id === groupId
                ? { ...g, groups: { ...g.groups, ...edit } } : g
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

    return (
        <div className="pp-page-card">
            <PageHeader
                overline="Kitchens"
                title="Manage Kitchens"
                subtitle="Create a Household to share recipes and shopping lists with family or friends, or a Pro Kitchen to unlock production planning, order management, and more."
            />

            <Alert variant="error">{error}</Alert>
            <Alert variant="success">{success}</Alert>

            {/* ── Create New ── */}
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
                        <Link href="/upgrade" style={{
                            display: "block", textDecoration: "none",
                            background: "rgba(0,200,150,0.02)", border: "1.5px dashed rgba(0,200,150,0.4)",
                            borderRadius: "16px", padding: "22px", textAlign: "left",
                            position: "relative", cursor: "pointer", transition: "all 0.2s",
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

            {/* ── Join with Code ── */}
            <div style={{ ...cardStyle, marginBottom: "60px" }}>
                <h2 className="pp-section-heading">Join with Invite Code</h2>
                <form onSubmit={joinGroup} style={{ display: "flex", gap: "12px" }}>
                    <input placeholder="Paste invite code…" className="form-control"
                        value={inviteCode} onChange={e => setInviteCode(e.target.value)} style={{ flex: 1 }} />
                    <button type="submit" className="btn-add" style={{ whiteSpace: "nowrap" }}>Join Kitchen</button>
                </form>
            </div>

            {/* ── Active Kitchens ── */}
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
                        {groups.map((g, idx) => (
                            <KitchenCard
                                key={idx}
                                g={g}
                                currentUserId={currentUserId}
                                membersCache={membersCache}
                                copiedCode={copiedCode}
                                setCopiedCode={setCopiedCode}
                                removingId={removingId}
                                onRemoveMember={removeMember}
                                profileEdit={profileEdit}
                                setProfileEdit={setProfileEdit}
                                profileSaving={profileSaving}
                                onSaveProfile={saveProfile}
                                onStartProfileEdit={startProfileEdit}
                                onLeave={leaveGroup}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
