import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse }        from "next/server";
import { checkUsage, gateResponse } from "@/lib/usageGate";

// Initialize Gemini Client
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    // ── Usage gate — check auth + tier before consuming AI credits ────────
    const gate = await checkUsage('scans');
    if (!gate.allowed) return gateResponse(gate);

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const prompt = `
    You are an expert culinary AI designed to extract recipe data from photos of cookbooks and handwritten recipe cards.
    Please read the provided image and extract the following information strictly in JSON format.
    Do not include any markdown formatting (like \`\`\`json) in your response, just the raw JSON object.

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

    // Create the model instance
    const model = ai.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: { responseMimeType: "application/json" }
    });

    // Call Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const responseText = response.text();

    // Parse the JSON response
    try {
      const recipeData = JSON.parse(responseText);
      return NextResponse.json(recipeData);
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
