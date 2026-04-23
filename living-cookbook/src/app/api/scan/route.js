import { getGeminiModel } from "@/lib/ai/gemini";
import { NextResponse }   from "next/server";
import { checkUsage, gateResponse } from "@/lib/usageGate";


export async function POST(req) {
  try {
    // ── Usage gate — check auth + tier before consuming AI credits ────────
    const gate = await checkUsage('scans');
    if (!gate.allowed) return gateResponse(gate);

    const { imageBase64, mimeType, unitSystem = 'metric' } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Map the user's unit preference to a clear Gemini instruction
    const unitInstruction = {
      metric:      'Convert all ingredient measurements to metric units (grams, millilitres, °C). E.g. 2 sticks of butter → 225g, 1 cup → 240ml.',
      uk_imperial: 'Use UK Imperial units: ounces (oz), pounds (lb), UK fluid ounces (UK fl oz), UK pints (568ml), tablespoons, teaspoons, and °C for temperatures.',
      us_imperial: 'Use US Customary units: cups, teaspoons (tsp), tablespoons (tbsp), US fluid ounces, US pints (473ml), and °F for temperatures.',
    }[unitSystem] ?? 'Convert all ingredient measurements to metric units (grams, millilitres, °C).';

    const prompt = `
    You are an expert culinary AI designed to extract recipe data from photos of cookbooks and handwritten recipe cards.
    Please read the provided image and extract the following information strictly in JSON format.
    Do not include any markdown formatting (like \`\`\`json) in your response, just the raw JSON object.

    UNIT SYSTEM: ${unitInstruction}

    IMPORTANT TITLE FORMATTING RULES:
    1. Never use ALL CAPS for the title. 
    2. Convert any instance of the word "and" into an ampersand "&" in the title.
    3. Use Title Case (capitalize nouns and main words, but leave words like "in", "of", "the" lowercase).
    Example: "CUCUMBER AND SHIITAKE IN SESAME-VINEGAR" must become "Cucumber & Shiitake in Sesame-Vinegar".

    The JSON must follow this exact structure:
    {
      "title": "Recipe Name",
      "prepTime": 15, // as an integer in minutes (0 if none)
      "cookTime": 45, // as an integer in minutes (0 if none)
      "servings": 4,  // as a float or integer (0 if none)
      "source": {
        "bookTitle": "The Essentials of Classic Italian Cooking", // string or empty
        "author": "Marcella Hazan", // string or empty
        "publisher": "Alfred A. Knopf", // string or empty
        "pageNumber": "214", // string or empty
        "link": "" // string or empty
      },
      "ingredients": [
        {
          "row_type": "ingredient", // or "section"
          "qty": 2, // integer or float (for ingredients)
          "unit": "tbsp", // standard measurement unit (for ingredients)
          "name": "olive oil", // or section name e.g. "FOR THE SAUCE"
          "prep": "extra virgin" // prep note (for ingredients)
        }
      ],
      "steps": [
        "First step text...",
        "Second step text..."
      ]
    }

    Note on Ingredients:
    If you see a section header like "The Marinade" or "For the Dough", include it in the 'ingredients' array with "row_type": "section" and the name.
    Otherwise, use "row_type": "ingredient" for all items.
    `;

    // Package the base64 image for Gemini
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    };

    // Create the model instance via shared client
    const model = getGeminiModel('gemini-3-flash-preview', {
      generationConfig: { responseMimeType: "application/json" }
    });

    // Call Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const responseText = response.text();

    // Parse the JSON response
    try {
      const recipeData = JSON.parse(responseText);
      // Include usage info so the wizard Step 1 can render the meter
      // without a separate API round-trip
      const { used, limit } = gate;
      return NextResponse.json({ ...recipeData, _meta: { scansUsed: used ?? null, scansLimit: limit ?? null } });
    } catch (parseError) {
      console.error("Gemini Response Parse Error:", responseText);
      return NextResponse.json({ error: "Failed to parse API response into JSON." }, { status: 500 });
    }

  } catch (error) {
    console.error("Gemini Vision API Error:", error);

    // Handle Quota/Rate Limit Errors
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return NextResponse.json({ 
        error: "Scanning Quota Exceeded. Gemini 3 is very popular right now! Please try again in 60 seconds.",
        code: "QUOTA_EXCEEDED"
      }, { status: 429 });
    }

    return NextResponse.json({ error: error.message || "Failed to process image scan." }, { status: 500 });
  }
}
