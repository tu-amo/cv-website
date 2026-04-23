"use client";

import Link from "next/link";
import { logout } from "@/app/login/actions";
import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/lib/HouseholdContext";
import { Icon } from "@/components/icons";

// ─── Module-level sub-components (stable references — no remount issues) ─────

function LogoToggle({ drawerOpen, onToggle }) {
    return (
        <button
            id="pp-drawer-toggle"
            className="pp-icon-btn"
            onClick={onToggle}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="pp-nav-drawer"
            style={{
                padding: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
            }}
        >
            <img src="/logo-wheat.svg" alt="Pretzel Prep menu" width={40} height={40} style={{ display: "block" }} />
        </button>
    );
}

function DrawerCloseBtn({ onClose }) {
    return (
        <button
            className="pp-icon-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{ color: "var(--pp-text-meta)" }}
        >
            {Icon.close}
        </button>
    );
}

function DrawerHeader({ onClose }) {
    return (
        <div className="pp-drawer__header" style={{ justifyContent: "space-between" }}>
            <Link
                href="/"
                onClick={onClose}
                style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
            >
                <img src="/logo-wheat.svg" alt="" aria-hidden="true" width={54} height={54} style={{ display: "block" }} />
                <span style={{
                    fontFamily: "var(--pp-font-brand)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--pp-salt)",
                    letterSpacing: "-0.01em",
                }}>
                    Pretzel Prep
                </span>
            </Link>
            <DrawerCloseBtn onClose={onClose} />
        </div>
    );
}

// ─── Main nav component ───────────────────────────────────────────────────────

export default function PretzelNav() {
    // ── user comes from HouseholdContext (single onAuthStateChange listener) ──
    // DO NOT add a second supabase.auth.onAuthStateChange here — it causes
    // "Lock broken by another request with the 'steal' option" (AbortError).
    const { user, groups, activeGroupId, activeView, switchHousehold, switchView } =
        useHousehold();

    const [displayName, setDisplayName] = useState(null);
    const [drawerOpen, setDrawerOpen]   = useState(false);
    const [scrolled, setScrolled]       = useState(false);

    // Minimal supabase client — only for displayName fetch + password recovery
    const supabase = useMemo(() => createClient(), []);
    const pathname = usePathname();
    const router   = useRouter();

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

    // ── Password recovery redirect (narrow listener — no auth state update) ─
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") router.push("/login/reset-password");
        });
        return () => subscription.unsubscribe();
    }, [supabase, router]);

    // ── Display name — fetch once when user identity is known ────────────
    useEffect(() => {
        if (!user) { setDisplayName(null); return; }
        supabase
            .from("profiles").select("display_name").eq("id", user.id).maybeSingle()
            .then(({ data: profile }) => {
                setDisplayName(profile?.display_name ?? user.email.split("@")[0]);
            });
    }, [supabase, user]);

    // Still waiting for HouseholdContext auth check — render nothing to avoid flash
    if (user === undefined) return null;

    const initial      = displayName?.charAt(0).toUpperCase() ?? "?";
    const isActive     = (href) => href === "/" ? pathname === "/" : pathname.startsWith(href);
    const closeDrawer  = () => setDrawerOpen(false);
    const toggleDrawer = () => setDrawerOpen((o) => !o);

    // ─────────────────────────────────────────────────────────────────────
    //  GUEST — top bar + full navigation drawer
    // ─────────────────────────────────────────────────────────────────────
    if (!user) {
        return (
            <>
                <header
                    className={`pp-top-bar${scrolled ? " pp-top-bar--scrolled" : ""}`}
                    role="banner"
                >
                    <div className="pp-top-bar__leading">
                        <LogoToggle drawerOpen={drawerOpen} onToggle={toggleDrawer} />
                    </div>
                    <div className="pp-top-bar__title" />
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

                {/* Scrim */}
                <div
                    className={`pp-drawer-scrim${drawerOpen ? " open" : ""}`}
                    onClick={closeDrawer}
                    aria-hidden="true"
                />

                {/* Guest drawer */}
                <nav
                    id="pp-nav-drawer"
                    className={`pp-drawer${drawerOpen ? " open" : ""}`}
                    aria-label="Main navigation"
                    aria-hidden={!drawerOpen}
                >
                    <DrawerHeader onClose={closeDrawer} />

                    <div className="pp-drawer__section-label">Browse</div>

                    <Link
                        href="/"
                        className={`pp-drawer__item${pathname === "/" ? " active" : ""}`}
                        onClick={closeDrawer}
                    >
                        <span className="pp-drawer__item-icon">{Icon.globe}</span>
                        Public Cookbook
                    </Link>

                    <Link
                        href="/sources"
                        className={`pp-drawer__item${isActive("/sources") ? " active" : ""}`}
                        onClick={closeDrawer}
                    >
                        <span className="pp-drawer__item-icon">{Icon.book}</span>
                        Sources
                    </Link>

                    <div className="pp-drawer__divider" />

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

                    <div className="pp-drawer__section-label">Account</div>

                    <Link
                        href="/login"
                        className={`pp-drawer__item${isActive("/login") ? " active" : ""}`}
                        onClick={closeDrawer}
                    >
                        <span className="pp-drawer__item-icon">{Icon.person}</span>
                        Sign In
                    </Link>

                    <Link
                        href="/signup"
                        className={`pp-drawer__item${isActive("/signup") ? " active" : ""}`}
                        onClick={closeDrawer}
                    >
                        <span className="pp-drawer__item-icon">{Icon.plus}</span>
                        Create Account
                    </Link>

                    <div style={{ height: 16 }} />
                </nav>
            </>
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    //  AUTHENTICATED — logo left, avatar right, full drawer
    // ─────────────────────────────────────────────────────────────────────
    return (
        <>
            <header
                className={`pp-top-bar${scrolled ? " pp-top-bar--scrolled" : ""}`}
                role="banner"
            >
                <div className="pp-top-bar__leading">
                    <LogoToggle drawerOpen={drawerOpen} onToggle={toggleDrawer} />
                </div>

                {/* Centre — empty (logo now lives on the left) */}
                <div className="pp-top-bar__title" />

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

            {/* Scrim */}
            <div
                className={`pp-drawer-scrim${drawerOpen ? " open" : ""}`}
                onClick={closeDrawer}
                aria-hidden="true"
            />

            {/* Navigation drawer */}
            <nav
                id="pp-nav-drawer"
                className={`pp-drawer${drawerOpen ? " open" : ""}`}
                aria-label="Main navigation"
                aria-hidden={!drawerOpen}
            >
                <DrawerHeader onClose={closeDrawer} />

                <div className="pp-drawer__section-label">Browse as</div>

                <button
                    className={`pp-drawer__item${activeView === "public" ? " active" : ""}`}
                    onClick={() => { switchHousehold(""); closeDrawer(); router.push('/'); }}
                >
                    <span className="pp-drawer__item-icon">{Icon.globe}</span>
                    Public Cookbook
                </button>

                <button
                    className={`pp-drawer__item${activeView === "mine" ? " active" : ""}`}
                    onClick={() => { switchView("mine"); closeDrawer(); router.push('/'); }}
                >
                    <span className="pp-drawer__item-icon">{Icon.person}</span>
                    My Recipes
                </button>

                {groups.length > 0 && (
                    <>
                        {groups.map((g) => {
                            const isProGroup    = g.group_type === "pro_kitchen";
                            const isActiveGroup = activeGroupId === g.id && activeView === "kitchen";
                            return (
                                <button
                                    key={g.id}
                                    className={`pp-drawer__item${isActiveGroup ? " active" : ""}`}
                                    onClick={() => { switchHousehold(g.id); closeDrawer(); router.push('/'); }}
                                    style={isProGroup && !isActiveGroup ? { color: "var(--pp-pro-accent)" } : undefined}
                                >
                                    <span className="pp-drawer__item-icon">
                                        {isProGroup ? Icon.building : Icon.house}
                                    </span>
                                    {g.name}
                                    {isProGroup && (
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

                <div className="pp-drawer__section-label">Pages</div>

                <Link
                    href="/create"
                    className={`pp-drawer__item${isActive("/create") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.plus}</span>
                    Add Recipe
                </Link>

                <Link
                    href="/shopping"
                    className={`pp-drawer__item${isActive("/shopping") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.cart}</span>
                    Market
                </Link>

                <Link
                    href="/sources"
                    className={`pp-drawer__item${isActive("/sources") ? " active" : ""}`}
                    onClick={closeDrawer}
                >
                    <span className="pp-drawer__item-icon">{Icon.book}</span>
                    Sources
                </Link>

                <div className="pp-drawer__divider" />

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

                <button
                    className="pp-drawer__item"
                    onClick={() => logout()}
                    style={{ color: "var(--md-sys-color-error)" }}
                >
                    <span className="pp-drawer__item-icon">{Icon.logout}</span>
                    Sign Out
                </button>

                <div style={{ height: 16 }} />
            </nav>
        </>
    );
}
