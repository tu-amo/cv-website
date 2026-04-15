---
description: How to verify the recipe scaling logic (formatQuantity) against diverse servings ratios.
---

To ensure that ingredients scale correctly when changing servings (e.g. from 2 to 4), follow these steps:

1. Create a temporary file `/tmp/test_scaler.js` with the following validation logic:
```javascript
import { formatQuantity } from "/Users/janescott/Projects/Anti/living-cookbook/src/lib/recipe-utils.js";

const testCases = [
    { qty: "2", servings: 4, original: 2, expected: "4", desc: "Basic scale up (Integer)" },
    { qty: "4", servings: 2, original: 4, expected: "2", desc: "Basic scale down (Integer)" },
    { qty: "1", servings: 3, original: 1, expected: "3", desc: "Tripling (Integer)" },
    { qty: "1.5", servings: 4, original: 2, expected: "3", desc: "Decimal scale up" },
    { qty: "0.1", servings: 3, original: 1, expected: "0.3", desc: "Floating point precision (strip trailing zeros)" },
    { qty: "1", servings: 2, original: 3, expected: "0.67", desc: "Fractional scaling (rounding up)" },
    { qty: "few", servings: 2, original: 1, expected: "few", desc: "Non-numeric quantity preservation" },
    { qty: "2", servings: 1.5, original: 1, expected: "3", desc: "Decimal servings scaling" }
];

console.log("🧪 Running Recipe Scaler Validation...\n");

let failures = 0;
testCases.forEach(({qty, servings, original, expected, desc}) => {
    const result = formatQuantity(qty, servings, original);
    const pass = result === expected;
    console.log(`${pass ? '✅' : '❌'} ${desc}`);
    if (!pass) {
        failures++;
        console.log(`   Input: Qty=${qty}, Servings=${servings}, OrigServ=${original}`);
        console.log(`   Expected: "${expected}"`);
        console.log(`   Result:   "${result}"`);
    }
});
```

// turbo
2. Run the test script using Node.js:
```bash
node /tmp/test_scaler.js
```

3. If all tests pass with ✅, the logic is stable. If any fail with ❌, check for rounding or floating point errors in `src/lib/recipe-utils.js`.

4. Delete the temporary script when finished:
```bash
rm /tmp/test_scaler.js
```
