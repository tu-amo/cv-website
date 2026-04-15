"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import RecipeCard from "@/components/RecipeCard";
import { useHousehold } from "@/lib/HouseholdContext";
import { Icon } from "@/components/icons";

export default function GalleryPage() {
  const supabase = useMemo(() => createClient(), []);
  const { user: ctxUser, groups, activeGroupId, activeView } = useHousehold();

  const [user, setUser]               = useState(undefined);
  const [displayName, setDisplayName] = useState(null);
  const [recipes, setRecipes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [query, setQuery]             = useState('');
  const [titleVisible, setTitleVisible] = useState(true);

  // ── Auth + display name ───────────────────────────────────────────
  useEffect(() => {
    if (ctxUser === undefined) return;
    setUser(ctxUser);
    if (ctxUser) {
      supabase
        .from('profiles').select('display_name').eq('id', ctxUser.id).maybeSingle()
        .then(({ data: profile }) => {
          setDisplayName(profile?.display_name ?? ctxUser.email.split('@')[0]);
        });
    } else {
      setDisplayName(null);
    }
  }, [ctxUser, supabase]);

  // ── Dynamic title ─────────────────────────────────────────────────
  const firstName = displayName?.split(' ')[0];
  const activeGroupName = groups.find(g => g.id === activeGroupId)?.name;
  const dynamicTitle = (() => {
    if (activeView === 'mine' && firstName) return `${firstName}'s Cookbook`;
    if (activeView === 'kitchen' && activeGroupName) return activeGroupName;
    return 'Pretzel Prep';
  })();

  const dynamicSubtitle = (() => {
    if (activeView === 'mine') return `Your personal recipe collection`;
    if (activeView === 'kitchen' && activeGroupName) return `${activeGroupName} kitchen recipes`;
    return 'Discover community recipes';
  })();

  // Animate title on view change
  useEffect(() => {
    setTitleVisible(false);
    const t = setTimeout(() => setTitleVisible(true), 180);
    return () => clearTimeout(t);
  }, [activeView, activeGroupId]);

  // ── Load recipes when view or group changes ───────────────────────
  useEffect(() => {
    if (user === undefined) return;
    loadRecipes();
  }, [activeView, activeGroupId, user]);

  const loadRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase.from('recipes').select('*, sources(*), recipe_ingredients(ingredients(name))');

      if (activeView === 'mine') {
        if (!user) return;
        q = q.eq('user_id', user.id);
      } else if (activeView === 'kitchen') {
        if (!user || !activeGroupId) { setRecipes([]); setLoading(false); return; }
        q = q.eq('group_id', activeGroupId);
      } else {
        // public
        q = q.eq('is_public', true);
      }

      const { data, error: dbErr } = await q.order('created_at', { ascending: false });
      if (dbErr) throw dbErr;
      setRecipes(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = query.trim()
    ? recipes.filter(r => {
        const q = query.toLowerCase();
        return (
          r.title?.toLowerCase().includes(q) ||
          (r.tags || []).some(t => t.toLowerCase().includes(q)) ||
          r.sources?.name?.toLowerCase().includes(q) ||
          r.sources?.author?.toLowerCase().includes(q) ||
          r.recipe_ingredients?.some(ri => ri.ingredients?.name?.toLowerCase().includes(q))
        );
      })
    : recipes;

  const searchPlaceholder =
    activeView === 'mine' ? 'Search your recipes…' :
    activeView === 'kitchen' ? `Search ${activeGroupName ?? 'kitchen'} recipes…` :
    'Search public recipes…';

  if (user === undefined) return null;

  return (
    <div className="view-gallery">

      {/* ══════════════════════════════════════════════════
          CARD WRAPPER — same as recipe-detail-wrapper
      ══════════════════════════════════════════════════ */}
      <div className="home-wrapper">

      {/* ══════════════════════════════════════════════════
          HERO BANNER — logo · title · search
      ══════════════════════════════════════════════════ */}
      <div className="home-hero">
        {/* Scattered pretzel background tile */}
        <div className="home-hero__pattern" aria-hidden="true" />

        <div className="home-hero__content">
          {/* Logo */}
          <img src="/logo-wheat.svg" alt="Pretzel Prep" className="home-hero__logo" />

          {/* Dynamic title */}
          <h1
            className="home-hero__title"
            style={{
              transition: 'opacity 0.18s ease, transform 0.18s ease',
              opacity: titleVisible ? 1 : 0,
              transform: titleVisible ? 'translateY(0)' : 'translateY(-6px)',
            }}
          >
            {dynamicTitle}
          </h1>

          {/* Subtitle + count */}
          <p
            className="home-hero__subtitle"
            style={{ transition: 'opacity 0.22s ease', opacity: titleVisible ? 1 : 0 }}
          >
            {dynamicSubtitle}
            {!loading && recipes.length > 0 && (
              <span> · {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}</span>
            )}
          </p>

          {/* Search bar */}
          <div className="home-hero__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" style={{ opacity: 0.5, flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="gallery-search-input"
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search recipes"
            />
          </div>

          {/* Unauthenticated join CTA */}
          {!user && (
            <div className="home-hero__join">
              🥨 Want to save your own recipes?{' '}
              <Link href="/signup">Join Pretzel Prep →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          CONTENT — recipe grid
      ══════════════════════════════════════════════════ */}
      <div className="home-content">

        {/* No kitchen selected */}
        {activeView === 'kitchen' && !activeGroupId && (
          <div className="empty-state">
            <div className="empty-state-icon">{Icon.house}</div>
            <h2 className="empty-state-title">Select a kitchen from the menu</h2>
            <p className="empty-state-text">Choose which kitchen's recipes you'd like to browse.</p>
          </div>
        )}

        {/* Recipe grid */}
        {error ? (
          <p style={{ color: 'var(--color-accent-amber)', textAlign: 'center' }}>{error}</p>
        ) : loading ? (
          <div className="recipe-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-block" style={{ height: '220px' }} />
                <div style={{ padding: '24px' }}>
                  <div className="skeleton-block" style={{ height: '28px', width: '75%', borderRadius: '6px', marginBottom: '12px' }} />
                  <div className="skeleton-block" style={{ height: '16px', width: '50%', borderRadius: '6px', marginBottom: '16px' }} />
                  <div className="skeleton-block" style={{ height: '22px', width: '35%', borderRadius: '12px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (activeView !== 'kitchen' || activeGroupId) && (
          <div className="recipe-grid">
            {filteredRecipes.length === 0 ? (
              /* ── UX-4 — empty state ───────────────────────────────────── */
              /* Branched: guided first-run vs. generic no-results */
              !query && activeView === 'mine' && recipes.length === 0 ? (
                /* GUIDED FIRST-RUN — new user, 0 recipes */
                <div className="empty-state" style={{ maxWidth: 480, margin: '0 auto' }}>
                  <div className="empty-state-icon">
                    <img src="/logo-wheat.svg" alt="" aria-hidden="true" width={64} height={64} style={{ opacity: 0.7 }} />
                  </div>
                  <h2 className="empty-state-title">Welcome to Pretzel Prep 👋</h2>
                  <p className="empty-state-text" style={{ marginBottom: 'var(--space-6)' }}>
                    Your cookbook is empty. Add your first recipe in one of these ways:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', maxWidth: 340, margin: '0 auto' }}>
                    <Link href="/add" className="btn-add-recipe" id="empty-state-type-btn"
                      style={{ justifyContent: 'center', textAlign: 'center' }}>
                      {Icon.pencil}
                      Type a Recipe
                    </Link>
                    <Link href="/add?mode=scan" className="btn-add-recipe" id="empty-state-scan-btn"
                      style={{ justifyContent: 'center', textAlign: 'center', background: 'var(--color-surface-container)', color: 'var(--color-on-surface)', border: '1px solid var(--color-hairline)' }}>
                      {Icon.scan}
                      Scan a Recipe Photo
                    </Link>
                    <button
                      className="btn-add-recipe"
                      id="empty-state-browse-btn"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          // Switch to public view via HouseholdContext via click on drawer item
                          // For now: navigate to root with ?view=public
                          window.location.href = '/';
                        }
                      }}
                      style={{ justifyContent: 'center', textAlign: 'center', background: 'transparent', color: 'var(--color-on-surface-muted)', border: '1px solid var(--color-hairline)', cursor: 'pointer' }}
                    >
                      {Icon.globe}
                      Browse Public Library
                    </button>
                  </div>
                </div>
              ) : (
                /* GENERIC NO-RESULTS — search or kitchen empty */
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)"
                      strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <h2 className="empty-state-title">
                    {query ? 'No recipes found'
                      : activeView === 'mine' ? 'Your cookbook is empty'
                      : activeView === 'kitchen' ? 'No kitchen recipes yet'
                      : 'No public recipes yet'}
                  </h2>
                  <p className="empty-state-text">
                    {query
                      ? `No recipes match "${query}".`
                      : activeView === 'mine'
                        ? 'Start building your living cookbook by adding your first recipe.'
                        : activeView === 'kitchen'
                          ? 'No recipes have been shared with this kitchen yet.'
                          : 'Be the first to share a recipe with the world.'}
                  </p>
                  {!query && user && (
                    <Link href="/add" className="btn-add-recipe" style={{ marginTop: 'var(--space-4)' }}>
                      {Icon.plus}
                      Add Recipe
                    </Link>
                  )}
                </div>
              )

            ) : filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                hrefOverride={!user && activeView !== 'mine' && activeView !== 'kitchen'
                  ? `/public/recipe/${recipe.id}`
                  : undefined}
              />
            ))}
          </div>
        )}
      </div>

      </div>{/* end .home-wrapper */}

      {/* ── FAB: Add Recipe ─────────────────────────────────────── */}
      {user && (
        <Link href="/add" id="pp-fab-add-recipe" className="pp-fab"
          aria-label="Add new recipe" title="Add Recipe">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
        </Link>
      )}
    </div>
  );
}
