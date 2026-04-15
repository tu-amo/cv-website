import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkUsage, gateResponse } from "@/lib/usageGate";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
    try {
        // ── Usage gate — check auth + tier before consuming AI credits ────────
        const gate = await checkUsage('briefs');
        if (!gate.allowed) return gateResponse(gate);

        const { title, ingredients, steps, existingImages, image, type = "all" } = await req.json();

        // BRAND VOICE & STYLE GUIDELINES
        const styleGuide = `
            BRAND AESTHETIC: "The Living Cookbook" (Chef-led, soulful, cinematic)
            STYLE: "Magical Modern Kitchen Editorial"
            LIGHTING: Rembrandt-style chiaroscuro, high contrast, warm shadows.
            MOOD: Contemporary, elevated, artful home cooking, soulful.
            PALETTE: Deep olives, burnt ochres, polished slate, stone grey.
            CUES: Steam wisps, fresh herb glisten, high-quality materials (crystal, hand-blown glass, polished silver, copper, dark slate), smooth pressed linens, artfully arranged plating.
            RULE: Avoid the term "vessel". Use "bowl", "plate", or "glass".
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // MISE EN PLACE PROMPT (RAW)
        const misePrompt = `
            You are a professional Food Stylist. 
            Analyze the recipe "${title}" and ingredients: ${ingredients?.join(", ")}.
            Generate a 1-paragraph AI styling prompt for a "Mise en Place" (PREP) scene.
            FOCUS: Refined materials. Fresh ingredients in their prepared state (e.g. sliced, crushed, or flaked as per notes). 
            DYNAMICS: Geometric composition, minimal and precise. High-end bowls, polished slate, or honed wood. Smooth pressed linens.
            ${image ? `VISUAL AUDIT: Use the attached photo's composition as a structural anchor, but refine it with a contemporary geometric feel.` : ''}
            ${styleGuide}
            Return ONLY the prompt text, no headers.
        `;

        // HERO PROMPT (FINISHED)
        const heroPrompt = `
            You are a professional Food Stylist. 
            Analyze the recipe "${title}". 
            Context Ingredients: ${ingredients?.join(", ")}.
            Context Method: ${steps?.join(". ")}.
            Generate a 1-paragraph AI styling prompt for a "Finished Dish" (HERO) scene.
            FOCUS: The final result. artfully arranged plating, glistening sauces, precise garnishes. 
            STYLING: Use the method and prep notes to define the visual state and textures (e.g. charred edges, glossy glaze, flaked fish, sliced textures).
            DYNAMICS: Artful and balanced plating, Rembrandt lighting, cinematic modernist soul. Refined crystal, polished silver, and smooth, tailored linens.
            ${image ? `VISUAL AUDIT: Use the attached photo's specific plating/composition as the structural foundation, but elevate it to a editorial standard.` : ''}
            ${styleGuide}

            ${existingImages?.length > 0 ? `REFERENCE SOURCE: Use the provided raw user photo as a "Visual Anchor" for layout and scene structure, but elevate the lighting and styling to match the guide.` : ''}

            IMPORTANT: 
            - Focus on sensory details (texture, steam, color).
            - Use 16:9 aspect ratio.
            - Ensure the Spanish/South African magical aesthetic is felt through props (clay bowls, wood, textured fabrics).
            - Return ONLY the prompt text, no headers or conversational filler.
        `;

        console.log("API: Brief Generation Started for:", title);
        console.log("API: Image Context Provided?", !!image);

        const imagePart = image ? {
            inlineData: { data: image, mimeType: "image/jpeg" }
        } : null;

        // Generate both in parallel for speed
        console.log("API: Calling Gemini-3-flash-preview...");
        const [miseResult, heroResult] = await Promise.all([
            model.generateContent(imagePart ? [misePrompt, imagePart] : misePrompt),
            model.generateContent(imagePart ? [heroPrompt, imagePart] : heroPrompt)
        ]);

        console.log("API: Gemini Generation Complete.");

        const briefs = {
            mise: miseResult.response.text().trim(),
            hero: heroResult.response.text().trim()
        };

        return new Response(JSON.stringify({ briefs }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Brief Generation Error:", error);

        // Handle Quota/Rate Limit Errors (429)
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
            return new Response(JSON.stringify({
                error: "AI Quota Exceeded. Gemini is very popular right now! Please try again in 60 seconds.",
                code: "QUOTA_EXCEEDED"
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle Service Unavailable (503)
        if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded') || error.message?.includes('demand')) {
            return new Response(JSON.stringify({
                error: "Gemini is experiencing very high demand right now. Please try again in a few moments.",
                code: "SERVICE_OVERLOADED"
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
