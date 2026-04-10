---
name: css-architecture
description: CSS governance rules for the Living Cookbook. Covers the M3 design token system, !important policy, SVG icon library, font loading, inline style decision tree, heading hierarchy, and utility classes. Use this skill any time you are about to add, change, or debug CSS or styling in this app.
---

# CSS Architecture — Living Cookbook

> **Quick navigation:**  
> Detailed reference → [`docs/CSS_ARCHITECTURE.md`](../../living-cookbook/docs/CSS_ARCHITECTURE.md)  
> Canonical CSS → `src/app/globals.css`  
> Icon library → `src/components/icons.js`

---

## The First Questions to Ask

Before writing any new style, ask:

1. **Is there already a CSS token for this value?** → Check `:root` in `globals.css`. Use the token. Never hardcode hex.
2. **Is this a pattern that repeats across 2+ files?** → If yes, add a utility class to `globals.css`. Do not copy-paste inline styles.
3. **Is this value dynamic (driven by JS state)?** → If yes, an inline `style={{}}` is correct. Don't fight it.
4. **Am I about to add `!important`?** → Stop. Read the `!important` policy below first.

---

## Design Token System (M3)

The token system has three layers. Always use the outermost layer available:

```
Layer 0 — Primitives    --md-ref-palette-neutral-10: #121010
               ↓
Layer 1 — Semantic      --md-sys-color-surface-container
               ↓
Layer 2 — Brand aliases --color-bg, --color-surface, --color-text-papyrus
               ↓
Layer 3 — PP compat     --pp-surface (maps back to --color-surface)
```

**In practice:** use `--color-*` and `--font-*` tokens in all CSS rules.

### Most-used tokens

| What you want | Token |
|---|---|
| Page background | `--color-bg` |
| Card / surface | `--color-surface` |
| Hovered surface | `--color-surface-container` |
| Primary text | `--color-text-papyrus` |
| Muted/secondary text | `--color-text-muted` |
| Amber accent (borders, highlights) | `--color-accent-amber` |
| Page heading font | `--font-brand` (Poppins 600) |
| Body / label font | `--font-body` (Nunito) |
| Recipe hero title | `--font-editorial` (Playfair Display) |
| Divider / hairline | `--color-divider` |
| Standard border radius | `--radius-md` (16px), `--radius-sm` (8px) |
| Fast transition | `--motion-fast` (0.2s ease) |

### Adding a new token

New tokens belong in `globals.css` `:root` block, in the correct layer section. Never put them in a component file.

---

## The `!important` Policy

**Floor: 23 legitimate uses.** Do not add new ones without a justification.

✅ **Legitimate uses only:**
- `@media print` overrides
- `@media (prefers-reduced-motion)` accessibility overrides
- `.hidden` utility class
- JS-driven animation state overrides where inline styles aren't possible

❌ **Never do this:**
```css
/* BAD — FIX block added on top of existing rule */
.recipe-panel { padding: 20px !important; }  /* FIX: overrides the 16px set below */
```

✅ **Do this instead — fix the source rule:**
```css
/* GOOD — changed the original rule */
.recipe-panel { padding: 20px; }
```

**If you find a FIX block**, merge it into its source rule in the same session. A FIX block is a debt signal, not a finished solution.

---

## SVG Icon Library

**File:** `src/components/icons.js` — 28 icons, 24×24 viewBox, Lucide paths, zero npm dependency.

```js
import { Icon } from '@/components/icons';
// Static 18px (buttons, nav labels):
{Icon.trash}   {Icon.cart}   {Icon.house}   {Icon.chef}
// Custom size:
import { makeIcon } from '@/components/icons';
const BigHouse = makeIcon(<><path d="m3 9 9-7..."/></>);
<BigHouse size={36} />
```

### Icon usage rules

| Context | What to use |
|---|---|
| Nav, buttons, labels | `Icon.{name}` (18px static) |
| Large decorative icons (type selector cards etc.) | Inline SVG at explicit px, OR `makeIcon()` |
| Toast/success strings | Emoji are fine: `"✓ Saved! 🎉"` |
| WhatsApp share content | Emoji are fine |
| All other UI affordances | `Icon.*` — **never emoji** |

### Why no emoji as icons (LL-046)

- Render differently on every OS/browser (size, shape, colour)
- Cannot be styled with CSS (`color`, `stroke` are ignored)
- Screen readers read the full emoji name ("pot of food") — SVG with `aria-hidden="true"` defers to the button label instead

### Available icons

`menu` · `close` · `globe` · `person` · `book` · `cart` · `house` · `building` · `settings` · `monitor` · `logout` · `trash` · `clipboard` · `file` · `store` · `chef` · `warn` · `plus` · `pencil` · `search` · `flag` · `info` · `check` · `share` · `printer` · `refresh` · `arrowRight` · `plan` · `scan` · `whatsapp` · `switch` · `users` · `crown` · `x`

To add a new icon: add an entry to the `Icon` object in `icons.js` using the `svg()` helper. Paths from [Lucide](https://lucide.dev) (MIT).

---

## Font Loading

**Rule:** All fonts are self-hosted via `next/font` in `src/app/layout.js`. **Never add a Google Fonts `@import` to `globals.css`.**

```
layout.js  →  next/font (Poppins, Nunito)       ← self-hosted, optimal
globals.css → @import (Playfair Display, DM Sans) ← editorial font only; DM Sans legacy compat
```

If you add a new typeface:
1. Add it via `next/font` in `layout.js`
2. Add the CSS variable reference to `:root` `--font-*` tokens
3. Do **not** add an `@import` for fonts already loaded via `next/font` — this causes double-loading and FOUT (LL-045)

---

## Inline Style Decision Tree

```
Is the value dynamic (driven by JS state or props)?
  └─ YES → inline style is correct: style={{ color: isPro ? proAccent : amber }}
  └─ NO ↓

Does this pattern appear 3+ times across 2+ files?
  └─ YES → add a CSS utility class to globals.css
  └─ NO ↓

Is this a truly one-off unique case?
  └─ YES → inline style is acceptable
  └─ NO  → it probably belongs in a CSS class already; search globals.css first
```

### Existing utility classes

| Class | When to use |
|---|---|
| `.pp-overline` | Eyebrow / section label (0.7rem, uppercase, muted, letter-spaced) |
| `.pp-hint` | Helper or hint text below an input (0.75rem, muted, block) |
| `.pp-flex-col` | Vertical form field stack (flex column, gap 16px) |
| `.pp-page-card` | Full interior page container (max 1200px, 20px radius, shadow) |
| `.font-heading` | Apply `--font-brand` (Poppins) to any element |
| `.btn-add` | Primary amber CTA button |
| `.form-control` | Styled form input |

---

## Heading Hierarchy Rules

**One `<h1>` per page.** Headings must nest without skipping levels.

```
page <h1>         — page title
  section <h2>    — major section within the page
    card <h3>     — item/card title inside a section
      <h4>        — rare; sub-item only
```

### Known heading map (confirmed clean after 7e audit)

| Page | h1 | h2 |
|---|---|---|
| Homepage `/` | "Your Library" (or household name) | Filter section |
| Add/Edit `/add` | "Add Recipe" or recipe title | Source Reference, Ingredients, Method, Photos, Visibility |
| Recipe detail `/recipe/[id]` | Recipe title | Notes, Nutrition section labels |
| Shopping `/shopping` | "Market List" | List name headers |
| Household `/household` | "Kitchens" | Create New, Join with Invite Code, Your Kitchens |
| Profile `/profile` | "Your Profile" | (none needed) |

**Conditional h1s are fine** — if only one renders at a time (e.g. login/join/forgot-password pages share a layout but each has its own h1 gated by a conditional render).

**Decorative text must not use heading tags.** Image captions, ingredient labels, mood words → use `<p>` or `<span>`, not `<h3>`.

---

## Utility Classes vs. Component CSS

The file `src/app/themes/pretzelprep.css` is imported **after** `globals.css` in `layout.js`. It defines the M3 tonal palette (1,067 lines). Rules in `pretzelprep.css` win the cascade over `globals.css` rules of equal specificity.

**When to edit which file:**

| File | Edit when... |
|---|---|
| `globals.css` | Adding/modifying component styles, layout, typography, utility classes, or tokens |
| `pretzelprep.css` | Adjusting the colour palette or M3 tonal surface hierarchy |
| Component `style={{}}` | Value is dynamic / JS-driven |

---

## Lessons Learned (Source Entries)

| ID | Lesson |
|---|---|
| LL-044 | `!important` cascade debt compounds — always fix at source, never add a FIX block |
| LL-045 | `next/font` + Google Fonts `@import` causes double-load and FOUT — use one or the other |
| LL-046 | Emoji as UI icons are unstylable, platform-inconsistent, and inaccessible — use Icon.* |
| LL-047 | Escaped quotes `\'` in automated import replacements break the Next.js SWC parser |
| LL-048 | Brand guide drifts from implementation — reference token names not hex values |

---

## Related Files

- `src/app/globals.css` — canonical CSS (single source of truth for tokens + component styles)
- `src/app/themes/pretzelprep.css` — M3 tonal palette (imported after globals; wins cascade)
- `src/components/icons.js` — shared SVG icon library
- `src/app/layout.js` — font loading via `next/font`
- `docs/CSS_ARCHITECTURE.md` — full developer reference (token list, heading map, all classes, decision tree)
- `docs/ADR-018-css-modernization.md` — why these decisions were made
