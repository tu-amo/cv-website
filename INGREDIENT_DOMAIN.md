# Ingredient Domain Specification: The "Living Cookbook" Grammar

This document defines the core logic, domain rules, and data structures for the **Living Cookbook** recipe parsing engine. It serves as a persistent "Source of Truth" for any agent or developer working on the project.

---

## 🏗 Core Architectural Principles (Hardened)

1. **Hybrid Intelligence**: Use Vision AI for unstructured OCR, but force all data through the **Deterministic Rules Engine** (`src/lib/recipe-utils.js`) for standardization.
2. **Decimal Preference**: Always store and display quantities as **Decimals** (e.g., `0.5`, `1.5`). Avoid fraction strings like `1/2` or `1 1/2` in the database.
3. **Metric Priority**: In any ingredient string with multiple units (e.g., `500g / 1 lb`), the **Metric unit** (g, ml, kg, l) takes absolute precedence.
4. **Universal Extraction**: Quantities and units can appear anywhere in the string (Beginning, Parentheses, or End). The engine searches the entire line recursively.

---

## ⚖️ Logical Rule-Set (Current v4.6)

### 1. Numeric Transformation
- **Fraction-to-Decimal**: Compound fractions (`1 1/2`) are converted to `1.5`. Simple fractions (`1/2`) are converted to `0.5`.
- **Range Handling**: Hyphenated ranges (`1.5-2kg`) are preserved as strings (`1.5-2`) for the `qty` field.
- **Multiplier Expansion**: Multiplication strings (`2 x 400g`) are extracted and decimalized (e.g., `2 x 400`).

### 2. Unit & Defaulting Rules
- **Fuzzy Units**: Words like `bunch`, `handful`, `knob`, `clove`, `splash`, `juice`, and `zest` are treated as valid units.
- **Implicit Quantity**: If a fuzzy unit is found without a preceding number (e.g., `Large bunch coriander`), the system **defaults Qty to 1**.
- **Adjective Peeling**: Subjective descriptors (`Large`, `Fresh`, `Cold`, `Unsalted`, `Cubed`) are proactively stripped from the `name` field and moved to the `prep` field.

### 3. Structural Row Detection
- **Section Headers**: Lines starting with `###`, starting with `FOR THE`, ending with `/`, ending with `:`, or written in **ALL CAPS** are detected as `row_type: "section"`.

---

## 📊 Standard Verification Suite (Testing Matrix)

| Test Case | Desired Output (Structured) | Rule Being Tested |
| :--- | :--- | :--- |
| `Large bunch fresh coriander` | `1` / `bunch` / `coriander` | Fuzzy Defaulting + Adjective Strip |
| `4 x 1/4 pound beef patties` | `4 x 0.25` / `lb` / `beef patties` | Multiplier + Decimal Conversion |
| `FOR THE SAUCE:` | `row_type: section` | Automatic Section Detection |
| `Eggs (large) 4` | `4` / `1` (pc) / `Eggs` | Reverse Notation (Pass 3) |
| `1.5kg-2kg shoulder of lamb` | `1.5-2` / `kg` / `shoulder of lamb` | Double-Unit Range Extraction |

---

## 🛠 Active Workflows
- **`/verify-parser`**: Triggers the regression test suite against the top 20 most complex ingredient samples.
- **`handleStandardize`**: The front-end function that triggers this logic-engine within the React UI.

---

## 📝 Roadmap for Future Agents
- [ ] **Aggregation Logic**: Build a tool to sum `qty` and `unit` across multiple recipes for grocery lists.
- [ ] **Metric Conversion**: Use the `unitMap` to convert `lb/oz` to `g` automatically upon save.
- [ ] **Nutritional Density**: Link standardized names to a USDA or FDC API for automated calorie counting.
