"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { scaleText, formatQuantity } from "@/lib/recipe-utils";
import { useHousehold } from "@/lib/HouseholdContext";
import IngredientsList from "@/components/IngredientsList";
import RecipeSteps from "@/components/RecipeSteps";
import RecipeNotes from "@/components/RecipeNotes";
import GlossaryModal from "@/components/GlossaryModal";
import TimerWidget from "@/components/TimerWidget";
import ImageCarousel from "@/components/ImageCarousel";
import NutritionPanel from "@/components/NutritionPanel";
import PlanProductionModal from "@/components/PlanProductionModal";

export default function RecipePage({ params }) {
    const unwrappedParams = use(params);
    const recipeId = unwrappedParams.id;

    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [shoppingListItems, setShoppingListItems] = useState([]);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentServings, setCurrentServings] = useState(1);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTerm, setActiveTerm] = useState(null);
    const [showInGrams, setShowInGrams] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false); // PK1
    const [tier, setTier] = useState("free");

    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const { isPro, activeGroupId } = useHousehold();
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerInterval, setTimerInterval] = useState(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', user.id).single();
                    if (profile) setTier(profile.tier);
                }

                const [recipeRes, ingsRes, stepsRes, notesRes] = await Promise.all([
                    supabase.from("recipes")
                        .select("*, sources(*), updated_by_profile:profiles!updated_by(display_name)")
                        .eq("id", recipeId).single(),
                    supabase.from("recipe_ingredients").select("*, ingredients(name)").eq("recipe_id", recipeId).order('sort_order', { ascending: true }),
                    supabase.from("instruction_steps").select("*").eq("recipe_id", recipeId).order("step_number", { ascending: true }),
                    supabase.from("recipe_notes").select("*").eq("recipe_id", recipeId).order("created_at", { ascending: false }),
                ]);
                if (recipeRes.data) {
                    setRecipe(recipeRes.data);
                    setCurrentServings(recipeRes.data.servings || 1);
                    document.title = `${recipeRes.data.title} — The Living Cookbook`;
                }
                if (ingsRes.data) setIngredients(ingsRes.data.map(i => ({ ...i, checked: false })));
                if (stepsRes.data) setSteps(stepsRes.data.map((s, idx) => ({ ...s, status: idx === 0 ? 'active' : 'pending' })));
                if (notesRes.data) setNotes(notesRes.data);
                const { data: listItems } = await supabase.from("shopping_list").select("item_name").eq("recipe_id", recipeId);
                if (listItems) setShoppingListItems(listItems.map(li => li.item_name));
            } finally { setLoading(false); }
        }
        loadData();
    }, [recipeId]);

    useEffect(() => {
        return () => { if (timerInterval) clearInterval(timerInterval); };
    }, [timerInterval]);

    const toggleIngredient = (idx) => {
        const newIngs = [...ingredients];
        newIngs[idx].checked = !newIngs[idx].checked;
        setIngredients(newIngs);
    };

    const setStepActive = (idx) => {
        setSteps(steps.map((s, i) => {
            if (i < idx) return { ...s, status: 'completed' };
            if (i === idx) return { ...s, status: 'active' };
            return { ...s, status: 'pending' };
        }));
    };

    const playTimerEndSound = () => {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/937/937-preview.mp3");
        let count = 1;
        audio.addEventListener('ended', () => { if (count < 3) { count++; audio.play().catch(() => {}); } });
        audio.play().catch(() => {});
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    };

    const startTimer = (minutes) => {
        if (timerInterval) clearInterval(timerInterval);
        setIsTimerRunning(true);
        let seconds = minutes * 60;
        setRemainingSeconds(seconds);
        const interval = setInterval(() => {
            seconds -= 1;
            setRemainingSeconds(seconds);
            if (seconds <= 0) { clearInterval(interval); setIsTimerRunning(false); playTimerEndSound(); }
        }, 1000);
        setTimerInterval(interval);
    };

    const pauseResetTimer = () => {
        if (timerInterval && remainingSeconds > 0) {
            clearInterval(timerInterval); setTimerInterval(null); setIsTimerRunning(false);
        } else { setRemainingSeconds(0); }
    };

    const formatTime = (secs) => {
        const m = Math.floor(Math.max(0, secs) / 60).toString().padStart(2, "0");
        const s = (Math.max(0, secs) % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const copyShareLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/public/recipe/${recipeId}`);
        setToast("Link copied! 📋"); setTimeout(() => setToast(null), 3000);
    };

    const addToGoogleCalendar = () => {
        const title = encodeURIComponent(`Cook: ${recipe.title}`);
        const url = `${window.location.origin}/public/recipe/${recipeId}`;
        const details = encodeURIComponent(`Recipe: ${recipe.title}\nLink: ${url}`);
        const totalMinutes = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0) || 60;
        const startDate = new Date(); startDate.setHours(18, 0, 0, 0);
        const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);
        const fmt = (d) => d.toISOString().replace(/-|:|\\.\\d+/g, "");
        window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${fmt(startDate)}/${fmt(endDate)}`, "_blank");
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSavingNote(true);
        const { data, error } = await supabase.from("recipe_notes").insert([{ recipe_id: recipeId, content: newNote.trim() }]).select().single();
        setIsSavingNote(false);
        if (error) setToast("Error saving note. ⚠️");
        else { setNotes([data, ...notes]); setNewNote(""); setToast("Note added! 📝"); }
        setTimeout(() => setToast(null), 3000);
    };

    const handleDeleteNote = async (id) => {
        const { error } = await supabase.from("recipe_notes").delete().eq("id", id);
        if (error) setToast("Error deleting note. ⚠️");
        else { setNotes(notes.filter(n => n.id !== id)); setToast("Note deleted. 🗑️"); }
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddToShoppingList = async (ing) => {
        const name = ing.ingredients?.name || ing.display_name;
        if (!name || shoppingListItems.includes(name)) return;
        const scaledQty = formatQuantity(ing.quantity, currentServings, recipe.servings || 1);
        if ("vibrate" in navigator) navigator.vibrate(50);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setToast("Sign in to add items to your list."); setTimeout(() => setToast(null), 3000); return; }

        const { error } = await supabase.from("shopping_list").insert([{
            item_name: name,
            quantity: scaledQty,
            unit: ing.unit,
            recipe_id: recipeId,
            user_id: user.id,
            group_id: null   // always adds to Personal list; use the Shopping page to move to a household list
        }]);
        if (error) setToast("Failed to add item. ⚠️");
        else { setShoppingListItems(prev => [...prev, name]); setToast(`Added ${scaledQty} ${ing.unit || ""} ${name} to list! 🛒`); }
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) return (
        <div className="recipe-detail-wrapper">
            <div className="recipe-title-bar" style={{ padding: "22px 5% 18px" }}>
                <div className="recipe-title-left">
                    <div style={{ height: "34px", width: "55%", borderRadius: "6px", background: "var(--color-surface-hover)", animation: "skeleton-shimmer 1.5s infinite" }} />
                    <div style={{ height: "16px", width: "35%", borderRadius: "4px", background: "var(--color-surface-hover)", animation: "skeleton-shimmer 1.5s infinite" }} />
                </div>
            </div>
            <div className="recipe-panels">
                <div className="recipe-left" />
                <div className="recipe-right" style={{ background: "var(--color-surface)" }} />
            </div>
        </div>
    );

    if (!recipe) return <div style={{ color: "var(--color-text-papyrus)", padding: "40px" }}>Recipe not found.</div>;

    const images = recipe.images?.length > 0 ? recipe.images : (recipe.image ? [recipe.image] : []);

    // Action button style — frosted glass for hero overlay
    const btnStyle = {
        fontSize: "0.78rem", padding: "5px 12px",
        background: "rgba(0, 0, 0, 0.38)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "8px", cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: "5px",
        color: "rgba(235, 220, 178, 0.92)", textDecoration: "none",
        transition: "all 0.18s ease", whiteSpace: "nowrap",
    };

    // Source line: "Book Title · by Author"
    const sourceLine = [
        recipe.sources?.book_title,
        recipe.sources?.author ? `by ${recipe.sources.author}` : null
    ].filter(Boolean).join(" · ");

    return (
        <div className="recipe-detail-wrapper" data-title={recipe.title}>

            {/* ── HERO & HEADER ANCHOR ─────────────────────── */}
            <div className="recipe-hero-block">
                <div className="recipe-hero">

                    {/* Background: carousel fills the full hero */}
                    <div className="recipe-hero-media">
                        <ImageCarousel images={images} title={recipe.title} type="hero" />
                    </div>

                    {/* Gradient scrim: transparent → dark */}
                    <div className="recipe-hero-overlay" />

                    {/* Animated scroll hint — bottom centre */}
                    <div className="recipe-hero-scroll-hint">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                </div>

                {/* ── HEADER CONTENT: Title, Source & Actions ── */}
                {/* Note: CSS handles the responsive switch (Absolute Overlay on Desktop / Stacked on Mobile) */}
                <div className="recipe-hero-text">
                    <h1 className="font-heading">{recipe.title}</h1>

                    <div className="recipe-hero-bottom">

                        {/* Pill badge: total time · servings */}
                        <div className="recipe-hero-pill">
                            {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                             · 
                            {currentServings} {currentServings === 1 ? 'serving' : 'servings'}
                        </div>

                        {/* Left: source + updated-by stacked */}
                        <div className="recipe-hero-meta">
                            {sourceLine && (
                                <a
                                    href={`/add?id=${recipe.id}`}
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "var(--color-accent-amber)",
                                        fontWeight: 600,
                                        textDecoration: "none",
                                        transition: "opacity 0.15s ease",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    title="Edit source details"
                                >
                                    {sourceLine}
                                </a>
                            )}
                            {recipe.updated_by_profile?.display_name && (
                                <span style={{
                                    fontSize: "0.72rem",
                                    color: "rgba(235,220,178,0.45)",
                                    fontStyle: "italic",
                                    fontWeight: 400,
                                }}>
                                    Updated by {recipe.updated_by_profile.display_name}
                                </span>
                            )}
                        </div>

                        {/* Right: action buttons — aligned with source line */}
                        <div className="recipe-hero-actions">
                            <button onClick={() => window.print()} style={btnStyle}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                Print
                            </button>
                            <button onClick={copyShareLink} style={btnStyle}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                Share
                            </button>
                            <Link href={`/add?id=${recipe.id}`} style={btnStyle}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                Edit
                            </Link>
                            <button onClick={addToGoogleCalendar} style={btnStyle}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Plan Meal
                            </button>
                            {/* PK1: Plan Production button — Pro Kitchen only */}
                            {isPro && (
                                <button
                                    onClick={() => setShowPlanModal(true)}
                                    style={{
                                        ...btnStyle,
                                        background: 'rgba(0,200,150,0.12)',
                                        border: '1px solid rgba(0,200,150,0.35)',
                                        color: '#00c896',
                                    }}
                                >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                    Plan Production
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── STAT STRIP: triptych ───────────────────────── */}
            <div className="recipe-stat-strip">
                <div className="recipe-stat-triptych">

                    {/* Prep */}
                    <div className="recipe-stat-cell">
                        <span className="recipe-stat-cell__value">
                            {recipe.prep_time_minutes || 0} min
                        </span>
                        <span className="recipe-stat-cell__label">Prep</span>
                    </div>

                    {/* Cook */}
                    <div className="recipe-stat-cell">
                        <span className="recipe-stat-cell__value">
                            {recipe.cook_time_minutes || 0} min
                        </span>
                        <span className="recipe-stat-cell__label">Cook</span>
                    </div>

                    {/* Servings */}
                    <div className="recipe-stat-cell">
                        <div className="recipe-stat-stepper">
                            <button
                                className="recipe-stat-stepper__btn"
                                onClick={() => setCurrentServings(Math.max(1, currentServings - 1))}
                                aria-label="Decrease servings"
                            >−</button>
                            <span className="recipe-stat-cell__value">{currentServings}</span>
                            <button
                                className="recipe-stat-stepper__btn"
                                onClick={() => setCurrentServings(currentServings + 1)}
                                aria-label="Increase servings"
                            >+</button>
                        </div>
                        <span className="recipe-stat-cell__label">Servings</span>
                    </div>

                </div>
            </div>

            <div className="recipe-panels">

                {/* ── LEFT PANEL ─────────────────────────────── */}
                <div className="recipe-left">

                    {/* Ingredients */}
                    <section>
                        <h2 className="section-title section-title--ingredients">Ingredients</h2>
                        <IngredientsList
                            ingredients={ingredients}
                            currentServings={currentServings}
                            originalServings={recipe.servings}
                            shoppingListItems={shoppingListItems}
                            onToggle={toggleIngredient}
                            onAddToList={handleAddToShoppingList}
                            showInGrams={showInGrams}
                            onToggleGrams={() => setShowInGrams(g => !g)}
                        />
                    </section>

                    {/* Method */}
                    <section>
                        <h2 className="section-title section-title--method">Method</h2>
                        <RecipeSteps
                            steps={steps.map(s => ({ ...s, instruction_text: scaleText(s.instruction_text, currentServings / (recipe.servings || 1)) }))}
                            onStepClick={setStepActive}
                            onTimerClick={startTimer}
                            onTermClick={setActiveTerm}
                        />
                    </section>

                    {/* Kitchen Notes */}
                    <RecipeNotes
                        notes={notes} isEditable={true}
                        newNote={newNote} setNewNote={setNewNote}
                        onAddNote={handleAddNote} onDeleteNote={handleDeleteNote}
                        isSavingNote={isSavingNote}
                    />
                </div>

                {/* ── RIGHT PANEL — always visible, sticky ────── */}
                <div className="recipe-right">

                    {/* Nutrition panel moved here from between stat-strip and panels */}
                    <NutritionPanel
                        ingredients={ingredients}
                        currentServings={currentServings}
                        originalServings={recipe.servings || 1}
                        recipeId={recipe.id}
                        tier={tier}
                    />

                    {/* Description in italic below nutrition */}
                    {recipe.description && (
                        <p className="recipe-description">{recipe.description}</p>
                    )}
                </div>

            </div>

            {/* ── Overlays ──────────────────────────────────────── */}
            <TimerWidget remainingSeconds={remainingSeconds} isTimerRunning={isTimerRunning} onClick={pauseResetTimer} formatTime={formatTime} />
            <GlossaryModal activeTerm={activeTerm} onClose={() => setActiveTerm(null)} />
            {toast && <div className="toast" role="alert" aria-live="assertive">{toast}</div>}

            {/* PK1/PK2: Plan Production modal — Pro Kitchen only */}
            {showPlanModal && (
                <PlanProductionModal
                    recipe={recipe}
                    groupId={activeGroupId}
                    onClose={() => setShowPlanModal(false)}
                    onCreated={(plan) => {
                        setShowPlanModal(false);
                        router.push(`/kitchen/plans/${plan.id}`);
                    }}
                />
            )}
        </div>
    );
}
