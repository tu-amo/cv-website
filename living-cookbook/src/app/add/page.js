"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AddRecipeForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");

    const [title, setTitle] = useState("");
    const [bookTitle, setBookTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [publisher, setPublisher] = useState("");
    const [pageNumber, setPageNumber] = useState("");
    const [link, setLink] = useState("");
    const [prepTime, setPrepTime] = useState("");
    const [cookTime, setCookTime] = useState("");
    const [servings, setServings] = useState("");
    const [previousServings, setPreviousServings] = useState(null);

    const [ingredients, setIngredients] = useState([
        { id: Date.now(), qty: "", unit: "", name: "", prep: "" },
    ]);
    const [steps, setSteps] = useState([{ id: Date.now(), text: "" }]);

    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    useEffect(() => {
        if (editId) {
            async function loadRecipe() {
                const { data: recipe } = await supabase.from("recipes").select("*, sources(*)").eq("id", editId).single();
                if (recipe) {
                    setTitle(recipe.title || "");
                    setPrepTime(recipe.prep_time_minutes || "");
                    setCookTime(recipe.cook_time_minutes || "");
                    setServings(recipe.servings || "");
                    setPageNumber(recipe.page_number || "");

                    if (recipe.sources) {
                        setBookTitle(recipe.sources.book_title || "");
                        setAuthor(recipe.sources.author || "");
                        setPublisher(recipe.sources.publisher || "");
                        setLink(recipe.sources.link || "");
                    }
                }

                // Load ingredients
                const { data: recipeIngs } = await supabase.from("recipe_ingredients").select("*, ingredients(name)").eq("recipe_id", editId);
                if (recipeIngs && recipeIngs.length > 0) {
                    setIngredients(recipeIngs.map(ri => ({
                        id: Math.random(),
                        qty: ri.quantity || "",
                        unit: ri.unit || "",
                        name: ri.ingredients?.name || "",
                        prep: ri.preparation_note || ""
                    })));
                }

                // Load steps
                const { data: recipeSteps } = await supabase.from("instruction_steps").select("*").eq("recipe_id", editId).order('step_number', { ascending: true });
                if (recipeSteps && recipeSteps.length > 0) {
                    setSteps(recipeSteps.map(rs => ({ id: Math.random(), text: rs.instruction_text })));
                }
            }
            loadRecipe();
        }
    }, [editId]);

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { id: Date.now(), qty: "", unit: "", name: "", prep: "" }]);
    };

    const updateIngredient = (index, field, value) => {
        const newIngs = [...ingredients];
        newIngs[index][field] = value;
        setIngredients(newIngs);
    };

    const handleAddStep = () => {
        setSteps([...steps, { id: Date.now(), text: "" }]);
    };

    const updateStep = (index, value) => {
        const newSteps = [...steps];
        newSteps[index].text = value;
        setSteps(newSteps);
    };

    const handleScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);

        // Detect file type
        const mimeType = file.type || "image/jpeg";

        try {
            // Read file as base64 string
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result.replace('data:', '').replace(/^.+,/, '');

                const response = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64String, mimeType })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to process scan. Server responded with: ${errorText}`);
                }

                const data = await response.json();

                // Populate Form with AI Data
                setTitle(data.title || "");
                if (data.source) {
                    setBookTitle(data.source.bookTitle || "");
                    setAuthor(data.source.author || "");
                    setPublisher(data.source.publisher || "");
                    setPageNumber(data.source.pageNumber || "");
                    setLink(data.source.link || "");
                }
                setPrepTime(data.prepTime?.toString() || "");
                setCookTime(data.cookTime?.toString() || "");
                setServings(data.servings?.toString() || "");

                if (data.ingredients && data.ingredients.length > 0) {
                    const mappedIngs = data.ingredients.map((ing, i) => ({
                        id: Date.now() + i,
                        qty: ing.qty?.toString() || "",
                        unit: ing.unit || "",
                        name: ing.name || "",
                        prep: ing.prep || ""
                    }));
                    setIngredients(mappedIngs);
                }

                if (data.steps && data.steps.length > 0) {
                    const mappedSteps = data.steps.map((step, i) => ({
                        id: Date.now() + 100 + i,
                        text: step
                    }));
                    setSteps(mappedSteps);
                }

                setIsScanning(false);
            };

            reader.readAsDataURL(file);

        } catch (error) {
            console.error("Scanning Error:", error);
            alert("Error scanning recipe. Please try again or check API keys.");
            setIsScanning(false);
        }
    };

    // Measurement Standardization
    const handleStandardize = () => {
        const densityDatabase = {
            "all-purpose flour": 120, "flour": 120, "cake flour": 114, "bread flour": 127,
            "granulated sugar": 200, "sugar": 200, "white sugar": 200,
            "brown sugar": 220, "powdered sugar": 120, "confectioners sugar": 120,
            "butter": 227, "margarine": 227,
            "water": 236, "milk": 240, "buttermilk": 240,
            "heavy cream": 238, "light cream": 238,
            "honey": 340, "maple syrup": 322, "corn syrup": 328, "molasses": 337,
            "oil": 218, "olive oil": 218, "vegetable oil": 218, "canola oil": 218,
            "cocoa powder": 100, "baking powder": 192, "baking soda": 288,
            "salt": 273, "kosher salt": 192, "sea salt": 273,
            "vinegar": 240, "soy sauce": 240, "lemon juice": 236, "lime juice": 236,
            "vanilla extract": 208, "vanilla": 208,
            "rice": 185, "white rice": 185, "brown rice": 190,
            "oats": 90, "rolled oats": 90,
            "chocolate chips": 170, "almonds": 140, "walnuts": 120, "pecans": 110,
            "peanut butter": 250,
            "sour cream": 230, "yogurt": 245, "greek yogurt": 245,
            "sesame seeds": 144, "white sesame seeds": 144, "black sesame seeds": 144,
            "dry white wine": 240, "white wine": 240, "wine": 240,
            "beef stock": 240, "chicken stock": 240, "vegetable stock": 240,
            "beef broth": 240, "chicken broth": 240, "vegetable broth": 240,
            "stock": 240, "broth": 240,
            "tomato paste": 262, "tomato sauce": 245, "tomato puree": 245,
            "orzo": 175, "pasta": 170, "couscous": 175, "quinoa": 170,
            "lentils": 190, "dried lentils": 190, "breadcrumbs": 110
        };

        const volumeRatios = {
            "cup": 1, "cups": 1, "c": 1,
            "tbsp": 0.0625, "tablespoon": 0.0625, "tablespoons": 0.0625,
            "tsp": 0.02083, "teaspoon": 0.02083, "teaspoons": 0.02083,
            "fl oz": 0.125, "fluid ounce": 0.125
        };

        const newIngs = ingredients.map(ing => {
            if (!ing.qty || !ing.unit) return ing;

            // Skip already-converted ingredients (prep field contains "originally ...")
            if (ing.prep && ing.prep.toLowerCase().includes('originally')) return ing;

            const unit = ing.unit.toLowerCase().trim();
            const name = (ing.name || "").toLowerCase().trim();
            // Fix: normalise European-style comma decimals (e.g. "0,25" -> "0.25")
            let qty = parseFloat(String(ing.qty).replace(',', '.'));
            if (isNaN(qty)) return ing;

            // 0. Check for embedded weights in the prep field (e.g. "about 2 pounds")
            //    when unit is a size descriptor like large/medium/small
            const sizeUnits = ['large', 'medium', 'small', 'head', 'bunch'];
            if (sizeUnits.includes(unit) && ing.prep) {
                const weightMatch = ing.prep.match(/(\d+(?:\.\d+)?)\s*(lb|lbs|pound|pounds|oz|ounces?)/i);
                if (weightMatch) {
                    const weightVal = parseFloat(weightMatch[1]);
                    const weightUnit = weightMatch[2].toLowerCase();
                    const isLbs = ['lb', 'lbs', 'pound', 'pounds'].includes(weightUnit);
                    const grams = Math.round(weightVal * (isLbs ? 453.592 : 28.3495));
                    const cleanPrep = ing.prep.replace(/about\s*/i, '').replace(weightMatch[0], `${grams}g`).trim();
                    return { ...ing, qty: grams, unit: 'g', prep: cleanPrep };
                }
            }

            // 1. Check if already metric/uncountable
            if (['g', 'ml', 'kg', 'cloves', 'whole', 'pinch'].includes(unit)) {
                return ing;
            }

            // 2. Ounces (weight) to grams
            if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') {
                return { ...ing, qty: Math.round(qty * 28.3495), unit: 'g' };
            }

            // 2b. Pounds to grams
            if (unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds') {
                return { ...ing, qty: Math.round(qty * 453.592), unit: 'g' };
            }

            // 3. Volumes to weight based on density dictionary
            let densityPerCup = densityDatabase[name];

            // Try partial match if exact match fails
            if (!densityPerCup) {
                for (const [key, density] of Object.entries(densityDatabase)) {
                    if (name.includes(key)) {
                        densityPerCup = density;
                        break;
                    }
                }
            }

            if (!densityPerCup) return ing;

            const ratio = volumeRatios[unit];
            if (ratio) {
                const grams = Math.round((qty * ratio) * densityPerCup);
                const oldText = `(originally ${ing.qty} ${ing.unit})`;
                // Prevent duplicate notes
                const newPrep = ing.prep ? (ing.prep.includes("originally") ? ing.prep : `${ing.prep} ${oldText}`) : oldText;
                return { ...ing, qty: grams, unit: 'g', prep: newPrep };
            }

            return ing;
        });

        setIngredients(newIngs);

        // Standardize Steps Text
        const standardizeText = (text) => {
            let res = text;

            // Length Replace
            res = res.replace(/1\/4[\s-]?inch(es)?/gi, "6 mm");
            res = res.replace(/1\/2[\s-]?inch(es)?/gi, "1 cm");
            res = res.replace(/3\/4[\s-]?inch(es)?/gi, "2 cm");
            res = res.replace(/1[\s-]?inch(es)?/gi, "2.5 cm");
            res = res.replace(/2[\s-]?inch(es)?/gi, "5 cm");

            // Volume Replace
            res = res.replace(/1\/4\s+teaspoon(s)?/gi, "1 ml");
            res = res.replace(/1\/2\s+teaspoon(s)?/gi, "2.5 ml");
            res = res.replace(/1\s+teaspoon(s)?/gi, "5 ml");
            res = res.replace(/2\s+teaspoon(s)?/gi, "10 ml");

            res = res.replace(/1\/2\s+tablespoon(s)?/gi, "7.5 ml");
            res = res.replace(/1\s+tablespoon(s)?/gi, "15 ml");
            res = res.replace(/2\s+tablespoon(s)?/gi, "30 ml");

            // Temp Replace (F -> C) - handles: 400°F, 400 F, 400 degrees F
            res = res.replace(/(\d+)\s*(?:°\s*|degrees?\s*)F(?:ahrenheit)?/gi, (m, p1) => {
                const c = Math.round((parseInt(p1) - 32) * 5 / 9);
                return `${c}°C`;
            });

            return res;
        };

        const newSteps = steps.map(step => ({
            ...step,
            text: standardizeText(step.text)
        }));

        setSteps(newSteps);
    };

    // Servings Scaler Math
    const handleServingsChange = (e) => {
        const newServings = parseFloat(e.target.value);
        setServings(newServings);

        if (previousServings && newServings && previousServings !== newServings) {
            const ratio = newServings / previousServings;
            const newIngs = ingredients.map(ing => {
                if (ing.qty) {
                    const updatedQty = Math.round(parseFloat(ing.qty) * ratio);
                    return { ...ing, qty: updatedQty };
                }
                return ing;
            });
            setIngredients(newIngs);
        }
        setPreviousServings(newServings);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let finalRecipeId = editId;
            let finalSourceId = null;

            // Handle Source Insertion/Updating
            if (bookTitle || author || publisher || link) {
                const sourceData = {
                    book_title: bookTitle || "Untitled Source",
                    author,
                    publisher,
                    link
                };

                if (editId) {
                    const { data: checkRec } = await supabase.from("recipes").select("source_id").eq("id", editId).single();
                    if (checkRec && checkRec.source_id) {
                        await supabase.from("sources").update(sourceData).eq("id", checkRec.source_id);
                        finalSourceId = checkRec.source_id;
                    } else {
                        const { data: newSrc } = await supabase.from("sources").insert([sourceData]).select().single();
                        finalSourceId = newSrc?.id;
                    }
                } else {
                    const { data: newSrc } = await supabase.from("sources").insert([sourceData]).select().single();
                    finalSourceId = newSrc?.id;
                }
            }

            const recipeData = {
                title,
                prep_time_minutes: parseInt(prepTime) || 0,
                cook_time_minutes: parseInt(cookTime) || 0,
                servings: parseFloat(servings) || 0,
                image: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=2670",
                source_id: finalSourceId,
                page_number: pageNumber
            };

            if (editId) {
                // Update
                await supabase.from("recipes").update(recipeData).eq("id", editId);
                // Clear related rows for fresh insertion
                await supabase.from("recipe_ingredients").delete().eq("recipe_id", editId);
                await supabase.from("instruction_steps").delete().eq("recipe_id", editId);
            } else {
                // Create
                const { data: newRecipe, error } = await supabase.from("recipes").insert([recipeData]).select().single();
                if (error) throw error;
                finalRecipeId = newRecipe.id;
            }

            // Save Ingredients
            for (const ing of ingredients) {
                if (!ing.name) continue;

                let ingredientId;
                // Upsert dictionary ingredient
                const { data: existingIng } = await supabase.from("ingredients").select("id").eq("name", ing.name.toLowerCase().trim()).single();

                if (existingIng) {
                    ingredientId = existingIng.id;
                } else {
                    const { data: newIng } = await supabase.from("ingredients").insert([{ name: ing.name.toLowerCase().trim(), default_unit: ing.unit }]).select().single();
                    if (newIng) ingredientId = newIng.id;
                }

                if (ingredientId) {
                    await supabase.from("recipe_ingredients").insert([{
                        recipe_id: finalRecipeId,
                        ingredient_id: ingredientId,
                        quantity: parseFloat(ing.qty) || null,
                        unit: ing.unit,
                        preparation_note: ing.prep
                    }]);
                }
            }

            // Save Steps
            const validSteps = steps.filter(s => s.text.trim() !== "");
            for (let i = 0; i < validSteps.length; i++) {
                await supabase.from("instruction_steps").insert([{
                    recipe_id: finalRecipeId,
                    step_number: i + 1,
                    instruction_text: validSteps[i].text
                }]);
            }

            router.push("/");
        } catch (err) {
            console.error("Error saving recipe:", err);
            alert("Failed to save recipe to database");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) {
            // First click: arm the button
            setDeleteConfirm(true);
            // Auto-disarm after 4 seconds
            setTimeout(() => setDeleteConfirm(false), 4000);
            return;
        }
        // Second click: execute delete
        try {
            const { error: stepsErr } = await supabase.from("instruction_steps").delete().eq("recipe_id", editId);
            if (stepsErr) throw new Error(`Steps delete failed: ${stepsErr.message}`);

            const { error: ingsErr } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", editId);
            if (ingsErr) throw new Error(`Ingredients delete failed: ${ingsErr.message}`);

            const { error: recipeErr } = await supabase.from("recipes").delete().eq("id", editId);
            if (recipeErr) throw new Error(`Recipe delete failed: ${recipeErr.message}`);

            router.push("/");
            router.refresh();
        } catch (err) {
            console.error("Error deleting recipe:", err);
            alert("Failed to delete recipe. Please try again.");
        }
    };

    return (
        <div className="view-gallery" style={{ display: 'block' }}>
            <nav className="nav-bar" style={{ padding: '0 0 40px 0' }}>
                <Link href="/" className="nav-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Library
                </Link>
            </nav>

            <div className="form-container" style={{ margin: '0 auto' }}>
                <h1 className="font-heading" style={{ fontSize: "3rem", marginBottom: "20px" }}>
                    {editId ? "Edit Recipe" : "Add New Recipe"}
                </h1>

                <div className="scanner-panel">
                    <input type="file" id="scan-input" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleScan} />
                    <button type="button" className="btn-scan" onClick={() => document.getElementById("scan-input").click()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                            <path d="M12 12v9"></path>
                            <path d="m8 17 4-4 4 4"></path>
                        </svg>
                        Auto-fill from Photo (AI)
                    </button>
                    {isScanning && (
                        <div className="loader-text pulse-anim" style={{ display: "block" }}>
                            Uploading to AI... Extracting text...
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault(); }}>
                    <div className="form-group">
                        <label>Recipe Title</label>
                        <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grandma's Lasagna" required />
                    </div>

                    <div style={{ padding: "20px", background: "rgba(212, 175, 55, 0.02)", border: "1px dashed var(--color-divider)", borderRadius: "12px", marginBottom: "25px" }}>
                        <h3 style={{ color: "var(--color-accent-amber)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "15px" }}>Source Reference (Optional)</h3>
                        <div className="form-row" style={{ marginBottom: "15px" }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Book / Website Title</label>
                                <input type="text" className="form-control" value={bookTitle} onChange={e => setBookTitle(e.target.value)} placeholder="e.g. The Essentials of Classic Italian Cooking" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Author</label>
                                <input type="text" className="form-control" value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Marcella Hazan" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Publisher</label>
                                <input type="text" className="form-control" value={publisher} onChange={e => setPublisher(e.target.value)} placeholder="e.g. Alfred A. Knopf" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, flex: "0 0 120px" }}>
                                <label>Page #</label>
                                <input type="text" className="form-control" value={pageNumber} onChange={e => setPageNumber(e.target.value)} placeholder="e.g. 214" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>URL Link</label>
                                <input type="text" className="form-control" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Prep Time (mins)</label>
                            <input type="number" className="form-control" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Cook Time (mins)</label>
                            <input type="number" className="form-control" value={cookTime} onChange={e => setCookTime(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Servings</label>
                            <input type="number" className="form-control" value={servings} onFocus={() => setPreviousServings(servings)} onChange={handleServingsChange} />
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="form-group dynamic-list">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <label style={{ marginBottom: 0 }}>Ingredients</label>
                            <button type="button" onClick={handleStandardize} style={{ background: "none", border: "1px solid var(--color-accent-amber)", color: "var(--color-accent-amber)", borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s ease" }}>
                                ✨ Standardize to Metric
                            </button>
                        </div>
                        {ingredients.map((ing, i) => (
                            <div className="dynamic-item" key={ing.id}>
                                <input type="number" className="form-control" style={{ width: "110px" }} placeholder="Qty" value={ing.qty} onChange={e => updateIngredient(i, "qty", e.target.value)} />
                                <input type="text" className="form-control" style={{ width: "120px" }} placeholder="Unit" value={ing.unit} onChange={e => updateIngredient(i, "unit", e.target.value)} />
                                <input type="text" className="form-control" placeholder="Ingredient Name" value={ing.name} onChange={e => updateIngredient(i, "name", e.target.value)} />
                                <input type="text" className="form-control" placeholder="Prep" value={ing.prep} onChange={e => updateIngredient(i, "prep", e.target.value)} />
                            </div>
                        ))}
                        <button type="button" className="btn-add" onClick={handleAddIngredient}>+ Add another ingredient</button>
                    </div>

                    {/* Steps */}
                    <div className="form-group dynamic-list">
                        <label>Method Steps</label>
                        {steps.map((step, i) => (
                            <div className="dynamic-item" key={step.id}>
                                <textarea className="form-control step-input" placeholder={`Step ${i + 1}`} value={step.text} onChange={e => updateStep(i, e.target.value)}></textarea>
                            </div>
                        ))}
                        <button type="button" className="btn-add" onClick={handleAddStep}>+ Add another step</button>
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <button type="submit" className="btn-submit" disabled={isSubmitting} style={{ flex: 1 }}>
                            {isSubmitting ? "Saving to Cloud..." : editId ? "Update Recipe" : "Save Recipe to Library"}
                        </button>
                        {editId && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                style={{
                                    padding: "14px 22px",
                                    borderRadius: "12px",
                                    border: `2px solid ${deleteConfirm ? "#e53e3e" : "rgba(229,62,62,0.4)"}`,
                                    background: deleteConfirm ? "rgba(229,62,62,0.15)" : "transparent",
                                    color: deleteConfirm ? "#fc8181" : "rgba(229,62,62,0.7)",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    transition: "all 0.2s ease",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {deleteConfirm ? "⚠️ Confirm Delete?" : "🗑 Delete Recipe"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AddRecipePage() {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddRecipeForm />
        </Suspense>
    );
}
