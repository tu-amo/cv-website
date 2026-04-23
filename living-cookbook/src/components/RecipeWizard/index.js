'use client';

/**
 * RecipeWizard/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrator for the 8-step new-recipe creation wizard.
 * All form state, handlers, and data-loading live here.
 * Each step receives only the props it needs.
 *
 * Route: /create  (new recipes only — editing uses /add?id=xxx)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui';

import WizardShell    from './WizardShell';
import Step1Scan      from './Step1Scan';
import Step2Source    from './Step2Source';
import Step4Ingredients from './Step4Ingredients';
import Step5Method    from './Step5Method';
import Step6Visibility from './Step6Visibility';
import Step7Photos    from './Step7Photos';
import Step8Confirm   from './Step8Confirm';

// ── Constants ────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 7;
const DRAFT_KEY   = 'recipe_wizard_draft';

const STEP_LABELS = [
    'Scan',
    'Title & Source',
    'Ingredients',
    'Method',
    'Visibility',
    'Photos',
    'Confirm',
];

const EMPTY_INGREDIENT = () => ({ id: Date.now() + Math.random(), row_type: 'ingredient', qty: '', unit: '', name: '', prep: '' });
const EMPTY_STEP       = () => ({ id: Date.now() + Math.random(), text: '' });

// ── Image resize utility (mirrors add/page.js) ────────────────────────────────
function resizeImage(file, maxDimension = 1600) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > height) {
                    if (width > maxDimension) { height *= maxDimension / width; width = maxDimension; }
                } else {
                    if (height > maxDimension) { width *= maxDimension / height; height = maxDimension; }
                }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
            };
        };
    });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RecipeWizard() {
    const router  = useRouter();
    const supabase = useMemo(() => createClient(), []);

    // ── Navigation ─────────────────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState(1);

    // ── Step 1: Scan ────────────────────────────────────────────────────────
    const [isScanning,  setIsScanning]  = useState(false);
    const [scanError,   setScanError]   = useState(null);
    const [scanDone,    setScanDone]    = useState(false);
    const [scanUsed,    setScanUsed]    = useState(null);
    const [scanLimit,   setScanLimit]   = useState(null);
    const [unitSystem,  setUnitSystem]  = useState('metric'); // loaded from profile

    // ── Step 2: Title & Source ──────────────────────────────────────────────
    const [title,       setTitle]       = useState('');
    const [sourceType,  setSourceType]  = useState('none');
    const [bookTitle,   setBookTitle]   = useState('');
    const [author,      setAuthor]      = useState('');
    const [publisher,   setPublisher]   = useState('');
    const [pageNumber,  setPageNumber]  = useState('');
    const [link,        setLink]        = useState('');

    // ── Step 3: Overview ────────────────────────────────────────────────────
    const [servings,    setServings]    = useState('');
    const [prepTime,    setPrepTime]    = useState('');
    const [cookTime,    setCookTime]    = useState('');

    // ── Step 4: Ingredients ─────────────────────────────────────────────────
    const [ingredients, setIngredients] = useState([EMPTY_INGREDIENT()]);

    // ── Step 5: Method ──────────────────────────────────────────────────────
    const [steps,       setSteps]       = useState([EMPTY_STEP()]);

    // ── Step 6: Visibility ──────────────────────────────────────────────────
    const [isPublic,        setIsPublic]        = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [groups,          setGroups]          = useState([]);

    // ── Step 7: Photos ─────────────────────────────────────────────────────
    const [imageUrls,    setImageUrls]    = useState([]);
    const [aiImagesUsed, setAiImagesUsed] = useState(0);
    const [lastBrief,    setLastBrief]    = useState(null);

    // ── Step 8: Saving ──────────────────────────────────────────────────────
    const [isSaving,    setIsSaving]    = useState(false);

    // ── Toast ────────────────────────────────────────────────────────────────
    const [toast, setToast] = useState(null);
    const showToast = useCallback((msg, ms = 5000) => {
        setToast(msg);
        setTimeout(() => setToast(null), ms);
    }, []);

    // ── Load user profile (unit system) + groups on mount ──────────────────
    useEffect(() => {
        async function bootstrap() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Unit system preference
            const { data: profile } = await supabase
                .from('profiles')
                .select('unit_system')
                .eq('id', user.id)
                .single();
            if (profile?.unit_system) setUnitSystem(profile.unit_system);

            // Household groups
            const { data: memberships } = await supabase
                .from('group_members')
                .select('groups(id, name)');
            if (memberships) {
                const seen = new Set();
                const unique = memberships
                    .map(m => m.groups)
                    .filter(g => { if (!g || seen.has(g.id)) return false; seen.add(g.id); return true; });
                setGroups(unique);
            }
        }
        bootstrap();
    }, [supabase]);

    // ── Draft: restore on mount ─────────────────────────────────────────────
    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const d = JSON.parse(raw);
            if (d.title)       setTitle(d.title);
            if (d.sourceType)  setSourceType(d.sourceType);
            if (d.bookTitle)   setBookTitle(d.bookTitle);
            if (d.author)      setAuthor(d.author);
            if (d.publisher)   setPublisher(d.publisher);
            if (d.pageNumber)  setPageNumber(d.pageNumber);
            if (d.link)        setLink(d.link);
            if (d.servings)    setServings(d.servings);
            if (d.prepTime)    setPrepTime(d.prepTime);
            if (d.cookTime)    setCookTime(d.cookTime);
            if (d.ingredients?.length) setIngredients(d.ingredients);
            if (d.steps?.length)       setSteps(d.steps);
            if (d.isPublic != null)    setIsPublic(d.isPublic);
            if (d.selectedGroupId)     setSelectedGroupId(d.selectedGroupId);
            if (d.currentStep)         setCurrentStep(d.currentStep);
        } catch { /* ignore corrupt draft */ }
    }, []);

    // ── Draft: save on every change ─────────────────────────────────────────
    useEffect(() => {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({
                currentStep, title, sourceType, bookTitle, author, publisher,
                pageNumber, link, servings, prepTime, cookTime,
                ingredients, steps, isPublic, selectedGroupId,
            }));
        } catch { /* quota exceeded — ignore */ }
    }, [currentStep, title, sourceType, bookTitle, author, publisher,
        pageNumber, link, servings, prepTime, cookTime,
        ingredients, steps, isPublic, selectedGroupId]);

    // ── Exit guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        const hasContent = title || scanDone || ingredients.some(i => i.name);
        if (!hasContent) return;
        const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [title, scanDone, ingredients]);

    // ── Navigation handlers ─────────────────────────────────────────────────
    const goNext = useCallback(() => setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS)), []);
    const goBack = useCallback(() => setCurrentStep(s => Math.max(s - 1, 1)), []);
    const goToStep = useCallback((step) => {
        if (step >= 1 && step < currentStep) setCurrentStep(step);
    }, [currentStep]);

    // ── Step 1: AI scan ─────────────────────────────────────────────────────
    const handleScan = useCallback(async (file) => {
        setIsScanning(true);
        setScanError(null);
        try {
            const base64String = await resizeImage(file);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);

            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64String, mimeType: 'image/jpeg', unitSystem }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                if (response.status === 429) throw new Error('AI quota exceeded. Please try again in 1 minute.');
                throw new Error(err.error || `Server error: ${response.status}`);
            }

            const data = await response.json();

            // Populate state from scan result
            if (data.title)    setTitle(data.title);
            if (data.source) {
                if (data.source.bookTitle) { setBookTitle(data.source.bookTitle); setSourceType('cookbook'); }
                if (data.source.author)    setAuthor(data.source.author);
                if (data.source.publisher) setPublisher(data.source.publisher);
                if (data.source.pageNumber) setPageNumber(String(data.source.pageNumber));
                if (data.source.link)      { setLink(data.source.link); setSourceType('website'); }
            }
            if (data.prepTime)   setPrepTime(String(data.prepTime));
            if (data.cookTime)   setCookTime(String(data.cookTime));
            if (data.servings)   setServings(String(data.servings));
            if (data.ingredients?.length) {
                setIngredients(data.ingredients.map((ing, i) => ({
                    id: Date.now() + i,
                    row_type: ing.row_type || 'ingredient',
                    qty: ing.qty?.toString() || '',
                    unit: ing.unit || '',
                    name: ing.name || '',
                    prep: ing.prep || '',
                })));
            }
            if (data.steps?.length) {
                setSteps(data.steps.map((text, i) => ({ id: Date.now() + 100 + i, text })));
            }
            // Usage metadata
            if (data.used  != null) setScanUsed(data.used);
            if (data.limit != null) setScanLimit(data.limit);

            setScanDone(true);
        } catch (err) {
            console.error('[wizard] scan error:', err);
            setScanError(err.name === 'AbortError' ? 'The scan timed out — try a clearer photo.' : err.message);
        } finally {
            setIsScanning(false);
        }
    }, [unitSystem]);

    // ── Step 4: Ingredient handlers ─────────────────────────────────────────
    const handleUpdateIngredient = useCallback((index, field, value) => {
        setIngredients(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    }, []);

    const handleRemoveIngredient = useCallback((index) => {
        setIngredients(prev => prev.length <= 1 ? [EMPTY_INGREDIENT()] : prev.filter((_, i) => i !== index));
    }, []);

    const handleAddIngredient = useCallback(() => {
        setIngredients(prev => [...prev, EMPTY_INGREDIENT()]);
    }, []);

    const handleAddSection = useCallback(() => {
        setIngredients(prev => [...prev, { id: Date.now(), row_type: 'section', name: '', qty: '', unit: '', prep: '' }]);
    }, []);

    // ── Step 5: Step handlers ───────────────────────────────────────────────
    const handleUpdateStep = useCallback((index, value) => {
        setSteps(prev => { const next = [...prev]; next[index] = { ...next[index], text: value }; return next; });
    }, []);

    const handleRemoveStep = useCallback((index) => {
        setSteps(prev => prev.length <= 1 ? [EMPTY_STEP()] : prev.filter((_, i) => i !== index));
    }, []);

    const handleAddStep = useCallback(() => {
        setSteps(prev => [...prev, EMPTY_STEP()]);
    }, []);

    // ── Step 6: Visibility handlers ─────────────────────────────────────────
    const handleSetPrivate   = useCallback(() => { setIsPublic(false); setSelectedGroupId(null); }, []);
    const handleSetHousehold = useCallback((gid) => { setIsPublic(false); setSelectedGroupId(gid); }, []);
    const handleSetPublic    = useCallback(() => { setIsPublic(true); setSelectedGroupId(null); }, []);

    // ── Step 7: Image handler ───────────────────────────────────────────────
    const handleImagesChange = useCallback((urls, aiCount, brief) => {
        setImageUrls(urls);
        if (aiCount != null)  setAiImagesUsed(aiCount);
        if (brief   != null)  setLastBrief(brief);
    }, []);

    // ── Discard ─────────────────────────────────────────────────────────────
    const handleDiscard = useCallback(() => {
        if (!window.confirm('Discard this recipe? All entered data will be lost.')) return;
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        router.push('/');
    }, [router]);

    // ── Save (Step 8) ────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // ── Source ────────────────────────────────────────────────────
            let finalSourceId = null;
            const hasSource = bookTitle || author || publisher || link;
            if (hasSource) {
                const { data: src, error: srcErr } = await supabase
                    .from('sources')
                    .insert([{ book_title: bookTitle || 'Untitled Source', author, publisher, link }])
                    .select()
                    .single();
                if (srcErr) {
                    console.error('[wizard] source insert failed:', srcErr.message);
                    showToast(`⚠️ Source could not be saved: ${srcErr.message}`);
                }
                finalSourceId = src?.id;
            }


            // ── Recipe ────────────────────────────────────────────────────
            const { data: newRecipe, error: recipeErr } = await supabase
                .from('recipes')
                .insert([{
                    title: title || 'Untitled Recipe',
                    prep_time_minutes: parseInt(prepTime) || 0,
                    cook_time_minutes: parseInt(cookTime) || 0,
                    servings: parseFloat(servings) || 0,
                    image: imageUrls[0] || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=2670',
                    images: imageUrls,
                    ai_images_used: aiImagesUsed,
                    source_id: finalSourceId,
                    page_number: pageNumber,
                    group_id: selectedGroupId,
                    is_public: isPublic,
                    user_id: user.id,
                    updated_by: user.id,
                }])
                .select()
                .single();
            if (recipeErr) throw recipeErr;
            const recipeId = newRecipe.id;

            // ── Ingredients ───────────────────────────────────────────────
            let currentSection = null;
            for (const ing of ingredients) {
                if (!ing.name && ing.row_type !== 'section') continue;

                if (ing.row_type === 'section') {
                    currentSection = ing.name;
                    await supabase.from('recipe_ingredients').insert([{
                        recipe_id: recipeId,
                        display_name: ing.name,
                        section: '__header__',
                        sort_order: ingredients.indexOf(ing) + 1,
                    }]);
                    continue;
                }

                // Upsert to ingredients catalog
                let ingredientId = null;
                const { data: existingIng } = await supabase
                    .from('ingredients')
                    .select('id')
                    .eq('name', ing.name.toLowerCase().trim())
                    .maybeSingle();
                if (existingIng) {
                    ingredientId = existingIng.id;
                } else {
                    const { data: newIng } = await supabase
                        .from('ingredients')
                        .insert([{ name: ing.name.toLowerCase().trim(), default_unit: ing.unit }])
                        .select()
                        .single();
                    ingredientId = newIng?.id ?? null;
                }

                await supabase.from('recipe_ingredients').insert([{
                    recipe_id: recipeId,
                    ingredient_id: ingredientId,
                    quantity: parseFloat(ing.qty) || null,
                    unit: ing.unit,
                    preparation: ing.prep,
                    display_name: ing.name,
                    section: currentSection,
                    sort_order: ingredients.indexOf(ing) + 1,
                }]);
            }

            // ── Steps ─────────────────────────────────────────────────────
            const validSteps = steps.filter(s => s.text?.trim());
            for (let i = 0; i < validSteps.length; i++) {
                await supabase.from('instruction_steps').insert([{
                    recipe_id: recipeId,
                    step_number: i + 1,
                    instruction_text: validSteps[i].text,
                }]);
            }

            // ── Cleanup ───────────────────────────────────────────────────
            try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }

            // Navigate to the new recipe
            router.push(`/recipe/${recipeId}`);
        } catch (err) {
            console.error('[wizard] save error:', err);
            showToast(`❌ Failed to save: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, supabase, title, bookTitle, author, publisher, link,
        prepTime, cookTime, servings, imageUrls, aiImagesUsed, pageNumber,
        selectedGroupId, isPublic, ingredients, steps, router, showToast]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="pp-page-card">
            <PageHeader
                overline="New Recipe"
                title="Create Recipe"
            />

            <WizardShell
                currentStep={currentStep}
                totalSteps={TOTAL_STEPS}
                stepLabels={STEP_LABELS}
                onBack={goBack}
                onNext={goNext}
                onSave={handleSave}
                onDiscard={handleDiscard}
                onGoToStep={goToStep}
                isSaving={isSaving}
            >
                {currentStep === 1 && (
                    <Step1Scan
                        isScanning={isScanning}
                        scanError={scanError}
                        scanDone={scanDone}
                        scanUsed={scanUsed}
                        scanLimit={scanLimit}
                        onScan={handleScan}
                        onSkip={goNext}
                    />
                )}
                {currentStep === 2 && (
                    <Step2Source
                        title={title}           setTitle={setTitle}
                        sourceType={sourceType} setSourceType={setSourceType}
                        bookTitle={bookTitle}   setBookTitle={setBookTitle}
                        author={author}         setAuthor={setAuthor}
                        publisher={publisher}   setPublisher={setPublisher}
                        pageNumber={pageNumber} setPageNumber={setPageNumber}
                        link={link}             setLink={setLink}
                    />
                )}
                {currentStep === 3 && (
                    <Step4Ingredients
                        ingredients={ingredients}
                        onUpdate={handleUpdateIngredient}
                        onRemove={handleRemoveIngredient}
                        onAddIngredient={handleAddIngredient}
                        onAddSection={handleAddSection}
                        servings={servings}
                        setServings={setServings}
                    />
                )}
                {currentStep === 4 && (
                    <Step5Method
                        steps={steps}
                        onUpdate={handleUpdateStep}
                        onRemove={handleRemoveStep}
                        onAdd={handleAddStep}
                        prepTime={prepTime}
                        setPrepTime={setPrepTime}
                        cookTime={cookTime}
                        setCookTime={setCookTime}
                    />
                )}
                {currentStep === 5 && (
                    <Step6Visibility
                        isPublic={isPublic}
                        selectedGroupId={selectedGroupId}
                        groups={groups}
                        onSetPrivate={handleSetPrivate}
                        onSetHousehold={handleSetHousehold}
                        onSetPublic={handleSetPublic}
                    />
                )}
                {currentStep === 6 && (
                    <Step7Photos
                        imageUrls={imageUrls}
                        aiImagesUsed={aiImagesUsed}
                        lastBrief={lastBrief}
                        recipeTitle={title}
                        onImagesChange={handleImagesChange}
                    />
                )}
                {currentStep === 7 && (
                    <Step8Confirm
                        title={title}
                        servings={servings}
                        prepTime={prepTime}
                        cookTime={cookTime}
                        ingredients={ingredients}
                        steps={steps}
                        sourceType={sourceType}
                        bookTitle={bookTitle}
                        author={author}
                        link={link}
                        isPublic={isPublic}
                        selectedGroupId={selectedGroupId}
                        groups={groups}
                        imageUrls={imageUrls}
                        isSaving={isSaving}
                    />
                )}
            </WizardShell>

            {/* ── Toast ─────────────────────────────────────────────────── */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        position: 'fixed', bottom: '80px', left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-hairline)',
                        borderRadius: '12px', padding: '12px 20px',
                        fontSize: '0.88rem', color: 'var(--color-on-surface)',
                        zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        maxWidth: '90vw', textAlign: 'center',
                    }}
                >
                    {toast}
                </div>
            )}
        </div>
    );
}
