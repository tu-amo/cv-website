"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CookingModePage({ params }) {
    const unwrappedParams = use(params);
    const recipeId = unwrappedParams.id;

    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [steps, setSteps] = useState([]);

    // Timer State
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerInterval, setTimerInterval] = useState(null);

    useEffect(() => {
        async function loadData() {
            // 1. Fetch main recipe
            const { data: rec } = await supabase.from("recipes").select("*, sources(*)").eq("id", recipeId).single();
            if (rec) setRecipe(rec);

            // 2. Fetch joined ingredients
            const { data: ings } = await supabase.from("recipe_ingredients")
                .select("*, ingredients(name)")
                .eq("recipe_id", recipeId);

            if (ings) setIngredients(ings.map(i => ({ ...i, checked: false })));

            // 3. Fetch steps
            const { data: stps } = await supabase.from("instruction_steps")
                .select("*")
                .eq("recipe_id", recipeId)
                .order("step_number", { ascending: true });

            if (stps) setSteps(stps.map((s, idx) => ({ ...s, status: idx === 0 ? 'active' : 'pending' })));
        }
        loadData();
    }, [recipeId]);

    // UI Handlers
    const toggleIngredient = (idx) => {
        const newIngs = [...ingredients];
        newIngs[idx].checked = !newIngs[idx].checked;
        setIngredients(newIngs);
    };

    const setStepActive = (idx) => {
        const newSteps = steps.map((s, i) => {
            if (i < idx) return { ...s, status: 'completed' };
            if (i === idx) return { ...s, status: 'active' };
            return { ...s, status: 'pending' };
        });
        setSteps(newSteps);
    };

    // Timer Logic
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
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // Safe Highlight Renderer (parses simple "[min] minutes" text into clickable spans)
    // For prototype simplicity, we just look for numbers followed by "minutes"
    const renderStepText = (text) => {
        const regex = /(\d+)\s+minutes?/g;
        const parts = text.split(regex);

        if (parts.length <= 1) return text;

        // Quick parse to inject clickable spans
        const result = [];
        let i = 0;
        while (i < parts.length) {
            result.push(parts[i]); // The text
            if (i + 1 < parts.length) {
                const numStr = parts[i + 1];
                result.push(
                    <span key={i} className="highlight" onClick={(e) => { e.stopPropagation(); startTimer(parseInt(numStr)); }}>
                        {numStr} minutes
                    </span>
                );
            }
            i += 2;
        }
        return result;
    };

    if (!recipe) return <div style={{ color: "var(--color-text-papyrus)", padding: "40px" }}>Loading Recipe Book...</div>;

    return (
        <div className="view-cooking" style={{ display: "flex", width: "100%", height: "100vh" }}>

            {/* Left Pane */}
            <div className="cooking-left">
                <img src={recipe.image} alt={recipe.title} className="cooking-img" />
                <div className="cooking-img-overlay"></div>
                <Link href="/" className="btn-back">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Library
                </Link>
            </div>

            {/* Right Pane */}
            <div className="cooking-right">
                <header className="cooking-header">
                    <div className="cooking-reference" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        {recipe.sources ? (
                            <>
                                <span style={{ fontWeight: 600, color: "var(--color-accent-amber)" }}>
                                    {recipe.sources.book_title || "Unknown Source"} {recipe.page_number ? ` (p. ${recipe.page_number})` : ""}
                                </span>
                                {(recipe.sources.author || recipe.sources.publisher) && (
                                    <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                                        {recipe.sources.author && `By ${recipe.sources.author}`}
                                        {recipe.sources.author && recipe.sources.publisher && ' • '}
                                        {recipe.sources.publisher && `Published by ${recipe.sources.publisher}`}
                                    </span>
                                )}
                                {recipe.sources.link && (
                                    <a href={recipe.sources.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", color: "var(--color-accent-amber)", textDecoration: "underline" }}>
                                        Visit Original Recipe &rarr;
                                    </a>
                                )}
                            </>
                        ) : (
                            <span style={{ fontStyle: "italic", opacity: 0.6 }}>No source specified</span>
                        )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "15px" }}>
                        <h1 className="cooking-title font-heading" style={{ marginBottom: 0 }}>{recipe.title}</h1>
                        <Link href={`/add?id=${recipe.id}`} className="btn-scan" style={{ fontSize: "0.9rem", padding: "8px 16px", textDecoration: "none", borderRadius: "20px" }}>
                            ✏️ Edit Recipe
                        </Link>
                    </div>
                    <div className="cooking-meta-row" style={{ marginTop: "20px" }}>
                        <span><strong>Prep:</strong> {recipe.prep_time_minutes || 0} mins</span>
                        <span><strong>Cook:</strong> {recipe.cook_time_minutes || 0} mins</span>
                        <span><strong>Serves:</strong> {recipe.servings || "-"}</span>
                    </div>
                </header>

                {/* Ingredients */}
                <section>
                    <h2 className="section-title font-heading">Ingredients</h2>
                    <ul className="ingredients-list">
                        {ingredients.map((ing, idx) => (
                            <li key={idx} className={`ingredient-item ${ing.checked ? "checked" : ""}`} onClick={() => toggleIngredient(idx)}>
                                <div className="checkbox"></div>
                                <span className="ingredient-text">
                                    {ing.quantity || ""} {ing.unit || ""} {ing.ingredients?.name} {ing.preparation_note ? `, ${ing.preparation_note}` : ""}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Steps */}
                <section>
                    <h2 className="section-title font-heading">Method</h2>
                    <div className="steps-list">
                        {steps.map((step, idx) => (
                            <div key={idx} className={`step-card ${step.status}`} onClick={() => setStepActive(idx)}>
                                <span className="step-number">{step.step_number}</span>
                                <p className="step-text">{renderStepText(step.instruction_text)}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Timer Widget */}
            {(remainingSeconds > 0 || isTimerRunning) && (
                <div className="timer-widget" onClick={pauseResetTimer}>
                    <div className="timer-ring" style={{ animation: isTimerRunning ? "pulse 2s infinite linear" : "none", borderColor: remainingSeconds === 0 ? "red" : "" }}></div>
                    <div className="timer-time font-heading">{formatTime(remainingSeconds)}</div>
                    <div className="timer-label">{remainingSeconds === 0 ? "Ready!" : (isTimerRunning ? "Running" : "Paused")}</div>
                </div>
            )}
        </div>
    );
}
