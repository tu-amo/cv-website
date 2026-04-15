"use client";

import Link from "next/link";
import { logout } from "@/app/login/actions";
import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/lib/HouseholdContext";
import { Icon } from "@/components/icons";


// PretzelNav — M3 Top App Bar + Navigation Drawer
// ─────────────────────────────────────────────────────────────────────────────
export default function PretzelNav() {
    const [user, setUser]               = useState(undefined); // undefined = loading, null = confirmed guest
    const [displayName, setDisplayName] = useState(null);
    const [drawerOpen, setDrawerOpen]   = useState(false);
    const [scrolled, setScrolled]       = useState(false);

    const supabase  = useMemo(() => createClient(), []);
    const pathname  = usePathname();
    const router    = useRouter();
    const { groups, activeGroupId, activeView, isPro, switchHousehold, switchView } =
        useHousehold();

    // ── Close drawer on route change ──────────────────────────────────────
    useEffect(() => { setDrawerOpen(false); }, [pathname]);

    // ── Body scroll-lock when drawer is open ─────────────────────────────
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [drawerOpen]);

    // ── Scrolled state for top-bar elevation shadow ───────────────────────
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ── Password recovery redirect ────────────────────────────────────────
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") router.push("/login/reset-password");
        });
        return () => subscription.unsubscribe();
    }, [supabase, router]);

    // ── Auth state ────────────────────────────────────────────────────────
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles").select("display_name").eq("id", user.id).maybeSingle();
                setDisplayName(profile?.display_name ?? user.email.split("@")[0]);
            } else {
                setDisplayName(null);
            }
        };
        getUser();
    }, [supabase, pathname]);

    // Still waiting for auth check to complete — render nothing to avoid flash
    if (user === undefined) return null;

    const initial = displayName?.charAt(0).toUpperCase() ?? "?";
    const isActive = (href) => href === "/" ? pathname === "/" : pathname.startsWith(href);

    const closeDrawer = () => setDrawerOpen(false);

    // ── Guest shell — no account yet, show minimal nav ────────────────
    if (!user) {
        return (
            <header
                className={`pp-top-bar${scrolled ? " pp-top-bar--scrolled" : ""}`}
                role="banner"
            >
                <div className="pp-top-bar__leading" style={{ width: 48 }} />
                <div className="pp-top-bar__title">
                    <Link
                        href="/"
                        aria-label="Pretzel Prep home"
                        style={{ color: "var(--pp-salt)", display: "flex", alignItems: "center" }}
                    >
                        <img src="/logo-wheat.svg" alt="Pretzel Prep" width={60} height={60} style={{ display: 'block' }} />
                    </Link>
                </div>
                <div className="pp-top-bar__trailing">
                    <Link
                        href="/login"
                        className="pp-btn-tonal"
                        style={{
                            fontSize: "0.8rem",
                            padding: "7px 18px",
                            marginRight: 8,
                            borderRadius: "var(--pp-radius-pill)",
                        }}
                    >
                        Sign in
                    </Link>
                </div>
            </header>
        );
    }

    return (
        <>
            {/* ══════════════════════════════════════════════════════════
                TOP APP BAR
                Hamburger (left) · Pretzel (centre) · Avatar (right)
            ══════════════════════════════════════════════════════════ */}
            <header
                className={`pp-top-bar${scrolled ? " pp-top-bar--scrolled" : ""}`}
                role="banner"
            >
                {/* Leading — hamburger */}
                <div className="pp-top-bar__leading">
                    <button
                        id="pp-drawer-toggle"
                        className="pp-icon-btn"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Open navigation menu"
                        aria-expanded={drawerOpen}
                        aria-controls="pp-nav-drawer"
                        style={{ color: "var(--pp-salt)" }}
                    >
                        {Icon.menu}
                    </button>
                </div>

                {/* Centre — pretzel logo links home */}
                <div className="pp-top-bar__title">
                    <Link
                        href="/"
                        aria-label="Pretzel Prep home"
                        style={{ color: "var(--pp-salt)", display: "flex", alignItems: "center" }}
                        onClick={closeDrawer}
                    >
                        <img src="/logo-wheat.svg" alt="Pretzel Prep" width={48} height={48} style={{ display: 'block' }} />
                    </Link>
                </div>

                {/* Trailing — avatar links to profile */}
                <div className="pp-top-bar__trailing">
                    <Link
                        href="/profile"
                        aria-label={`Profile — ${displayName}`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "var(--md-sys-color-primary-container)",
                            color: "var(--md-sys-color-on-primary-container)",
                            fontFamily: "var(--pp-font-brand)",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textDecoration: "none",
                            transition: "opacity var(--pp-motion-fast)",
                            flexShrink: 0,
                        }}
                    >
                        {initial}
                    </Link>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════════
                DRAWER SCRIM — click to close
            ══════════════════════════════════════════════════════════ */}
            <div
                className={`pp-drawer-scrim${drawerOpen ? " open" : ""}`}
                onClick={closeDrawer}
                aria-hidden="true"
            />

            {/* ══════════════════════════════════════════════════════════
                NAVIGATION DRAWER
            ══════════════════════════════════════════════════════════ */}
            <nav
                id="pp-nav-drawer"
                className={`pp-drawer${drawerOpen ? " open" : ""}`}
                aria-label="Main navigation"
                aria-hidden={!drawerOpen}
            >
                {/* Header: logo + wordmark + close */}
                <div className="pp-drawer__header" style={{ justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src="/logo-wheat.svg" alt="" aria-hidden="true" width={54} height={54} style={{ display: 'block' }} />
                        <span style={{
                            fontFamily: "var(--pp-font-brand)",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            color: "var(--pp-salt)",
                            letterSpacing: "-0.01em",
                        }}>
                            Pretzel Prep
                        </span>
                    </div>
                    <button
                        className="pp-icon-btn"
                        onClick={closeDrawer}
                        aria-label="Close navigation menu"
                        style={{ color: "var(--pp-text-meta)" }}
                    >
                        {Icon.close}
                    </button>
                </div>

                {/* ── SECTION: Browse as ─────────────────────────────── */}
                <div className="pp-drawer__section-label">Browse as</div>

                {/* Public view */}
                <button
                    className={`pp-drawer__item${activeView === "public" ? " active" : ""}`}
                    onClick={() => { switchHousehold(""); closeDrawer(); router.push('/'); }}
                >
                    <span className="pp-drawer__item-icon">{Icon.globe}</span>
                    Public Cookbook
                </button>

                {/* My Recipes */}
                <button
                    className={`pp-drawer__item${activeView === "mine" ? " active" : ""}`}
                    onClick={() => { switchView("mine"); closeDrawer(); router.push('/'); }}
                >
                    <span className="pp-drawer__item-icon">{Icon.person}</span>
                    My Recipes
                </button>

                {/* Private kitchens */}
                {groups.length > 0 && (
                    <>
                        {groups.map((g) => {
                            const isPro = g.group_type === "pro_kitchen";
                            const isActiveGroup =
                                activeGroupId === g.id && activeView === "kitchen";
                            return (
                                <button
                                    key={g.id}
                                    className={`pp-drawer__item${isActiveGroup ? " active" : ""}`}
                                onClick={() => { switchHousehold(g.id); closeDrawer(); router.push('/'); }}
                                    style={isPro && !isActiveGroup
                                        ? { color: "var(--pp-pro-accent)" }
                                        : undefined}
                                >
                                    <span className="pp-drawer__item-icon">
                                        {isPro ? Icon.building : Icon.house}
                                    </span>
                                    {g.name}
                                    {isPro && (
                                        <span style={{
                                            marginLeft: "auto",
                                            fontSize: "0.58rem",
                                            fontWeight: 700,
                                            letterSpacing: "0.08em",
                                            color: "var(--pp-pro-accent)",
                                            background: "var(--pp-pro-accent-dim)",
                                            padding: "2px 7px",
                                            borderRadius: 20,
                                        }}>
                                            PRO
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </>
                )}

                <div className="pp-drawer__divider" />

                {/* ── SECTION: Pages ─────────────────────────────────── */}
                <div className="pp-drawer__section-label">Pages</div>


                <Link
                    href="/shopping"
                    className={`pp-drawer__item${isActive("/shopping") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.cart}</span>
                    Market
                </Link>

                <div className="pp-drawer__divider" />

                {/* ── SECTION: Free Tools ─────────────────────────────── */}
                <div className="pp-drawer__section-label">Free Tools</div>

                <Link
                    href="/tools/recipe-scaler"
                    className={`pp-drawer__item${isActive("/tools/recipe-scaler") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.switch}</span>
                    Recipe Scaler
                </Link>

                <Link
                    href="/tools/nutrition-calculator"
                    className={`pp-drawer__item${isActive("/tools/nutrition-calculator") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.scan}</span>
                    Nutrition Calculator
                </Link>

                <div className="pp-drawer__divider" />

                {/* ── SECTION: Account ───────────────────────────────── */}
                <div className="pp-drawer__section-label">Account</div>

                <Link
                    href="/profile"
                    className={`pp-drawer__item${isActive("/profile") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.person}</span>
                    Profile Settings
                </Link>

                <Link
                    href="/household"
                    className={`pp-drawer__item${isActive("/household") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.house}</span>
                    Manage Households
                </Link>

                <Link
                    href="/system"
                    className={`pp-drawer__item${isActive("/system") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.monitor}</span>
                    System Info
                    <span style={{
                        marginLeft: "auto",
                        fontSize: "0.62rem",
                        fontFamily: "monospace",
                        color: "var(--pp-text-meta)",
                        fontWeight: 600,
                    }}>
                        {process.env.NEXT_PUBLIC_BUILD_TIME
                            ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME)
                                .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                            : "dev"}
                    </span>
                </Link>

                <div className="pp-drawer__divider" />

                {/* ── Sign Out ───────────────────────────────────────── */}
                <button
                    className="pp-drawer__item"
                    onClick={() => logout()}
                    style={{ color: "var(--md-sys-color-error)" }}
                >
                    <span className="pp-drawer__item-icon">{Icon.logout}</span>
                    Sign Out
                </button>

                {/* Bottom spacer for safe area */}
                <div style={{ height: 16 }} />
            </nav>
        </>
    );
}
