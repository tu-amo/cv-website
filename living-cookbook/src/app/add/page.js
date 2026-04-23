"use client";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { standardizeText, standardizeIngredient, smartParseIngredient, scaleRecipe } from "@/lib/recipe-utils";
import ImageManager from "@/components/ImageManager";
import AuthStatus from "@/components/AuthStatus";
import SourceReferenceFields from "@/components/recipe-form/SourceReferenceFields";

function AddRecipeForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");

    const supabase = useMemo(() => createClient(), []);

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
    const [imageUrls, setImageUrls] = useState([]);
    const [aiImagesUsed, setAiImagesUsed] = useState(0);
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null); // single group — B1 (multi-household) not yet implemented
    const [isPublic, setIsPublic] = useState(false);
    // Derived: private when nothing is shared
    const isPrivate = !selectedGroupId && !isPublic;

    const [ingredients, setIngredients] = useState([
        { id: Date.now(), row_type: 'ingredient', qty: "", unit: "", name: "", prep: "" },
    ]);
    const [steps, setSteps] = useState([{ id: Date.now(), text: "" }]);

    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(!!editId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
    const [lastBrief, setLastBrief] = useState(null); // { hero, mise }
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, duration = 3000) => {
        setToast(msg);
        setTimeout(() => setToast(null), duration);
    };

    useEffect(() => {
        async function loadGroups() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("group_members").select("groups(id, name)");
            if (data) {
                // Deduplicate by group id — guards against duplicate group_members rows
                const seen = new Set();
                const unique = data.map(d => d.groups).filter(g => {
                    if (!g || seen.has(g.id)) return false;
                    seen.add(g.id);
                    return true;
                });
                setGroups(unique);
            }
        }
        loadGroups();
    }, []);

    useEffect(() => {
        if (editId) {
            async function loadRecipe() {
                try {
                    // B5: Verify authentication and ownership before loading the edit form.
                    // Redirect rather than show a 403-style inline error — avoids leaking
                    // recipe data to non-owners even briefly.
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    if (!currentUser) {
                        router.push('/login?next=/add?id=' + editId);
                        return;
                    }

                    const { data: recipe } = await supabase
                        .from("recipes")
                        // Explicit FK hint ensures the join works regardless of Supabase
                        // auto-detection — without it, sources(*) may silently return null
                        .select("*, sources!source_id(*)")
                        .eq("id", editId)
                        .single();

                    // B5: Ownership guard — only the recipe's owner may edit it.
                    // recipe.user_id is verified server-side by the JWT auth above.
                    if (!recipe || recipe.user_id !== currentUser.id) {
                        console.warn('[B5] Unauthorised edit attempt — redirecting to home.');
                        router.push('/');
                        return;
                    }

                    setTitle(recipe.title || "");
                    setPrepTime(recipe.prep_time_minutes || "");
                    setCookTime(recipe.cook_time_minutes || "");
                    setServings(recipe.servings || "");
                    // page_number lives on the recipe row; fall back to sources if somehow set there
                    setPageNumber(recipe.page_number || recipe.sources?.page_number || "");
                    setImageUrls(recipe.images || [recipe.image].filter(Boolean));
                    setAiImagesUsed(recipe.ai_images_used || 0);
                    if (recipe.group_id) setSelectedGroupId(recipe.group_id);
                    setIsPublic(recipe.is_public || false);

                    if (recipe.sources) {
                        setBookTitle(recipe.sources.book_title || "");
                        setAuthor(recipe.sources.author || "");
                        setPublisher(recipe.sources.publisher || "");
                        setLink(recipe.sources.link || "");
                    }


                    // Load ingredients
                    const { data: recipeIngs } = await supabase.from("recipe_ingredients").select("*, ingredients(name)").eq("recipe_id", editId).order('sort_order', { ascending: true });
                    if (recipeIngs && recipeIngs.length > 0) {
                        setIngredients(recipeIngs.map(ri => ({
                            id: Math.random(),
                            // Derive row_type from section column: '__header__' = section row
                            row_type: ri.section === '__header__' ? 'section' : 'ingredient',
                            qty: ri.quantity || "",
                            unit: ri.unit || "",
                            name: ri.display_name || ri.ingredients?.name || "",
                            prep: ri.preparation || ""
                        })));
                    }

                    // Load steps
                    const { data: recipeSteps = [] } = await supabase.from("instruction_steps").select("*").eq("recipe_id", editId).order('step_number', { ascending: true });
                    if (recipeSteps && recipeSteps.length > 0) {
                        setSteps(recipeSteps.map(rs => ({ id: Math.random(), text: rs.instruction_text })));
                    }
                } finally {
                    setIsLoading(false);
                }
            }
            loadRecipe();
        }
    }, [editId]);

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { id: Date.now(), row_type: 'ingredient', qty: "", unit: "", name: "", prep: "" }]);
    };

    const handleAddSection = () => {
        setIngredients([...ingredients, { id: Date.now(), row_type: 'section', name: "", qty: "", unit: "", prep: "" }]);
    };

    const updateIngredient = (index, field, value) => {
        setIngredients(prev => {
            const newIngs = [...prev];
            newIngs[index] = { ...newIngs[index], [field]: value };
            return newIngs;
        });
    };

    const handleAddStep = () => {
        setSteps([...steps, { id: Date.now(), text: "" }]);
    };

    const updateStep = (index, value) => {
        const newSteps = [...steps];
        newSteps[index].text = value;
        setSteps(newSteps);
    };

    const removeIngredient = (index) => {
        if (ingredients.length <= 1) {
            setIngredients([{ id: Date.now(), row_type: 'ingredient', qty: "", unit: "", name: "", prep: "" }]);
            return;
        }
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const moveIngredient = (index, direction) => {
        const newIngs = [...ingredients];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newIngs.length) return;
        [newIngs[index], newIngs[targetIndex]] = [newIngs[targetIndex], newIngs[index]];
        setIngredients(newIngs);
    };

    const removeStep = (index) => {
        if (steps.length <= 1) {
            setSteps([{ id: Date.now(), text: "" }]);
            return;
        }
        setSteps(steps.filter((_, i) => i !== index));
    };

    const moveStep = (index, direction) => {
        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        setSteps(newSteps);
    };

    // ── Drag-to-reorder state (steps) ─────────────────────────────────────
    const [dragIndex,     setDragIndex]     = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const reorderSteps = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        const newSteps = [...steps];
        const [removed] = newSteps.splice(fromIndex, 1);
        newSteps.splice(toIndex, 0, removed);
        setSteps(newSteps);
    };

    // ── Drag-to-reorder state (ingredients) ────────────────────────────────
    const [dragIngIndex,     setDragIngIndex]     = useState(null);
    const [dragIngOverIndex, setDragIngOverIndex] = useState(null);

    const reorderIngredients = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        const newIngs = [...ingredients];
        const [removed] = newIngs.splice(fromIndex, 1);
        newIngs.splice(toIndex, 0, removed);
        setIngredients(newIngs);
    };

    // --- Image Scanning Utility ---
    const resizeImage = (file, maxDimension = 1600) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxDimension) {
                            height *= maxDimension / width;
                            width = maxDimension;
                        }
                    } else {
                        if (height > maxDimension) {
                            width *= maxDimension / height;
                            height = maxDimension;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataUrl.split(',')[1]);
                };
            };
        });
    };

    const handleScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        setToast("Processing image... 📸");

        try {
            const base64String = await resizeImage(file);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);

            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64String, mimeType: "image/jpeg" }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 429) {
                    throw new Error("AI Quota Exceeded. Please try again in 1 minute.");
                }
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();

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
                    row_type: ing.row_type || 'ingredient',
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

            setToast("Recipe scanned successfully! ✨");
        } catch (error) {
            console.error("Scanning Error:", error);
            setToast(`❌ Scan failed: ${error.message}`);
        } finally {
            setIsScanning(false);
            setTimeout(() => setToast(null), 10000); // 10s so errors are readable
            e.target.value = "";
        }
    };

    // Measurement Standardization
    const handleStandardize = () => {
        const newIngs = ingredients.map(ing => {
            if (ing.row_type === 'section') return ing;
            const fullLine = `${ing.qty || ""} ${ing.unit || ""} ${ing.name || ""}${ing.prep ? ', ' + ing.prep : ''}`.trim();
            const parsed = smartParseIngredient(fullLine);
            if (parsed) {
                if (parsed.row_type === 'section' && ing.row_type !== 'section') {
                    return { ...ing, row_type: 'section', name: parsed.display_name || parsed.name, qty: "", unit: "", prep: "" };
                }
                if (parsed.row_type === 'ingredient') {
                    return { ...ing, ...parsed };
                }
            }
            return standardizeIngredient(ing);
        });
        setIngredients(newIngs);

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
            const { scaledIngs, scaledSteps } = scaleRecipe(ingredients, steps, ratio);
            setIngredients(scaledIngs);
            setSteps(scaledSteps);
        }
        setPreviousServings(newServings);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let finalRecipeId = editId;
            let finalSourceId = null;

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
                        const { error: srcErr } = await supabase.from("sources").update(sourceData).eq("id", checkRec.source_id);
                        if (srcErr) {
                            console.error("[add] source update failed:", srcErr.message);
                            showToast(`⚠️ Source could not be saved: ${srcErr.message}`);
                        }
                        finalSourceId = checkRec.source_id;
                    } else {
                        const { data: newSrc, error: srcErr } = await supabase.from("sources").insert([sourceData]).select().single();
                        if (srcErr) {
                            console.error("[add] source insert failed:", srcErr.message);
                            showToast(`⚠️ Source could not be saved: ${srcErr.message}`);
                        }
                        finalSourceId = newSrc?.id;
                    }
                } else {
                    const { data: newSrc, error: srcErr } = await supabase.from("sources").insert([sourceData]).select().single();
                    if (srcErr) {
                        console.error("[add] source insert failed:", srcErr.message);
                        showToast(`⚠️ Source could not be saved: ${srcErr.message}`);
                    }
                    finalSourceId = newSrc?.id;
                }
            }


            const { data: { user } } = await supabase.auth.getUser();

            // B5: Defence-in-depth ownership check at save time.
            // loadRecipe() already blocks non-owners from seeing the form, but we
            // re-verify here in case of race conditions or direct API calls.
            if (editId) {
                const { data: ownerRow } = await supabase
                    .from('recipes').select('user_id').eq('id', editId).single();
                if (!ownerRow || ownerRow.user_id !== user.id) {
                    showToast('❌ You do not have permission to edit this recipe.');
                    return;
                }
            }

            // ── Snapshot existing child rows before delete — enables restore if re-insert fails
            //    Also used as the version snapshot payload below (per ADR-017).
            let existingIngredientSnapshot = [];
            let existingStepsSnapshot = [];
            if (editId) {
                const { data: snap } = await supabase
                    .from('recipe_ingredients')
                    .select('*')
                    .eq('recipe_id', editId);
                existingIngredientSnapshot = snap || [];

                const { data: stepSnap } = await supabase
                    .from('instruction_steps')
                    .select('*')
                    .eq('recipe_id', editId)
                    .order('step_number', { ascending: true });
                existingStepsSnapshot = stepSnap || [];

                // ── Auto-version snapshot (Epistemic Provenance feature) ──────────
                // Persist the current recipe state to recipe_versions before any
                // writes are made. Silent — does not block the save if it fails.
                try {
                    const { data: versionRow } = await supabase
                        .from('recipe_versions')
                        .select('version_number')
                        .eq('recipe_id', editId)
                        .order('version_number', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    const nextVersion = (versionRow?.version_number ?? 0) + 1;

                    // Fetch current recipe + source for full snapshot
                    const { data: currentRecipe } = await supabase
                        .from('recipes')
                        .select('*, sources!source_id(*)')
                        .eq('id', editId)
                        .single();

                    const versionSnapshot = {
                        title:               currentRecipe?.title,
                        prep_time_minutes:   currentRecipe?.prep_time_minutes,
                        cook_time_minutes:   currentRecipe?.cook_time_minutes,
                        servings:            currentRecipe?.servings,
                        images:              currentRecipe?.images,
                        source: currentRecipe?.sources ? {
                            book_title:  currentRecipe.sources.book_title,
                            author:      currentRecipe.sources.author,
                            publisher:   currentRecipe.sources.publisher,
                            page_number: currentRecipe.sources.page_number,
                            link:        currentRecipe.sources.link,
                        } : null,
                        ingredients: existingIngredientSnapshot.map(ri => ({
                            qty:     ri.quantity,
                            unit:    ri.unit,
                            name:    ri.display_name,
                            prep:    ri.preparation,
                            section: ri.section,
                        })),
                        steps: existingStepsSnapshot.map(s => s.instruction_text),
                    };

                    await supabase.from('recipe_versions').insert({
                        recipe_id:      editId,
                        version_number: nextVersion,
                        snapshot:       versionSnapshot,
                        created_by:     user.id,
                    });
                } catch (vErr) {
                    // Non-fatal: log and continue with the save
                    console.warn('[version] Failed to create version snapshot:', vErr.message);
                }
            }

            const recipeData = {
                title,
                prep_time_minutes: parseInt(prepTime) || 0,
                cook_time_minutes: parseInt(cookTime) || 0,
                servings: parseFloat(servings) || 0,
                image: imageUrls[0] || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=2670",
                images: imageUrls,
                ai_images_used: aiImagesUsed,
                source_id: finalSourceId,
                page_number: pageNumber,
                group_id: selectedGroupId,
                is_public: isPublic,
                updated_by: user.id,
                user_id: editId ? undefined : user.id
            };

            // Only delete AFTER we have a snapshot
            if (editId) {
                await supabase.from("recipes").update(recipeData).eq("id", editId);
                await supabase.from("recipe_ingredients").delete().eq("recipe_id", editId);
                await supabase.from("instruction_steps").delete().eq("recipe_id", editId);
            } else {
                const { data: newRecipe, error } = await supabase.from("recipes").insert([recipeData]).select().single();
                if (error) throw error;
                finalRecipeId = newRecipe.id;
            }

            let ingredientSaveFailed = false;
            let currentSection = null;

            for (const ing of ingredients) {
                if (!ing.name && ing.row_type !== 'section') continue;

                if (ing.row_type === 'section') {
                    currentSection = ing.name;
                    const { error: sectionErr } = await supabase.from("recipe_ingredients").insert([{
                        recipe_id: finalRecipeId,
                        display_name: ing.name,
                        section: '__header__',
                        sort_order: ingredients.indexOf(ing) + 1
                    }]);
                    if (sectionErr) {
                        console.error("⚠️ Failed to save section header:", ing.name, sectionErr);
                        showToast(`⚠️ Section '${ing.name}' could not be saved: ${sectionErr.message}`);
                        ingredientSaveFailed = true;
                    }
                    continue;
                }

                let ingredientId = null;
                const { data: existingIng } = await supabase
                    .from("ingredients")
                    .select("id")
                    .eq("name", ing.name.toLowerCase().trim())
                    .maybeSingle();

                if (existingIng) {
                    ingredientId = existingIng.id;
                } else {
                    const { data: newIng, error: ingErr } = await supabase
                        .from("ingredients")
                        .insert([{ name: ing.name.toLowerCase().trim(), default_unit: ing.unit }])
                        .select()
                        .single();
                    if (ingErr) {
                        console.warn('[add] ingredients catalog insert failed (RLS?), saving display_name only:', ing.name, ingErr.message);
                    } else if (newIng) {
                        ingredientId = newIng.id;
                    }
                }

                const { error: riErr } = await supabase.from("recipe_ingredients").insert([{
                    recipe_id: finalRecipeId,
                    ingredient_id: ingredientId,
                    quantity: parseFloat(ing.qty) || null,
                    unit: ing.unit,
                    preparation: ing.prep,
                    display_name: ing.name,
                    section: currentSection,
                    sort_order: ingredients.indexOf(ing) + 1
                }]);
                if (riErr) {
                    console.error('[add] recipe_ingredients insert failed:', ing.name, riErr.message);
                    showToast(`⚠️ Could not save ingredient: ${ing.name} — ${riErr.message}`);
                    ingredientSaveFailed = true;
                }
            }

            // ── Guard: if any ingredient failed to insert, restore the snapshot ─
            if (ingredientSaveFailed && existingIngredientSnapshot.length > 0) {
                showToast('❌ Ingredient save failed — your original ingredients have been restored. Fix the issue and try again.');
                // Delete the partial inserts
                await supabase.from('recipe_ingredients').delete().eq('recipe_id', finalRecipeId);
                // Restore the snapshot (strip generated id so Supabase auto-assigns a new one)
                const toRestore = existingIngredientSnapshot.map(({ id: _id, ...row }) => row);
                if (toRestore.length > 0) {
                    await supabase.from('recipe_ingredients').insert(toRestore);
                }
                return; // Abort navigation
            }

            const validSteps = steps.filter(s => s.text.trim() !== "");
            let stepSaveFailed = false;
            for (let i = 0; i < validSteps.length; i++) {
                const { error: stepErr } = await supabase.from("instruction_steps").insert([{
                    recipe_id: finalRecipeId,
                    step_number: i + 1,
                    instruction_text: validSteps[i].text
                }]);
                if (stepErr) {
                    console.error('[add] instruction_steps insert failed at step', i + 1, stepErr.message);
                    stepSaveFailed = true;
                }
            }

            // ── Guard: if any step failed to insert, restore the snapshot ─
            if (stepSaveFailed && existingStepsSnapshot.length > 0) {
                showToast('❌ Method save failed — your original steps have been restored. Fix the issue and try again.');
                await supabase.from('instruction_steps').delete().eq('recipe_id', finalRecipeId);
                const toRestore = existingStepsSnapshot.map(({ id: _id, ...row }) => row);
                if (toRestore.length > 0) {
                    await supabase.from('instruction_steps').insert(toRestore);
                }
                return; // Abort navigation
            }

            router.push("/");
        } catch (err) {
            console.error("Error saving recipe:", err);
            showToast("⚠️ Failed to save recipe. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            setTimeout(() => setDeleteConfirm(false), 4000);
            return;
        }
        try {
            // B5: Verify ownership before delete (defence-in-depth — RLS also blocks this at DB level)
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const { data: ownerRow } = await supabase
                .from('recipes').select('user_id').eq('id', editId).single();
            if (!ownerRow || ownerRow.user_id !== currentUser?.id) {
                showToast('❌ You do not have permission to delete this recipe.');
                return;
            }

            await supabase.from("instruction_steps").delete().eq("recipe_id", editId);
            await supabase.from("recipe_ingredients").delete().eq("recipe_id", editId);
            await supabase.from("recipes").delete().eq("id", editId);
            router.push("/");
            router.refresh();
        } catch (err) {
            console.error("Error deleting recipe:", err);
            showToast("⚠️ Failed to delete recipe. Please try again.");
        }
    };

    const handleGenerateBrief = async () => {
        if (!title) {
            showToast("Add a title first!");
            return;
        }
        showToast("Generating Magic Brief... 🧠");
        setIsGeneratingBrief(true);
        console.log("Generating brief for:", title);
        try {
            // OPTIONAL: Pull the first image as visual context
            let imageBase64 = null;
            if (imageUrls && imageUrls.length > 0) {
                const firstImagePath = imageUrls[0];
                const { data: blob, error: dlError } = await supabase.storage.from('recipe-images').download(firstImagePath);
                if (!dlError && blob) {
                    imageBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    });
                }
            }

            const response = await fetch('/api/brief', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title, 
                    ingredients: ingredients.map(i => {
                        const base = `${i.qty || ""} ${i.unit || ""} ${i.name || ""}`.trim();
                        return i.prep ? `${base} (${i.prep})` : base;
                    }).filter(Boolean),
                    steps: steps.map(s => s.text).filter(Boolean),
                    existingImages: imageUrls,
                    image: imageBase64 // Sent as Base64 context
                })
            });
            
            if (response.status === 429 || response.status === 503) {
                const data = await response.json();
                showToast(`⏳ ${data.error || "Service busy. Try again in a few moments."}`);
                return;
            }

            const data = await response.json();
            if (data.briefs) {
                setLastBrief(data.briefs);
                showToast("Dual Editorial Briefs Generated! ✨");
            } else {
                throw new Error(data.error || "Briefs empty");
            }
            console.log("Brief generated successfully:", data.briefs);
        } catch (err) {
            console.error("Brief Error Details:", err);
            showToast(`⚠️ Brief failed: ${err.message || "Check logs"}`);
        } finally {
            setIsGeneratingBrief(false);
        }
    };

    return (
        <div className="view-gallery" style={{ display: 'block' }}>

            <div className="form-container" style={{ margin: '0 auto' }}>
                <PageHeader title={editId ? "Edit Recipe" : "Add New Recipe"} />

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
                        <h2 className="pp-section-heading">Recipe Title</h2>
                        <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grandma's Lasagna" required />
                    </div>

                    <ImageManager 
                        images={imageUrls} 
                        onChange={setImageUrls} 
                        aiImagesUsed={aiImagesUsed}
                        isGenerating={isGeneratingBrief}
                        lastBrief={lastBrief}
                        onAiGenerate={handleGenerateBrief} 
                    />

                    <h2 className="pp-section-heading">Source Reference</h2>
                    <SourceReferenceFields
                        bookTitle={bookTitle}   setBookTitle={setBookTitle}
                        author={author}         setAuthor={setAuthor}
                        publisher={publisher}   setPublisher={setPublisher}
                        pageNumber={pageNumber} setPageNumber={setPageNumber}
                        link={link}             setLink={setLink}
                    />

                    <h2 className="pp-section-heading">Prep Overview</h2>
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

                    {/* ── Visibility ────────────────────────────── */}
                    <h2 className="pp-section-heading">Visibility</h2>

                        {/* Toggle rows: Personal + each household */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>

                            {/* Personal — exclusive: clears everything */}
                            {(() => {
                                const on = isPrivate;
                                return (
                                    <div
                                        onClick={() => { setSelectedGroupId(null); setIsPublic(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                            background: 'rgba(212,175,55,0.05)', borderRadius: '12px',
                                            border: on ? '1px solid var(--color-accent-amber)' : '1px solid transparent',
                                            cursor: 'pointer', transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <div style={{ width: '40px', height: '22px', background: on ? 'var(--color-accent-amber)' : 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative', transition: 'all 0.3s ease', flexShrink: 0 }}>
                                            <div style={{ width: '18px', height: '18px', background: on ? 'var(--color-bg-deep-olive)' : '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: on ? '20px' : '2px', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: on ? 'var(--color-accent-amber)' : 'var(--color-text-papyrus)' }}>{Icon.settings} Personal</span>
                                            <span className="pp-hint">Only you — clears all other sharing.</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Independent toggle per household */}
                            {groups.map(g => {
                                const on = selectedGroupId === g.id;
                                return (
                                    <div
                                        key={g.id}
                                        onClick={() => {
                                            // Toggle: select this group, or deselect if already selected
                                            setSelectedGroupId(prev => prev === g.id ? null : g.id);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                            background: 'rgba(212,175,55,0.05)', borderRadius: '12px',
                                            border: on ? '1px solid var(--color-accent-amber)' : '1px solid transparent',
                                            cursor: 'pointer', transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <div style={{ width: '40px', height: '22px', background: on ? 'var(--color-accent-amber)' : 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative', transition: 'all 0.3s ease', flexShrink: 0 }}>
                                            <div style={{ width: '18px', height: '18px', background: on ? 'var(--color-bg-deep-olive)' : '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: on ? '20px' : '2px', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: on ? 'var(--color-accent-amber)' : 'var(--color-text-papyrus)' }}>{Icon.house} {g.name}</span>
                                            <span className="pp-hint">Household members can see and cook this recipe.</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {groups.length === 0 && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                                    No households yet. <a href="/household" style={{ color: 'var(--color-accent-amber)' }}>Create one →</a>
                                </p>
                            )}
                        </div>

                        {/* Public toggle */}
                        <div
                            onClick={() => setIsPublic(!isPublic)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px',
                                border: isPublic ? '1px solid var(--color-accent-amber)' : '1px solid transparent',
                                cursor: 'pointer', transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{
                                width: '40px', height: '22px', background: isPublic ? 'var(--color-accent-amber)' : 'rgba(255,255,255,0.1)',
                                borderRadius: '20px', position: 'relative', transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    width: '18px', height: '18px', background: isPublic ? 'var(--color-bg-deep-olive)' : '#fff',
                                    borderRadius: '50%', position: 'absolute', top: '2px',
                                    left: isPublic ? '20px' : '2px', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: isPublic ? 'var(--color-accent-amber)' : 'var(--color-text-papyrus)' }}>
                                    {Icon.globe} Publish to Global Gallery
                                </span>
                                <span className="pp-hint">
                                    Anyone with the link can view — no login needed.
                                </span>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
                            {isPrivate && 'Only you can see this recipe.'}
                             {selectedGroupId && 'Shared with your household.'}
                        </p>

                    <div className="form-group dynamic-list" style={{ marginTop: '40px' }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <h2 className="pp-section-heading" style={{ margin: 0 }}>Ingredients</h2>
                            <button type="button" onClick={handleStandardize} style={{ background: "none", border: "1px solid var(--color-accent-amber)", color: "var(--color-accent-amber)", borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s ease" }}>
                                ✨ Standardize to Metric
                            </button>
                        </div>
                        {ingredients.map((ing, i) => (
                            <div
                                className={[
                                    'ingredient-edit-row',
                                    ing.row_type === 'section' ? 'is-section'   : '',
                                    dragIngIndex     === i     ? 'ing-dragging'  : '',
                                    dragIngOverIndex === i     ? 'ing-drag-over' : '',
                                ].join(' ')}
                                key={ing.id}
                                draggable
                                onDragStart={() => setDragIngIndex(i)}
                                onDragOver={e  => { e.preventDefault(); setDragIngOverIndex(i); }}
                                onDrop={e      => { e.preventDefault(); reorderIngredients(dragIngIndex, i); setDragIngIndex(null); setDragIngOverIndex(null); }}
                                onDragEnd={()  => { setDragIngIndex(null); setDragIngOverIndex(null); }}
                            >
                                {/* ── Drag handle (replaces ▲▼ buttons) ── */}
                                <div className="step-drag-handle" title="Drag to reorder">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <circle cx="5" cy="4"  r="1.5"/><circle cx="11" cy="4"  r="1.5"/>
                                        <circle cx="5" cy="8"  r="1.5"/><circle cx="11" cy="8"  r="1.5"/>
                                        <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
                                    </svg>
                                </div>

                                {ing.row_type === 'section' ? (
                                    <div style={{ gridColumn: "2 / 6", display: "flex", alignItems: "center", gap: "15px", background: "rgba(255,184,77,0.08)", padding: "8px 15px", borderRadius: "8px", borderLeft: "4px solid #ffb84d" }}>
                                        <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "#ffb84d", letterSpacing: "1px", textTransform: "uppercase", padding: "3px 6px", border: "1px solid rgba(255,184,77,0.3)", borderRadius: "3px", whiteSpace: "nowrap" }}>SECTION</span>
                                        <input
                                            type="text"
                                            placeholder="FOR THE SAUCE"
                                            value={ing.name || ""}
                                            onChange={e => updateIngredient(i, "name", e.target.value)}
                                            style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid rgba(255,184,77,0.3)", color: "white", fontSize: "1.1rem", fontWeight: "700", outline: "none", padding: "4px 0" }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <input type="text" className="form-control" placeholder="Qty" value={ing.qty || ""} onChange={e => updateIngredient(i, "qty", e.target.value)} />
                                        <input type="text" className="form-control" placeholder="Unit" value={ing.unit || ""} onChange={e => updateIngredient(i, "unit", e.target.value)} />
                                        <input type="text" className="form-control" placeholder="Ingredient Name" value={ing.name || ""} onChange={e => updateIngredient(i, "name", e.target.value)} />
                                        <input type="text" className="form-control" placeholder="Prep" value={ing.prep || ""} onChange={e => updateIngredient(i, "prep", e.target.value)} />
                                    </>
                                )}

                                <button type="button" onClick={() => removeIngredient(i)} className="remove-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                            <button type="button" className="btn-add" style={{ flex: 1 }} onClick={handleAddIngredient}>+ Add Ingredient</button>
                            <button type="button" className="btn-add" style={{ flex: 1, border: "1px dashed rgba(255,255,255,0.3)" }} onClick={handleAddSection}>+ Add Section Header</button>
                        </div>
                    </div>

                    <div className="form-group dynamic-list">
                        <h2 className="pp-section-heading">Method Steps</h2>
                        {steps.map((step, i) => (
                            <div
                                className={[
                                    'step-edit-row',
                                    dragIndex     === i ? 'step-dragging'   : '',
                                    dragOverIndex === i ? 'step-drag-over'  : '',
                                ].join(' ')}
                                key={step.id}
                                draggable
                                onDragStart={() => setDragIndex(i)}
                                onDragOver={e  => { e.preventDefault(); setDragOverIndex(i); }}
                                onDrop={e      => { e.preventDefault(); reorderSteps(dragIndex, i); setDragIndex(null); setDragOverIndex(null); }}
                                onDragEnd={()  => { setDragIndex(null); setDragOverIndex(null); }}
                            >
                                {/* ── Drag handle (replaces ▲▼ buttons) ── */}
                                <div className="step-drag-handle" title="Drag to reorder">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <circle cx="5" cy="4"  r="1.5"/><circle cx="11" cy="4"  r="1.5"/>
                                        <circle cx="5" cy="8"  r="1.5"/><circle cx="11" cy="8"  r="1.5"/>
                                        <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
                                    </svg>
                                </div>
                                <textarea className="form-control step-input" placeholder={`Step ${i + 1}`} value={step.text} onChange={e => updateStep(i, e.target.value)}></textarea>
                                <button type="button" onClick={() => removeStep(i)} className="remove-btn v-centered">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        <button type="button" className="btn-add" onClick={handleAddStep}>+ Add another step</button>
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <button type="submit" className="btn-submit" disabled={isSubmitting || isLoading} style={{ flex: 1 }}>
                            {isLoading ? "Loading Recipe..." : isSubmitting ? "Saving to Cloud..." : editId ? "Update Recipe" : "Save Recipe to Library"}
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
                                <>{deleteConfirm ? <>{Icon.warn} Confirm Delete?</> : <>{Icon.trash} Delete Recipe</>}</>
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--color-surface)', color: 'var(--color-text-papyrus)',
                    padding: '12px 24px', borderRadius: '40px', border: '1px solid var(--color-accent-amber)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 1000,
                    fontSize: '0.9rem', fontWeight: 600, animation: 'slideUp 0.3s ease-out'
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
}

const slideUpStyles = `
    @keyframes slideUp {
        from { transform: translate(-50%, 20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
`;

export default function AddRecipePage() {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddRecipeForm />
        </Suspense>
    );
}
