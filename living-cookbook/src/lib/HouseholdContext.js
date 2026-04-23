"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
    const supabase = useMemo(() => createClient(), []);

    const [user, setUser] = useState(undefined); // undefined = loading
    const [groups, setGroups] = useState([]);
    const [activeGroupId, setActiveGroupId] = useState("");
    // 'mine' | 'kitchen' | 'public' — drives homepage recipe view from the nav
    const [activeView, setActiveView] = useState("public");

    // ── 1. Resolve auth ──────────────────────────────────────────────
    // getSession() reads from localStorage — ~1ms, no network.
    // onAuthStateChange fires INITIAL_SESSION almost immediately and
    // keeps state current for token refresh, sign-in, sign-out.
    // getUser() (HTTP round-trip) is reserved for security-sensitive mutations.
    useEffect(() => {
        // Fast path: populate state from local storage immediately
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            if (u) {
                const storedView = localStorage.getItem("activeView");
                setActiveView(storedView || "mine");
            } else {
                setActiveView("public");
            }
        });

        // Live updates: sign-in, sign-out, token refresh, tab-switch
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setActiveView("public");
                setActiveGroupId("");
            } else if (event === 'SIGNED_IN') {
                // Fresh login — restore stored view preference
                const storedView = localStorage.getItem("activeView");
                setActiveView(storedView || "mine");
            }
        });
        return () => subscription.unsubscribe();
    }, [supabase]);

    // ── 2. Load groups + subscribe to realtime changes ─────────────
    const loadGroups = async (userId) => {
        const { data } = await supabase
            .from("group_members")
            .select("groups(id, name, group_type)")
            .eq("user_id", userId);

        if (!data) return [];
        return data.map(d => d.groups).filter(Boolean);
    };

    useEffect(() => {
        if (!user) {
            setGroups([]);
            setActiveGroupId("");
            return;
        }

        const fetchGroups = (attempt = 0) => {
            loadGroups(user.id)
                .then(g => {
                    setGroups(g);
                    const stored = localStorage.getItem("activeGroupId");
                    const storedView = localStorage.getItem("activeView");
                    if (stored && g.some(x => x.id === stored)) {
                        setActiveGroupId(stored);
                    } else if (g.length === 1 && storedView === 'kitchen') {
                        setActiveGroupId(g[0].id);
                        localStorage.setItem("activeGroupId", g[0].id);
                    }
                })
                .catch(err => {
                    console.warn('[HouseholdContext] loadGroups failed', err?.message);
                    if (attempt < 1) setTimeout(() => fetchGroups(attempt + 1), 1500);
                });
        };
        fetchGroups();

        // Realtime subscription
        const channel = supabase
            .channel(`group_members_user_${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` },
                async () => {
                    try {
                        const fresh = await loadGroups(user.id);
                        setGroups(fresh);
                        if (fresh.length === 1 && !activeGroupId) {
                            setActiveGroupId(fresh[0].id);
                            localStorage.setItem("activeGroupId", fresh[0].id);
                        }
                    } catch (err) {
                        console.warn('[HouseholdContext] realtime reload failed', err?.message);
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user, supabase]);

    // ── 3. Switch to a kitchen (sets view to 'kitchen' or 'public') ──
    const switchHousehold = useCallback((id) => {
        const view = id ? 'kitchen' : 'public';
        setActiveGroupId(id);
        setActiveView(view);
        if (id) localStorage.setItem("activeGroupId", id);
        else localStorage.removeItem("activeGroupId");
        localStorage.setItem("activeView", view);
    }, []);

    // ── 4. Switch view directly (My Recipes / Public View) ───────────
    const switchView = useCallback((view) => {
        setActiveView(view);
        localStorage.setItem("activeView", view);
        if (view !== 'kitchen') {
            setActiveGroupId("");
            localStorage.removeItem("activeGroupId");
        }
    }, []);

    const activeGroup = groups.find(g => g.id === activeGroupId) ?? null;
    const isPro = activeGroup?.group_type === 'pro_kitchen';

    return (
        <HouseholdContext.Provider value={{
            user,
            groups,
            activeGroupId,
            activeGroup,
            activeView,
            isPro,
            switchHousehold,
            switchView,
        }}>
            {children}
        </HouseholdContext.Provider>
    );
}

/** Hook — throws if used outside HouseholdProvider */
export function useHousehold() {
    const ctx = useContext(HouseholdContext);
    if (!ctx) throw new Error("useHousehold must be used inside <HouseholdProvider>");
    return ctx;
}
