import { cookingTerms } from "./cooking-terms.js";

/**
 * Formats a quantity based on the servings ratio.
 */
export const formatQuantity = (qty, servings, originalServings) => {
    // Check for null/undefined specifically to allow 0 or empty string as valid input
    if (qty === null || qty === undefined || servings === null || servings === undefined || !originalServings) return qty;

    // Type-Safety: Ensure we are working with a string for includes/toLowerCase logic
    const qtyStr = qty.toString().trim();
    if (!qtyStr) return qty;

    const ratio = servings / originalServings;

    // Handle Ranges or Multipliers via recursive calls
    if (qtyStr.includes("-")) {
        return qtyStr.split("-").map(part => formatQuantity(part.trim(), servings, originalServings)).join("-");
    }
    if (qtyStr.toLowerCase().includes("x")) {
        return qtyStr.split(/x/i).map((part, i) => i === 0 ? formatQuantity(part.trim(), servings, originalServings) : part.trim()).join(" x ");
    }

    const decimal = parseFloat(fractionToDecimal(qtyStr));
    if (isNaN(decimal)) return qty;
    return parseFloat((decimal * ratio).toFixed(2)).toString();
};

/**
 * Grammatically pluralizes a unit based on quantity.
 */
export const displayUnit = (qty, unit) => {
    if (!unit) return "";

    // 1. Determine numeric quantity value for logic
    let val = 1;
    if (qty && typeof qty === 'string') {
        const cleaned = fractionToDecimal(qty.split("-")[0].split("x")[0].trim());
        val = parseFloat(cleaned) || 1;
    } else if (typeof qty === 'number') {
        val = qty;
    }

    // 2. Units that SHOULD NOT be pluralized (symbols/metrics)
    const symbols = ["g", "ml", "kg", "l", "oz", "lb"];
    if (symbols.includes(unit.toLowerCase())) return unit;

    // 3. Logic for pluralization (> 1)
    if (val > 1) {
        if (unit.toLowerCase().endsWith("s")) return unit; // Avoid double 's'
        if (unit.toLowerCase() === "pc") return "pcs";
        if (unit.toLowerCase() === "pinch") return "pinches";
        if (unit.toLowerCase() === "leaf") return "leaves";
        if (unit.toLowerCase() === "sprig") return "sprigs";
        return unit + "s";
    }

    return unit;
};

/**
 * Helper: Converts text fractions like '1/2' or '1 1/2' to decimals like '0.5' or '1.5'
 */
const fractionToDecimal = (str) => {
    if (!str) return "";
    let trimmed = str.trim().replace(/\s+/g, " ");

    // Handle Ranges (e.g. 1/2-3/4 or 1.5-2)
    if (trimmed.includes("-")) {
        return trimmed.split("-").map(part => fractionToDecimal(part)).join("-");
    }
    // Handle Multipliers (e.g. 4 x 1/2)
    if (trimmed.toLowerCase().includes("x")) {
        return trimmed.split(/x/i).map(part => fractionToDecimal(part.trim())).join(" x ");
    }
    if (trimmed.includes("*")) {
        return trimmed.split("*").map(part => fractionToDecimal(part.trim())).join(" x ");
    }

    // Handle compound fractions (e.g. 1 1/2)
    const compound = trimmed.split(" ");
    if (compound.length === 2) {
        const whole = parseFloat(compound[0]);
        const frac = compound[1].split("/");
        if (frac.length === 2) {
            return (whole + (parseFloat(frac[0]) / parseFloat(frac[1]))).toString();
        }
    }

    // Handle simple fractions (e.g. 1/2)
    const parts = trimmed.split("/");
    if (parts.length === 2) {
        const dec = parseFloat(parts[0]) / parseFloat(parts[1]);
        return dec.toString();
    }

    return trimmed;
};

const cleanNum = (str) => {
    if (!str) return "";
    const s = String(str || "");
    let cleaned = s.replace(/[^\d/.x*×\s-]/g, "").trim();
    return fractionToDecimal(cleaned);
};

const unitMap = {
    "g": "g", "gram": "g", "grams": "g",
    "kg": "kg", "kilogram": "kg", "kilograms": "kg",
    "ml": "ml", "millilitre": "ml", "millilitres": "ml", "mls": "ml",
    "l": "l", "litre": "l", "litres": "l",
    "oz": "oz", "ounce": "oz", "ounces": "oz",
    "lb": "lb", "pound": "lb", "pounds": "lb",
    "tsp": "teaspoon", "teaspoon": "teaspoon", "teaspoons": "teaspoon",
    "tbsp": "tablespoon", "tablespoon": "tablespoon", "tablespoons": "tablespoon",
    "cup": "cup", "cups": "cup",
    "clove": "clove", "cloves": "clove",
    "bunch": "bunch", "bunches": "bunch",
    "handful": "handful", "handfuls": "handful",
    "knob": "knob", "knobs": "knob",
    "juice": "juice", "splash": "splash",
    "pinch": "pinch", "pinches": "pinch",
    "dash": "dash", "dashes": "dash",
    "piece": "pc", "pieces": "pc",
    "can": "can", "cans": "can",
    "tin": "tin", "tins": "tin"
};

const fuzzyUnits = ["bunch", "handful", "knob", "clove", "sprig", "leaf", "leaves", "head", "cloves", "sprigs", "juice", "zest", "splash"];
const adjectives = ["large", "small", "medium", "fresh", "dried", "cold", "warm", "hot", "extra", "virgin", "unsalted", "salted", "organic", "raw", "cooked", "ripe", "unripe", "frozen", "chilled", "cloveless", "whole", "needed", "dried"];
const varieties = ["caster", "granulated", "brown", "light", "dark", "muscovado", "icing", "self-raising", "plain", "strong", "bread", "all-purpose", "00", "extra-virgin", "olive", "vegetable", "sunflower", "rapeseed", "canola", "sesame", "peanut", "nut", "skimmed", "semi-skimmed", "oat", "soy", "almond", "coconut", "greek", "natural", "full-fat", "low-fat"];

/**
 * Standardizes an ingredient object.
 */
export const standardizeIngredient = (ing) => {
    if (!ing || ing.row_type === 'section') return ing;
    return {
        ...ing,
        unit: (ing.unit ? (unitMap[ing.unit.toLowerCase()] || ing.unit) : ""),
        qty: cleanNum(ing.qty)
    };
};

/**
 * Standardizes instruction text by converting units to metric where possible.
 */
export const standardizeText = (text) => {
    if (!text) return "";
    let newText = text;
    const numPattern = "((?:\\d+\\s+)?\\d+[/.-]\\d+|\\d+(?:\\.\\d+)?)";

    // 1. Compound Weight Conversion (LB + OZ -> Grams合计)
    const compoundRegex = new RegExp(numPattern + "\\s*(?:lb|pound|pounds)s?\\s*" + numPattern + "\\s*(?:oz|ounce|ounces)s?\\b", "gi");
    newText = newText.replace(compoundRegex, (m, lbStr, ozStr) => {
        const lb = parseFloat(fractionToDecimal(lbStr));
        const oz = parseFloat(fractionToDecimal(ozStr));
        if (isNaN(lb) || isNaN(oz)) return m;
        const totalG = (lb * 453.59) + (oz * 28.35);
        return Math.round(totalG / 5) * 5 + "g";
    });

    // 2. Weight Conversion (LB -> Grams)
    newText = newText.replace(new RegExp(numPattern + "\\s*(?:lb|pound|pounds)s?\\b", "gi"), (m, c) => {
        const dec = parseFloat(fractionToDecimal(c));
        if (isNaN(dec)) return m;
        return Math.round(dec * 453.6 / 5) * 5 + "g";
    });

    // 3. Weight Conversion (OZ -> Grams)
    newText = newText.replace(new RegExp(numPattern + "\\s*(?:oz|ounce|ounces)s?\\b", "gi"), (m, c) => {
        const dec = parseFloat(fractionToDecimal(c));
        if (isNaN(dec)) return m;
        return Math.round(dec * 28.35 / 5) * 5 + "g";
    });

    // 3. Temp Conversion (F -> C)
    newText = newText.replace(/(\d+)\s*(?:°F|Fahrenheit)\b/gi, (m, f) => {
        const temp = parseInt(f);
        const celsius = Math.round(((temp - 32) * 5 / 9) / 5) * 5; // Round to 5°C
        return celsius + "°C";
    });

    return newText;
};

/**
 * Main parser: converts a raw string line into a structured ingredient object or section marker.
 */
export const smartParseIngredient = (line) => {
    if (!line || typeof line !== 'string') return null;
    let text = line.trim();
    if (!text) return null;

    // Rule 1: Section Header Detection
    if (text.startsWith("###") || text.toLowerCase().startsWith("for the") || text.endsWith("/") || text.endsWith(":") || /^[A-Z][A-Z\s]+$/.test(text)) {
        const cleanName = text.replace(/^###\s*|[:/]$/g, '').trim();
        return {
            row_type: 'section',
            name: cleanName,
            display_name: cleanName
        };
    }

    const stripShadowQuantities = (t) => {
        const shadowRegex = /^((?:\d+[\s./-]*)+\s*((?:cup|tbsp|tsp|tablespoon|teaspoon|pc|lb|oz|\bs\b|bunch|head|sprig|clove)s?)?\s*(?:of)?\s*)/i;
        return t.replace(shadowRegex, "").trim();
    };

    let qty = "";
    let unit = "";
    let name = "";
    let prepStrings = [];

    // Rule 1.5: Multiplier Extraction (e.g. 2 x 400g)
    const multiMatch = text.match(/^([\d\s./-]+\s*[x*×xX⨯✕✖\u00D7]\s*[\d\s./,]+)\s*(g|ml|kg|l|lb|pound|oz|ounce|cup|tsp|tbsp|pc|clove)s?\b/i);
    if (multiMatch) {
        qty = cleanNum(multiMatch[1].trim());
        unit = multiMatch[2].toLowerCase();
        text = text.replace(multiMatch[0], "").trim();
    }

    // Rule 1.6: "As Needed" Support
    if (!qty && text.toLowerCase().startsWith("as needed")) {
        qty = "as needed";
        text = text.substring(9).trim();
    }

    // Rule 2: Priority Leading Quantity
    const leadMatch = text.match(/^((?:\d+\s+)?[\d/.]+(?:-[\d/.]+)?)\s*/);
    if (leadMatch && !qty) {
        qty = cleanNum(leadMatch[1]);
        text = text.replace(leadMatch[0], "").trim();
    }

    // Metric Search (Only if qty not found yet at the head)
    if (!qty) {
        // Double Unit Range
        const doubleMetricRange = text.match(/([\d\s./-]*\d[\d\s./,]*)\s*(g|ml|kg|l)\s*-\s*([\d\s./,]*\d[\d\s./,]*)\s*(g|ml|kg|l)\b/i);
        if (doubleMetricRange) {
            qty = cleanNum(doubleMetricRange[1].trim()) + "-" + cleanNum(doubleMetricRange[3].trim());
            unit = doubleMetricRange[4].toLowerCase();
            text = text.replace(doubleMetricRange[0], "").trim();
        } else {
            // Single Unit
            const metricMatch = text.match(/([\d\s./-]*\d[\d\s./,]*)\s*(g|ml|kg|l)\b/i);
            if (metricMatch) {
                qty = cleanNum(metricMatch[1].trim());
                unit = metricMatch[2].toLowerCase();
                text = text.replace(metricMatch[0], "").trim();
            }
        }
    }

    // Comma Logic
    let commaSplit = text.split(",");
    let baseText = commaSplit[0].trim();
    if (commaSplit.length > 1) {
        prepStrings.push(commaSplit.slice(1).join(",").trim());
    }

    // Rule 4: Parenthetical Metric check (if not found yet)
    if (!qty) {
        const parenMatch = baseText.match(/\(([^)]*?([\d\s.-]+)\s*(g|ml|kg|l))\)/i);
        if (parenMatch) {
            qty = cleanNum(parenMatch[2].trim());
            unit = parenMatch[3].toLowerCase();
            baseText = baseText.replace(parenMatch[0], "").trim();
        }
    }

    // Rule 3: Number Flip (Bangers 8)
    const flipMatch = baseText.match(/(.*?)\s+(\d+)$/);
    if (flipMatch && !qty) {
        qty = flipMatch[2];
        baseText = flipMatch[1].trim();
    }

    // Final Cleanup shadow junk after metrics logic
    baseText = stripShadowQuantities(baseText);
    baseText = baseText.replace(/^\/\s*/, "").trim();
    
    // Protect parentheticals that are NOT just unit shadowings (e.g. "as needed (such as...)")
    // HARDENING: Ensure units are full word matches to avoid matching "l" in "lime"
    baseText = baseText.replace(/\s*\(?([\d\s./,-]*\d[\d\s./,-]*\s*\b(clove|bunch|head|sprig|cup|tbsp|tsp|lb|oz|g|ml|kg|l)s?\b)\)?/gi, "").trim();
    // Fuzzy Pass
    const allUnits = [...new Set([...fuzzyUnits, ...Object.keys(unitMap), "pc", "can", "tin", "packet", "sachet"])];
    let words = baseText.split(/\s+/);

    for (let i = 0; i < Math.min(words.length, 3); i++) {
        const cleanWord = words[i]?.toLowerCase().replace(/[.,]$/, "");
        if (allUnits.includes(cleanWord) || (cleanWord?.endsWith('s') && allUnits.includes(cleanWord.slice(0, -1)))) {
            if (!unit || unit === 'pc') {
                unit = unitMap[cleanWord] || (cleanWord.endsWith('s') ? cleanWord.slice(0, -1) : cleanWord);
                words.splice(i, 1);
                if (words[i] && (words[i].toLowerCase() === 'of' || words[i].toLowerCase() === 'around')) {
                    words.splice(i, 1);
                }
                baseText = words.join(" ");
                if (!qty) qty = "1";
                break;
            }
        }
    }

    // Word Analysis
    words = baseText.split(/\s+/);
    let nameParts = [];
    words.forEach((word) => {
        if (!word) return;
        const clean = word.toLowerCase().replace(/[.,]$/, "");
        if (varieties.includes(clean)) nameParts.push(word);
        else if (adjectives.includes(clean)) prepStrings.push(word);
        else if (clean.endsWith("ed") || ["chopped", "crushed", "minced", "diced", "grated", "peeled", "sliced", "smashed", "shredded", "beaten", "whisked", "removed", "picked", "cut", "halved", "discard"].includes(clean)) prepStrings.push(word);
        else if (["style", "regular", "fresh", "by", "with", "and", "into", "from", "roughly", "finely", "coarsely", "lightly", "thinly", "thickly", "hand", "stems", "pieces", "cubes", "halves", "only", "discard"].includes(clean)) prepStrings.push(word);
        else if (word === qty) return; // Skip if this word is exactly the quantity we already extracted
        else nameParts.push(word);
    });

    name = nameParts.join(" ").trim();
    let finalPrep = prepStrings.join(" ").trim();

    // Sanitize
    const sanitize = (val) => (val === null || val === undefined) ? "" : val.toString().trim();
    qty = sanitize(qty);
    unit = sanitize(unitMap[unit.toLowerCase()] || unit);
    if (qty && !unit) unit = "pc"; // Default to pieces if quantity exists but unit is missing
    name = sanitize(name);
    finalPrep = sanitize(finalPrep);

    return {
        row_type: "ingredient",
        qty,
        unit,
        name,
        prep: finalPrep,
        display_name: name
    };
};

/**
 * Scales all numeric quantities found in a text string by a given ratio.
 * Intelligent enough to avoid scaling non-food numbers like temperatures.
 */
export const scaleText = (text, ratio) => {
    if (!text || !ratio || ratio === 1) return text;

    const numPattern = "((?:\\d+\\s+)?\\d+[/.-]\\d+|\\d+(?:\\.\\d+)?)";
    // We only scale numbers that are followed by known units to prevent scaling 'Step 1' or '20 minutes'
    const units = ["g", "ml", "kg", "l", "oz", "lb", "pound", "gram", "kilogram", "cup", "teaspoon", "tsp", "tablespoon", "tbsp", "clove", "bunch", "handful", "knob", "juice", "splash"];
    const regex = new RegExp(numPattern + "\\s*(" + units.join("|") + ")s?\\b", "gi");

    return text.replace(regex, (m, qtyStr, unitStr) => {
        const dec = parseFloat(fractionToDecimal(qtyStr));
        if (isNaN(dec)) return m;
        const scaled = parseFloat((dec * ratio).toFixed(2)).toString();
        // Spacing: no space for metric (ml,g,kg,l), space for everything else
        const isMetric = ["g", "ml", "kg", "l"].includes(unitStr.toLowerCase());
        const space = isMetric ? "" : " ";
        return scaled + space + unitStr;
    }).replace(/\s\s+/g, " ");
};

/**
 * Orchestrates scaling for both ingredients and steps.
 */
export const scaleRecipe = (ingredients, steps, ratio) => {
    const scaledIngs = ingredients.map(ing => {
        if (ing.row_type === 'section' || !ing.qty) return ing;

        // Handle multipliers like 2 x 400
        if (ing.qty.toLowerCase().includes("x")) {
            return {
                ...ing,
                qty: ing.qty.split(/x/i).map((part, i) => {
                    // We usually only scale the FIRST part of a multiplier 
                    // e.g. 2 x 400g (2 cans of 400g) becomes 4 x 400g if doubled
                    const cleanPart = part.trim();
                    if (i === 0) {
                        const dec = parseFloat(fractionToDecimal(cleanPart));
                        return isNaN(dec) ? cleanPart : parseFloat((dec * ratio).toFixed(2)).toString();
                    }
                    return cleanPart;
                }).join(" x ")
            };
        }

        const dec = parseFloat(fractionToDecimal(ing.qty));
        if (isNaN(dec)) return ing;
        return { ...ing, qty: parseFloat((dec * ratio).toFixed(2)).toString() };
    });

    const scaledSteps = steps.map(step => ({
        ...step,
        text: scaleText(step.text, ratio)
    }));

    return { scaledIngs, scaledSteps };
};

/**
 * Aggregates items in the shopping list by name and unit.
 * e.g. ["200g Flour", "300g Flour"] -> "500g Flour"
 */
export const aggregateShoppingList = (items) => {
    if (!items || items.length === 0) return [];

    const groups = {};

    const unitNormalization = {
        'g': { base: 'g', factor: 1 },
        'gram': { base: 'g', factor: 1 },
        'grams': { base: 'g', factor: 1 },
        'kg': { base: 'g', factor: 1000 },
        'kilogram': { base: 'g', factor: 1000 },
        'kilograms': { base: 'g', factor: 1000 },
        'ml': { base: 'ml', factor: 1 },
        'milliliter': { base: 'ml', factor: 1 },
        'milliliters': { base: 'ml', factor: 1 },
        'l': { base: 'ml', factor: 1000 },
        'liter': { base: 'ml', factor: 1000 },
        'liters': { base: 'ml', factor: 1000 },
        'lb': { base: 'g', factor: 453.59 },
        'pound': { base: 'g', factor: 453.59 },
        'pounds': { base: 'g', factor: 453.59 },
        'oz': { base: 'g', factor: 28.35 },
        'ounce': { base: 'g', factor: 28.35 },
        'ounces': { base: 'g', factor: 28.35 },
    };

    items.forEach(item => {
        const rawName = (item.item_name || item.name || "Unknown Item").trim();
        const ident = rawName.toLowerCase();
        let rawUnit = (item.unit || "").trim().toLowerCase();
        const qty = parseFloat(item.quantity || item.qty || 0);

        if (!groups[ident]) {
            groups[ident] = {
                id: item.id || Math.random().toString(36).substr(2, 9),
                item_name: rawName,
                units: {},
                recipe_ids: [],
                original_items: []
            };
        }

        // Normalize unit if possible
        const norm = unitNormalization[rawUnit];
        const unit = norm ? norm.base : (rawUnit || "pc");
        const normalizedQty = norm ? qty * norm.factor : qty;

        if (!groups[ident].units[unit]) groups[ident].units[unit] = 0;
        if (!isNaN(normalizedQty)) {
            groups[ident].units[unit] = parseFloat((groups[ident].units[unit] + normalizedQty).toFixed(2));
        }

        if (item.recipe_id && !groups[ident].recipe_ids.includes(item.recipe_id)) {
            groups[ident].recipe_ids.push(item.recipe_id);
        }
        groups[ident].original_items.push(item);
    });

    // Map back to display-ready objects
    return Object.values(groups).map(group => {
        const unitKeys = Object.keys(group.units);

        const formattedResults = unitKeys.map(u => {
            let val = group.units[u];
            let displayU = u;

            // Convert back to larger units if appropriate
            if (u === 'g' && val >= 1000) {
                val = parseFloat((val / 1000).toFixed(3));
                displayU = 'kg';
            } else if (u === 'ml' && val >= 1000) {
                val = parseFloat((val / 1000).toFixed(3));
                displayU = 'l';
            }

            return { val, unit: displayU };
        });

        if (formattedResults.length === 1) {
            return {
                ...group,
                qty: formattedResults[0].val,
                unit: formattedResults[0].unit,
                is_checked: group.original_items.every(i => i.is_checked)
            };
        }

        const comboQty = formattedResults
            .map(res => {
                const unitStr = displayUnit(res.val, res.unit);
                return `${res.val}${unitStr ? " " + unitStr : ""}`;
            })
            .join(" and ");

        return {
            ...group,
            qty: comboQty,
            unit: "",
            is_checked: group.original_items.every(i => i.is_checked)
        };
    }).sort((a, b) => a.item_name.localeCompare(b.item_name));

};

/**
 * Mock Pricing API - Returns an estimated price for an ingredient.
 * In a real app, this would call a grocery pricing API.
 */
const mockPriceData = {
    'flour': 0.002, // per g
    'butter': 0.012, // per g
    'sugar': 0.001, // per g
    'milk': 0.0015, // per ml
    'egg': 0.25, // per pc
    'chicken': 0.008, // per g
    'onion': 0.50, // per pc
    'garlic': 0.15, // per clove/pc
    'olive oil': 0.02, // per ml
};

export const estimateIngredientPrice = (name, qty, unit) => {
    const item = name.toLowerCase();
    const basePrice = Object.entries(mockPriceData).find(([key]) => item.includes(key))?.[1];
    
    if (!basePrice) return null;

    // Convert to base if necessary (g/ml)
    let calcQty = qty;
    if (unit === 'kg') calcQty *= 1000;
    if (unit === 'l') calcQty *= 1000;

    return parseFloat((calcQty * basePrice).toFixed(2));
};

export const calculateListBudget = (displayItems) => {
    return displayItems.reduce((acc, item) => {
        const price = estimateIngredientPrice(item.item_name, item.qty, item.unit);
        return acc + (price || 0);
    }, 0);
};
/**
 * Returns an array of elements { type: 'text'|'term'|'timer', content, data?, minutes? }
 */
export const parseRecipeText = (text) => {
    if (!text) return [];

    // 1. Find Timer matches: e.g. "10 minutes", "1 hour", "5-10 min"
    const timerRegex = /\b(\d+(?:-\d+)?)\s*(minutes?|mins?|hours?|hrs?)\b/gi;

    // 2. Find Terms matches from cookingTerms
    const terms = cookingTerms.map(t => t.term.split('|').map(p => p.trim())).flat();
    // Sort terms by length descending to match longest possible terms first
    terms.sort((a, b) => b.length - a.length);
    const termRegex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');

    // Combine all matches
    const matches = [];
    let match;

    // Reset regex indices
    timerRegex.lastIndex = 0;
    termRegex.lastIndex = 0;

    while ((match = timerRegex.exec(text)) !== null) {
        let mins = parseFloat(match[1]);
        if (match[2].toLowerCase().startsWith('h')) mins *= 60;
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'timer',
            content: match[0], // Use the FULL match (e.g. "10 minutes")
            minutes: mins
        });
    }

    while ((match = termRegex.exec(text)) !== null) {
        // Only add if not overlapping with a timer
        if (!matches.some(m => (match.index >= m.start && match.index < m.end) || (match.index + match[0].length > m.start && match.index + match[0].length <= m.end))) {
            const normalized = match[0].toLowerCase();
            const termData = cookingTerms.find(t => t.term.toLowerCase().includes(normalized));
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                type: 'term',
                content: match[0],
                data: termData
            });
        }
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Build the final array
    const result = [];
    let lastIndex = 0;

    matches.forEach(m => {
        if (m.start > lastIndex) {
            result.push({ type: 'text', content: text.slice(lastIndex, m.start) });
        }
        result.push(m);
        lastIndex = m.end;
    });

    if (lastIndex < text.length) {
        result.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return result;
};
