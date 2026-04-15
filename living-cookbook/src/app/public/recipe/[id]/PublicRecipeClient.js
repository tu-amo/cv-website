"use client";

import { useState } from "react";
import Link from "next/link";
import { scaleText, formatQuantity } from "@/lib/recipe-utils";
import IngredientsList from "@/components/IngredientsList";
import RecipeSteps from "@/components/RecipeSteps";
import RecipeNotes from "@/components/RecipeNotes";
import GlossaryModal from "@/components/GlossaryModal";
import TimerWidget from "@/components/TimerWidget";
import ImageCarousel from "@/components/ImageCarousel";

/**
 * Public recipe page — read-only shell.
 * Mirrors the logged-in recipe detail page layout exactly (same CSS classes).
 * All data is fetched server-side and passed as props.
 * Unauthenticated users: no edit, no shopping list, no notes editing.
 */
export default function PublicRecipeClient({
    recipe,
    ingredients: initialIngredients,
    steps: initialSteps,
    notes,
    resolvedFirstImageUrl,
}) {
    const [ingredients, setIngredients] = useState(initialIngredients);
    const [steps, setSteps] = useState(initialSteps);
    const [currentServings, setCurrentServings] = useState(recipe?.servings || 1);
    const [showInGrams, setShowInGrams] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTerm, setActiveTerm] = useState(null);

    // Timer state
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerInterval, setTimerInterval] = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const startTimer = (minutes) => {
        if (timerInterval) clearInterval(timerInterval);
        setIsTimerRunning(true);
        let seconds = minutes * 60;
        setRemainingSeconds(seconds);
        const interval = setInterval(() => {
            seconds -= 1;
            setRemainingSeconds(seconds);
            if (seconds <= 0) {
                clearInterval(interval);
                setIsTimerRunning(false);
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/937/937-preview.mp3");
                audio.play().catch(() => {});
                if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
            }
        }, 1000);
        setTimerInterval(interval);
    };

    const pauseResetTimer = () => {
        if (timerInterval && remainingSeconds > 0) {
            clearInterval(timerInterval);
            setTimerInterval(null);
            setIsTimerRunning(false);
        } else {
            setRemainingSeconds(0);
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(Math.max(0, secs) / 60).toString().padStart(2, "0");
        const s = (Math.max(0, secs) % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const toggleIngredient = (idx) => {
        const updated = [...ingredients];
        updated[idx].checked = !updated[idx].checked;
        setIngredients(updated);
    };

    const setStepActive = (idx) => {
        setSteps(steps.map((s, i) => {
            if (i < idx) return { ...s, status: "completed" };
            if (i === idx) return { ...s, status: "active" };
            return { ...s, status: "pending" };
        }));
    };

    // Anon users can't add to their shopping list — prompt sign-in
    const handleAddToShoppingList = () => {
        showToast("Sign in to save ingredients to your Market list 🛒");
    };

    const addToGoogleCalendar = () => {
        const title = encodeURIComponent(`Cook: ${recipe.title}`);
        const url = typeof window !== "undefined" ? window.location.href : "";
        const details = encodeURIComponent(`Recipe: ${recipe.title}\nLink: ${url}\n\nPlanned via The Living Cookbook`);
        const totalMinutes = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0) || 60;
        const startDate = new Date();
        startDate.setHours(18, 0, 0, 0);
        const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);
        const fmt = (d) => d.toISOString().replace(/-|:|\.\d+/g, "");
        window.open(
            `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${fmt(startDate)}/${fmt(endDate)}`,
            "_blank"
        );
    };

    // Build image list — first image pre-resolved server-side for LCP
    const rawImages = recipe.images?.length > 0 ? recipe.images : (recipe.image ? [recipe.image] : []);
    const images = resolvedFirstImageUrl && rawImages.length > 0
        ? [resolvedFirstImageUrl, ...rawImages.slice(1)]
        : rawImages;

    // Source line: "Book Title · by Author"
    const sourceLine = [
        recipe.sources?.book_title,
        recipe.sources?.author ? `by ${recipe.sources.author}` : null,
    ].filter(Boolean).join(" · ");

    // Frosted glass action button style — matches logged-in recipe page
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

    return (
        <div className="recipe-detail-wrapper" data-title={recipe.title}>

            {/* ── HERO ─────────────────────────────────────────── */}
            <div className="recipe-hero-block">
                <div className="recipe-hero">
                    <div className="recipe-hero-media">
                        <ImageCarousel images={images} title={recipe.title} type="hero" />
                    </div>
                    <div className="recipe-hero-overlay" />
                    <div className="recipe-hero-scroll-hint">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                </div>

                {/* Title + actions overlaid on hero */}
                <div className="recipe-hero-text">
                    <h1 className="font-heading">{recipe.title}</h1>
                    <div className="recipe-hero-bottom">

                        <div className="recipe-hero-meta">
                            {sourceLine && (
                                <span style={{ fontSize: "0.85rem", color: "var(--color-accent-amber)", fontWeight: 600 }}>
                                    {sourceLine}
                                </span>
                            )}
                            <span style={{
                                fontSize: "0.72rem",
                                color: "rgba(235,220,178,0.45)",
                                fontStyle: "italic",
                                fontWeight: 400,
                            }}>
                                🌍 Shared Recipe
                            </span>
                        </div>

                        <div className="recipe-hero-actions">
                            <button onClick={() => window.print()} style={btnStyle}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                Print
                            </button>
                            <button onClick={addToGoogleCalendar} style={btnStyle}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Plan Meal
                            </button>
                            <Link
                                href="/"
                                style={{ ...btnStyle, background: "var(--color-accent-amber)", color: "var(--color-bg-deep-olive)", border: "none", fontWeight: 700 }}
                            >
                                Open in App →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── UTILITY BAR: Prep · Cook · Serve ─────────────── */}
            <div className="recipe-stat-strip">
                <div className="recipe-stat-info-group">
                    <span>Prep</span>
                    <strong>{recipe.prep_time_minutes || 0} mins</strong>

                    <span className="recipe-stat-sep">·</span>

                    <span>Cook</span>
                    <strong>{recipe.cook_time_minutes || 0} mins</strong>

                    <span className="recipe-stat-sep">·</span>

                    <span>Serve</span>
                    <div className="recipe-stat-controls">
                        <button
                            onClick={() => setCurrentServings(Math.max(1, currentServings - 1))}
                            className="recipe-stat-btn"
                        >−</button>
                        <strong>{currentServings}</strong>
                        <button
                            onClick={() => setCurrentServings(currentServings + 1)}
                            className="recipe-stat-btn"
                        >+</button>
                    </div>

                    <span className="recipe-stat-sep">·</span>

                    <button
                        onClick={() => setShowInGrams(g => !g)}
                        className="recipe-stat-link-btn"
                    >
                        {showInGrams ? "↺ Reset layout" : "Convert for scale"}
                    </button>
                </div>
            </div>

            {/* ── PANELS ────────────────────────────────────────── */}
            <div className="recipe-panels">

                {/* LEFT — content (ingredients · method · notes) */}
                <div className="recipe-left">

                    <section>
                        <h2 className="pp-section-heading">Ingredients</h2>
                        <IngredientsList
                            ingredients={ingredients}
                            currentServings={currentServings}
                            originalServings={recipe.servings}
                            shoppingListItems={[]}
                            onToggle={toggleIngredient}
                            onAddToList={handleAddToShoppingList}
                            showInGrams={showInGrams}
                            onToggleGrams={() => setShowInGrams(g => !g)}
                            hideToggle={true}
                        />
                    </section>

                    <section>
                        <h2 className="pp-section-heading">Method</h2>
                        <RecipeSteps
                            steps={steps.map(s => ({
                                ...s,
                                instruction_text: scaleText(s.instruction_text, currentServings / (recipe.servings || 1)),
                            }))}
                            onStepClick={setStepActive}
                            onTimerClick={startTimer}
                            onTermClick={setActiveTerm}
                        />
                    </section>

                    {/* Notes — read-only for public viewers */}
                    <RecipeNotes notes={notes} isEditable={false} />

                    <footer style={{ marginTop: "60px", padding: "20px 0", borderTop: "1px solid var(--color-divider)", opacity: 0.5, fontSize: "0.85rem" }}>
                        Shared from <span style={{ color: "var(--color-accent-amber)" }}>The Living Cookbook</span>
                        {" · "}
                        <Link href="/" style={{ color: "var(--color-accent-amber)", textDecoration: "none" }}>Join the kitchen →</Link>
                    </footer>
                </div>

                {/* RIGHT — description (conditional) */}
                {recipe.description && (
                    <div className="recipe-right">
                        <p className="recipe-description">{recipe.description}</p>
                    </div>
                )}
            </div>

            <TimerWidget
                remainingSeconds={remainingSeconds}
                isTimerRunning={isTimerRunning}
                onClick={pauseResetTimer}
                formatTime={formatTime}
            />
            <GlossaryModal activeTerm={activeTerm} onClose={() => setActiveTerm(null)} />
            {toast && <div className="toast" role="alert" aria-live="assertive">{toast}</div>}
        </div>
    );
}
