import { GoogleGenAI } from '@google/genai';
import { NextResponse } from "next/server";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
    try {
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
          "qty": 2, // integer or float
          "unit": "tbsp", // standard measurement unit (e.g. cup, tsp, oz, g, whole)
          "name": "olive oil",
          "prep": "extra virgin" // any preparation noted (minced, chopped, melted), leave blank if none
        }
      ],
      "steps": [
        "First step text...",
        "Second step text..."
      ]
    }
    `;

        // Package the base64 image for Gemini
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType || "image/jpeg",
            },
        };

        // Call Gemini 2.5 Flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt, imagePart],
            config: {
                responseMimeType: "application/json",
            }
        });

        const responseText = response.text;

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
        return NextResponse.json({ error: error.message || "Failed to process image scan." }, { status: 500 });
    }
}
