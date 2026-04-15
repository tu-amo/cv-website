---
description: How to verify the recipe instruction cleaning logic (standardizeText) against diverse imperial measurement samples (20+ Scenarios).
---

To ensure that method instructions are correctly converted to metric (e.g., LB to G, Fahrenheit to Celsius), follow these steps:

1. Create a temporary file `/tmp/test_text_cleanup.js` with the following comprehensive validation logic:
```javascript
import { standardizeText } from "/Users/janescott/Projects/Anti/living-cookbook/src/lib/recipe-utils.js";

const testCases = [
    { input: "Roast the 2 lb chicken for 1 hour.", expected: "Roast the 905g chicken for 1 hour.", desc: "Basic Pound Conversion" },
    { input: "Use 8 oz of butter.", expected: "Use 225g of butter.", desc: "Basic Ounce Conversion" },
    { input: "Divide into 4 oz patties.", expected: "Divide into 115g patties.", desc: "Unit without 'of'" },
    { input: "1/2 lb of bacon, chopped.", expected: "225g of bacon, chopped.", desc: "Fractional Pound" },
    { input: "Bake at 400 Fahrenheit for 20 mins.", expected: "Bake at 205°C for 20 mins.", desc: "Temperature (F -> C)" },
    { input: "Add 1.5 lb of beef.", expected: "Add 680g of beef.", desc: "Decimal Pound" },
    { input: "Use 1 lb beef and 8 oz pork.", expected: "Use 455g beef and 225g pork.", desc: "Multiple conversions" },
    { input: "Preheat to 450 °F.", expected: "Preheat to 230°C.", desc: "High temperature" },
    { input: "Slow cook at 250 Fahrenheit.", expected: "Slow cook at 120°C.", desc: "Low temperature" },
    { input: "Add 12 ounces of water.", expected: "Add 340g of water.", desc: "Plural units (ounces)" },
    { input: "The weight should be 1.2 lb.", expected: "The weight should be 545g.", desc: "Trailing units" },
    { input: "Add 1 1/4 lb of sugar.", expected: "Add 565g of sugar.", desc: "Compound fractions" },
    { input: "Stir in the 0.5 oz of salt.", expected: "Stir in the 15g of salt.", desc: "Small decimal" },
    { input: "Bake at 350°F.", expected: "Bake at 175°C.", desc: "Temp with degree (no space)" },
    { input: "Prepare 10 lb of potatoes.", expected: "Prepare 4535g of potatoes.", desc: "Large quantity (10 lb)" },
    { input: "Add 500g of flour.", expected: "Add 500g of flour.", desc: "Metric preservation" },
    { input: "Heat to 180°F (80°C).", expected: "Heat to 80°C (80°C).", desc: "Mixed units in parenthesis" },
    { input: "Season with 1/4 ounce of pepper.", expected: "Season with 5g of pepper.", desc: "Fractional ounce" }
];

console.log("🧪 Running Expanded Method Text Cleanup Validation...\n");

let failures = 0;
testCases.forEach(({input, expected, desc}) => {
    const result = standardizeText(input);
    const pass = result === expected;
    console.log(`${pass ? '✅' : '❌'} ${desc}`);
    if (!pass) {
        failures++;
        console.log(`   Input: "${input}"`);
        console.log(`   Expected: "${expected}"`);
        console.log(`   Result:   "${result}"`);
    }
});
```

// turbo
2. Run the test script using Node.js:
```bash
node /tmp/test_text_cleanup.js
```

3. If all tests pass with ✅, the logic is stable. If any fail with ❌, review the `standardizeText` regex patterns.

4. Delete the temporary script:
```bash
rm /tmp/test_text_cleanup.js
```
