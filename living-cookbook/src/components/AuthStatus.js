"use client";

import Link from "next/link";
import { logout } from "@/app/login/actions";
import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/lib/HouseholdContext";

const NAV_LINKS = [
    {
        href: '/',
        label: 'Library',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
        )
    },
    {
        href: '/shopping',
        label: 'Market',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
        )
    },
    {
        href: '/household',
        label: 'Households',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        )
    },
];

export default function AuthStatus() {
    const [user, setUser] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);
    
    const supabase = useMemo(() => createClient(), []);
    const pathname = usePathname();
    const router = useRouter();
    const { groups, activeGroupId, activeGroup, activeView, isPro, switchHousehold, switchView } = useHousehold();

    // Close menus on outside click
    useEffect(() => {
        const handleClick = () => {
            setLeftOpen(false);
            setRightOpen(false);
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Detect hash-based PASSWORD_RECOVERY events
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') router.push('/login/reset-password');
        });
        return () => subscription.unsubscribe();
    }, [supabase, router]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles').select('display_name').eq('id', user.id).maybeSingle();
                setDisplayName(profile?.display_name ?? user.email.split('@')[0]);
            } else {
                setDisplayName(null);
            }
        };
        getUser();
    }, [supabase, pathname]);

    if (!user) return null;

    const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <nav className="nav-header">

            {/* ── Left: Home & Household Switcher ─────────── */}
            <div className="nav-left">
                {/* Home Button */}
                <Link 
                    href="/" 
                    className={`nav-dropdown-trigger ${pathname === '/' ? 'active' : ''}`}
                    style={{ 
                        textDecoration: 'none', 
                        marginRight: '4px',
                        color: 'var(--color-text-papyrus)' 
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </Link>

                {/* Dropdown trigger label — reflects current view */}
                <div 
                    className={`nav-dropdown-trigger ${leftOpen ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setLeftOpen(!leftOpen); setRightOpen(false); }}
                >
                    <span className="font-heading" style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: activeView === 'kitchen' && isPro ? '#00c896' : 'var(--color-text-papyrus)',
                        letterSpacing: '0.01em',
                        display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                        {/* Icon */}
                        {activeView === 'public' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                        )}
                        {activeView === 'mine' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                        )}
                        {activeView === 'kitchen' && !isPro && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                        )}
                        {activeView === 'kitchen' && isPro && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 0-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>
                            </svg>
                        )}
                        {/* Label */}
                        {activeView === 'public' && 'The Living Cookbook'}
                        {activeView === 'mine' && 'My Recipes'}
                        {activeView === 'kitchen' && (activeGroup?.name ?? 'Kitchen')}
                    </span>
                    <svg style={{ opacity: 0.6, color: 'var(--color-accent-amber)' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>

                    {/* ── Redesigned dropdown ────────────────────────────────── */}
                    <div className={`nav-dropdown-menu left ${leftOpen ? 'open' : ''}`}>

                        {/* PUBLIC VIEW */}
                        <div className="nav-menu-label">Public View</div>
                        <button
                            onClick={() => switchHousehold("")}
                            className={`nav-menu-item ${activeView === 'public' ? 'active' : ''}`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            The Living Cookbook
                        </button>

                        {/* ALL YOUR RECIPES — only when logged in */}
                        {user && (<>
                            <div className="nav-menu-divider" />
                            <div className="nav-menu-label">All Your Recipes</div>
                            <button
                                onClick={() => switchView('mine')}
                                className={`nav-menu-item ${activeView === 'mine' ? 'active' : ''}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                                My Recipes
                            </button>
                        </>) }

                        {/* YOUR PRIVATE KITCHENS — only when logged in and has groups */}
                        {user && groups.length > 0 && (<>
                            <div className="nav-menu-divider" />
                            <div className="nav-menu-label">Your Private Kitchens</div>
                            {groups.map(g => {
                                const isProKitchen = g.group_type === 'pro_kitchen';
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => switchHousehold(g.id)}
                                        className={`nav-menu-item ${activeGroupId === g.id && activeView === 'kitchen' ? 'active' : ''}`}
                                        style={isProKitchen ? { color: '#00c896' } : {}}
                                    >
                                        {isProKitchen ? (
                                            /* Building icon for Pro Kitchen */
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 0-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>
                                            </svg>
                                        ) : (
                                            /* House icon for Household */
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                                            </svg>
                                        )}
                                        {g.name}
                                        {isProKitchen && (
                                            <span style={{
                                                marginLeft: 'auto',
                                                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em',
                                                color: '#00c896', background: 'rgba(0,200,150,0.14)',
                                                padding: '1px 6px', borderRadius: '20px',
                                            }}>PRO</span>
                                        )}
                                    </button>
                                );
                            })}
                        </>)}
                    </div>
                </div>
            </div>

            {/* ── Right: Consolidated Menu ─────────────────── */}
            <div className="nav-right">
                <div 
                    className={`nav-dropdown-trigger ${rightOpen ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setRightOpen(!rightOpen); setLeftOpen(false); }}
                    style={{ padding: '0 8px' }}
                >
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-accent-amber), #b8860b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: 'var(--color-bg-deep-olive)',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                        {displayName?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <svg style={{ opacity: 0.5 }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>

                    {/* Right Menu: Navigation + Profile + Logout */}
                    <div className={`nav-dropdown-menu right ${rightOpen ? 'open' : ''}`}>
                        
                        <div className="nav-menu-label">Browse</div>
                        {NAV_LINKS.filter(l => l.label !== 'Households').map(({ href, label, icon }) => (
                            <Link key={href} href={href} className={`nav-menu-item ${isActive(href) ? 'active' : ''}`}>
                                {icon} {label}
                            </Link>
                        ))}

                        <div className="nav-menu-divider" />
                        <div className="nav-menu-label">Account</div>
                        
                        <Link href="/profile" className={`nav-menu-item ${pathname === '/profile' ? 'active' : ''}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Profile Settings
                        </Link>

                        <Link href="/household" className={`nav-menu-item ${pathname === '/household' ? 'active' : ''}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            Manage Households
                        </Link>

                        <div className="nav-menu-divider" />
                        <div className="nav-menu-label">System</div>

                        <Link href="/system" className={`nav-menu-item ${pathname === '/system' ? 'active' : ''}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                            System Info
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '0.62rem',
                                fontFamily: 'monospace',
                                color: 'rgba(212,175,55,0.5)',
                                fontWeight: 600,
                            }}>
                                {process.env.NEXT_PUBLIC_BUILD_TIME
                                    ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                    : 'dev'
                                }
                            </span>
                        </Link>

                        <div className="nav-menu-divider" />
                        
                        <button onClick={() => logout()} className="nav-menu-item danger">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
