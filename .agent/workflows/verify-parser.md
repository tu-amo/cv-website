---
description: How to verify the recipe ingredient parsing logic against stress-test samples.
---

To ensure that the ingredient parser is functioning correctly after any changes to `src/lib/recipe-utils.js`, follow these steps:

1. Create a temporary file `/tmp/test_parser.js` with the following validation logic:
```javascript
import { smartParseIngredient } from "/Users/janescott/Projects/Anti/living-cookbook/src/lib/recipe-utils.js";

const samples = [
    // --- 1. THE CLASSICS (Rules 1-3) ---
    { input: "Large bunch fresh coriander", expected: { qty: "1", unit: "bunch", name: "coriander" } },
    { input: "2 x 400g chopped tomatoes", expected: { qty: "2 x 400", unit: "g", name: "tomatoes" } },
    { input: "2-3 cloves of garlic, crushed", expected: { qty: "2-3", unit: "clove", name: "garlic" } },
    { input: "500ml vegetable stock", expected: { qty: "500", unit: "ml", name: "vegetable stock" } },
    
    // --- 2. THE FUZZY UNITS (Defaulting Rule) ---
    { input: "Handful of baby spinach", expected: { qty: "1", unit: "handful", name: "baby spinach" } },
    { input: "A knob of butter", expected: { qty: "1", unit: "knob", name: "butter" } },
    { input: "Juice of 1 lime", expected: { qty: "1", unit: "juice", name: "lime" } },
    { input: "Splash of olive oil", expected: { qty: "1", unit: "splash", name: "olive oil" } },

    // --- 3. REVERSE NOTATION (Pass 3 Logic) ---
    { input: "Woolworths pork bangers 8", expected: { qty: "8", name: "pork bangers" } }, 
    { input: "Eggs (large) 4", expected: { qty: "4", name: "Eggs" } },

    // --- 4. SECTIONS & TITLES ---
    { input: "FOR THE SAUCE:", expected: { row_type: "section", name: "FOR THE SAUCE" } },
    { input: "### THE BASE", expected: { row_type: "section", name: "THE BASE" } },

    // --- 5. MIXED MEASUREMENTS & RANGES ---
    { input: "1.5kg-2kg shoulder of lamb", expected: { qty: "1.5-2", unit: "kg", name: "shoulder of lamb" } },
    { input: "1/2 tsp dried oregano", expected: { qty: "0.5", unit: "teaspoon", name: "oregano" } },
    { input: "75g/3oz caster sugar", expected: { qty: "75", unit: "g", name: "caster sugar" } },

    // --- 6. PREP & ADJECTIVES (Extraction Rule) ---
    { input: "2 onions, finely diced", expected: { qty: "2", name: "onions", prep: "finely diced" } },
    { input: "Cold unsalted butter, cubed, 100g", expected: { qty: "100", unit: "g", name: "butter" } },
    { input: "1 tbsp sea salt flakes", expected: { qty: "1", unit: "tablespoon", name: "sea salt flakes" } },

    // --- 7. COMPLEX MULTIPLIERS ---
    { input: "3 x 15ml tablespoons honey", expected: { qty: "3 x 15", unit: "ml", name: "tablespoons honey" } },
    { input: "4 x 1/4 pound beef patties", expected: { qty: "4 x 0.25", unit: "lb", name: "beef patties" } }
];

console.log("🧪 Running Parser Validation...\n");

samples.forEach(({input, expected}) => {
    const res = smartParseIngredient(input);
    let pass = true;
    
    // Check key fields
    Object.keys(expected).forEach(key => {
        if (res[key] !== expected[key]) pass = false;
    });

    console.log(`${pass ? '✅' : '❌'} Input: "${input}"`);
    if (!pass) {
        console.log(`   Expected: ${JSON.stringify(expected)}`);
        console.log(`   Result:   ${JSON.stringify(res)}`);
    }
});
```

// turbo
```bash
node /tmp/test_parser.js
```

3. If all tests pass with ✅, the logic is stable. If any fail with ❌, review the most recent changes in `src/lib/recipe-utils.js`.

4. Delete the temporary script when finished:
```bash
rm /tmp/test_parser.js
```
