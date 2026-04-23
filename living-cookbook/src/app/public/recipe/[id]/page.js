/**
 * Public Recipe Page — Server Component
 *
 * Performance strategy:
 *  - All data fetched server-side in parallel (eliminates TTFB from client-side useEffect)
 *  - First image signed URL resolved server-side (eliminates LCP double round-trip)
 *  - revalidate = 300 (5 min ISR) for subsequent visitors to get near-instant cached pages
 *  - Interactive shell (PublicRecipeClient) handles servings / timers / cook mode
 */

import { createClient } from "@/lib/supabase/server";
import PublicRecipeClient from "./PublicRecipeClient";
import { notFound } from "next/navigation";

// ISR: cache the page for 5 minutes, then revalidate in the background
export const revalidate = 300;

export async function generateMetadata({ params }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: recipe } = await supabase
        .from("recipes")
        .select("title, description")
        .eq("id", id)
        .single();

    if (!recipe) return { title: "Recipe Not Found — The Living Cookbook" };

    return {
        title: `${recipe.title} — The Living Cookbook`,
        description: recipe.description || `View the recipe for ${recipe.title} on The Living Cookbook.`,
        openGraph: {
            title: recipe.title,
            description: recipe.description || `A recipe from The Living Cookbook`,
        },
    };
}

export default async function PublicRecipePage({ params }) {
    const { id } = await params;
    const supabase = await createClient();

    // ── Fetch all data in parallel ──────────────────────────────────────
    const [recipeRes, ingsRes, stepsRes, notesRes] = await Promise.all([
        // sources!source_id — explicit FK hint required (LL-060)
        supabase.from("recipes").select("*, sources!source_id(*)").eq("id", id).single(),
        supabase.from("recipe_ingredients").select("*, ingredients(name)").eq("recipe_id", id).order("sort_order", { ascending: true }),
        supabase.from("instruction_steps").select("*").eq("recipe_id", id).order("step_number", { ascending: true }),
        supabase.from("recipe_notes").select("*").eq("recipe_id", id).order("created_at", { ascending: false }),
    ]);

    if (!recipeRes.data) notFound();

    const recipe = recipeRes.data;
    const ingredients = (ingsRes.data || []).map(i => ({ ...i, checked: false }));
    const steps = (stepsRes.data || []).map((s, idx) => ({ ...s, status: idx === 0 ? 'active' : 'pending' }));
    const notes = notesRes.data || [];

    // ── Pre-resolve first image signed URL server-side (critical for LCP) ──
    const rawImages = recipe.images?.length > 0 ? recipe.images : (recipe.image ? [recipe.image] : []);
    let resolvedFirstImageUrl = null;

    if (rawImages.length > 0) {
        const firstImg = rawImages[0];
        const isStoragePath = firstImg && !firstImg.startsWith('http') && !firstImg.startsWith('blob:');

        if (isStoragePath) {
            // Resolve server-side — no client round-trip needed for LCP element
            const { data } = await supabase.storage
                .from("recipe-images")
                .createSignedUrl(firstImg, 3600);
            resolvedFirstImageUrl = data?.signedUrl || null;
        } else {
            // Already a public URL — use directly
            resolvedFirstImageUrl = firstImg;
        }
    }

    return (
        <PublicRecipeClient
            recipe={recipe}
            ingredients={ingredients}
            steps={steps}
            notes={notes}
            resolvedFirstImageUrl={resolvedFirstImageUrl}
        />
    );
}
