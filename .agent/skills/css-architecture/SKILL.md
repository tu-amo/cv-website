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
| Primary text | `--color-on-surface` |
| Muted/secondary text | `--color-on-surface-muted` |
| Primary accent (borders, highlights) | `--color-primary` |
| Page heading font | `--font-brand` (Poppins 600) |
| Body / label font | `--font-body` (Nunito) |
| Recipe hero title | `--font-editorial` (Playfair Display) |
| Divider / hairline | `--color-hairline` |
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
| `.pp-section-heading` | **All page h2s** — section heading within a page or form (1.4rem, bold, on-surface) |
| `.pp-flex-col` | Vertical form field stack (flex column, gap 16px) |
| `.pp-page-card` | Full interior page container (max 1200px, 20px radius, shadow) |
| `.font-heading` | Apply `--font-brand` (Poppins) to any non-heading element |
| `.btn-add` | Primary CTA button |
| `.form-control` | Styled form input |

---

## Page Layout Shells

**Every page in the app has exactly one outer wrapper div.** This wrapper provides the card surface, max-width, shadow, and border-radius that make all pages look consistent.

### The three shells

| Shell class | Used on | DOM path |
|---|---|---|
| `.pp-page-card` | **All interior pages** — Profile, Household, Shopping, System, Add/Edit, Tools, any new page | `#app > .pp-page-card` |
| `.view-gallery > .home-wrapper` | **Homepage only** — the hero needs to bleed edge-to-edge inside the card | `#app > .view-gallery > .home-wrapper` |
| `.recipe-detail-wrapper` | **Recipe detail only** — different hero treatment, same visual output | `#app > .view-gallery > .recipe-detail-wrapper` |

### The rule

> **If you are building an interior page, the outermost JSX div must have `className="pp-page-card"`.  
> Do NOT use a custom module class, inline styles, or a plain `<div>` for the page shell.**

```jsx
// ✅ CORRECT — every interior page
export default function MyPage() {
  return (
    <div className="pp-page-card">
      <PageHeader title="Page Title" />
      <h2 className="pp-section-heading">Section</h2>
      ...
    </div>
  );
}

// ❌ WRONG — custom wrapper class
export default function MyPage() {
  return (
    <div className={styles.page}>  {/* No card surface, no shadow, no standard max-width */}
      ...
    </div>
  );
}

// ❌ WRONG — plain div with inline styles
export default function MyPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 40 }}>  {/* Diverges from other pages */}
      ...
    </div>
  );
}
```

### What `pp-page-card` provides (don't re-invent these)

```css
.pp-page-card {
  max-width:     1200px;
  margin:        40px auto;
  background:    var(--color-surface);          /* dark card surface */
  border:        1px solid var(--color-hairline);
  border-radius: 20px;                          /* 16px on mobile */
  box-shadow:    0 20px 40px rgba(0,0,0,0.3);
  padding:       40px;                          /* 24px/20px on mobile */
  box-sizing:    border-box;
}
```

Module CSS may add **internal** layout (flex, grid, gap) inside `.pp-page-card` elements,  
but must not redefine max-width, background, border, border-radius, shadow, or outer margin.

---

## Typography & Spacing Standard

This section is the single source of truth for heading hierarchy, spacing, and colour.
Reference it during page audits and when building new pages.

---

### Heading Scale

| Level | Element | Component / Class | Size | Colour token | Weight |
|---|---|---|---|---|---|
| Page title | `<h1>` | `<PageHeader title="..." />` | 2.2rem | `--color-on-surface` | 700 |
| Section heading | `<h2>` | `className="pp-section-heading"` | 1.4rem | `--color-on-surface` | 700 |
| Sub-section / card title | `<h3>` | `className="font-heading"` | inherits (≈1rem) | `--color-on-surface` | 600 |
| Eyebrow / label | `<p>` or `<span>` | `className="pp-overline"` | 0.7rem | `--color-on-surface-muted` | 700 |

**Important:** Both h1 and h2 use `--color-on-surface` (#EDD09A salt/amber).
Hierarchy is created by **size only** — not by colour.
`--color-primary` (#B0ADDA lavender) is for interactive elements (buttons, borders,
highlights), **not** for headings.

---

### Spacing Rationale (2:1 rule)

```
h1 PageHeader
  ↕  32px  (PageHeader wrapper margin-bottom)
  ↕  40px  (pp-section-heading margin-top)
  ─────────
  ↕  72px total from h1 to first h2   ← ~2× the h1 pixel height (2.2rem ≈ 35px)

h2 Section Heading
  ↕  20px  (pp-section-heading margin-bottom — coupling to its fields)

  [form fields / content]

  ↕  40px  (next pp-section-heading margin-top — section break)
h2 Next Section
```

**2:1 ratio:** 40px above h2 : 20px below h2. More air above creates the section break.
Do not override pp-section-heading margins unless there is a structural reason
(e.g. h2 inside a flex row needs `style={{ margin: 0 }}`; document why).

> **⚠️ Flex-row exception:** When an h2 shares a row with a button (e.g. "Ingredients" + "Standardize to Metric"), the h2 needs `style={{ margin: 0 }}` to stay flush in the flex container. In this case, **move the 40px top gap to the outer container div** instead:
> ```jsx
> {/* ✓ Container carries the section gap */}
> <div className="form-group dynamic-list" style={{ marginTop: '40px' }}>
>   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
>     <h2 className="pp-section-heading" style={{ margin: 0 }}>Ingredients</h2>
>     <button>✨ Standardize to Metric</button>
>   </div>
> </div>
> ```

---

### Component-to-Use Mapping

| What | Use | Never use |
|---|---|---|
| Page title (h1) | `<PageHeader title="..." />` | `<h1 className="font-heading" style={{...}}>` |
| Section heading (h2) | `<h2 className="pp-section-heading">` | `<h2>` with inline font-size/color, `<label>` as section heading |
| Section label (non-heading) | `<p className="pp-overline">` | `<h2 className="pp-overline">` (wrong tag) |
| Form field label | `<label>Field Name</label>` | heading tags |

---

### Form Page Conventions

On form/edit pages, major sections of the form get an `<h2 className="pp-section-heading">`
— **not a `<label>`**. The section heading replaces the top-level label.
Field-level labels (`<label>Book Title</label>`) remain below the h2 for individual inputs.

**Pattern:**
```jsx
<h2 className="pp-section-heading">Source Reference</h2>
<div className="form-row">
  <div className="form-group">
    <label>Book / Website Title</label>     {/* field-level label — stays */}
    <input className="form-control" ... />
  </div>
</div>
```

**Sections must NOT be wrapped in card containers.** No extra `padding`/`background`/`border`
wrapper divs around form sections. The h2 heading creates the visual separation by itself.

---

### Page Audit Checklist

When auditing an existing page or reviewing a new one:

- `[ ]` Outermost JSX div uses `pp-page-card` (interior pages) or the correct shell — **not a custom class or plain div**
- `[ ]` Exactly **one `<h1>`** per page, rendered via `<PageHeader />`
- `[ ]` All major sections use `<h2 className="pp-section-heading">` — no `<label>` as section heading
- `[ ]` No `<h2>` with inline `style={{ fontSize, color, fontWeight }}`
- `[ ]` No `<h2 className="pp-overline">` — overline is for `<p>` or `<span>` only
- `[ ]` No heading tags skip a level (h1 → h3 without h2 is illegal)
- `[ ]` `pp-section-heading` margin not overridden without a comment explaining why
- `[ ]` All heading text uses `--color-on-surface` — not `--color-primary` (lavender) or PP tokens
- `[ ]` No PP tokens (`--pp-salt`, `--pp-primary`, `--pp-font-brand`) in any CSS class definition
- `[ ]` No §B deprecated aliases in any new code (`--color-text-papyrus`, `--color-accent-amber`, etc.)

---

### Known heading map (current — as of Phase 10 standardisation)

| Page | h1 (PageHeader) | h2 (pp-section-heading) |
|---|---|---|
| Homepage `/` | "Your Library" (or household name) | Filter section |
| Add/Edit `/add` | "Edit Recipe" / "Add New Recipe" | Recipe Title · Photos & Visuals · Source Reference · Prep Overview · Visibility · Ingredients · Method Steps |
| Recipe detail `/recipe/[id]` | Recipe title | Ingredients · Method · Kitchen Notes |
| Shopping `/shopping` | "Market List" | List name headers |
| Household `/household` | "Manage Kitchens" | Create New · Join with Invite Code · Your Kitchens |
| Profile `/profile` | "My Profile" | Display Name · Email Address |
| System `/system` | "System Info" | (none) |

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

## CSS Modules — The Forward Strategy

**Rule:** All new components get a `.module.css` file. Existing components stay in `globals.css` until there is a specific reason to migrate them.

### File structure

```
src/components/
  ui/                          ← shared UI primitives (Badge, Alert, etc.)
    Badge.js
    Badge.module.css
    Alert.js
    Alert.module.css
    index.js                   ← barrel export — always import from here
  MyFeatureComponent.js        ← page-specific component
  MyFeatureComponent.module.css
```

### Creating a new component

```bash
# 1. Create the component file
touch src/components/ui/MyComponent.js
touch src/components/ui/MyComponent.module.css

# 2. Export from the barrel
# Add to src/components/ui/index.js:
export { MyComponent } from './MyComponent';
```

### Writing styles in a module

```css
/* MyComponent.module.css */
/* Tokens from globals.css :root still work — they are global */

.wrapper {
  background: var(--color-surface);        /* ✓ canonical §A token */
  border-radius: var(--radius-md);          /* ✓ canonical §A token */
  padding: 20px;
}

.title {
  font-family: var(--font-brand);           /* ✓ canonical §A token */
  color: var(--color-on-surface);           /* ✓ NOT --color-text-papyrus (legacy §B) */
}
```

> **Token rule for CSS Modules:** Only use §A canonical tokens inside `.module.css` files.
> **Never use §B deprecated aliases** (`--color-text-papyrus`, `--color-text-muted`,
> `--color-accent-amber`, `--color-divider`). These exist only for backward compat
> with old page code. New module files must be clean.
>
> | Deprecated (§B — DO NOT USE) | Canonical replacement (§A — use this) |
> |---|---|
> | `--color-text-papyrus` | `--color-on-surface` |
> | `--color-text-muted` | `--color-on-surface-muted` |
> | `--color-accent-amber` | `--color-primary` |
> | `--color-divider` | `--color-hairline` |
> | `--color-accent-amber-glow` | `--color-primary-glow` |

### Importing and using

```jsx
import styles from './MyComponent.module.css';

export function MyComponent({ active }) {
  return (
    <div className={`${styles.wrapper} ${active ? styles.active : ''}`}>
      <h2 className={styles.title}>...</h2>
    </div>
  );
}
```

### Importing from the barrel (consuming code)

```jsx
// ✓ Correct — always import from the barrel index
import { Badge, RoleBadge, Alert } from '@/components/ui';

// ✗ Avoid — direct file import bypasses the barrel
import { Badge } from '@/components/ui/Badge';
```

### Using global classes inside a module (the :global() escape hatch)

Needed when you want to apply a `globals.css` utility class inside a module:

```css
/* Rare — only when you genuinely need a global class inside a module */
.wrapper :global(.pp-overline) {
  margin-bottom: 8px;
}
```

### What stays in globals.css — never in a module

| Stays global | Why |
|---|---|
| `:root` token definitions | Must be accessible everywhere |
| `@keyframes` animations | Must be referenceable by name |
| `body`, `*`, base resets | Must apply before any component renders |
| `.hidden`, `.pp-overline`, `.pp-hint`, `.pp-flex-col` | Utility classes used across many components |
| `@media print`, `@media (prefers-reduced-motion)` | Must override any component style |
| `.pp-page-card`, `.btn-add`, `.form-control` | Structural layout classes used site-wide |

### Available UI components (src/components/ui/)

| Component | Exports | Replaces |
|---|---|---|
| `Badge` | `Badge`, `RoleBadge`, `GroupTypeBadge` | Inline role colours + group type pills |
| `Alert` | `Alert` | Repeated inline error/success div pattern |
| `PageHeader` | `PageHeader` | Per-page h1 with overline, subtitle, actions slot |

### Migration priority for existing pages

Do **not** migrate existing pages unless you are actively editing them. When you DO edit a page, opportunistically replace:

```jsx
// Before (inline — replace when you touch this page)
{error && (
  <div style={{ color: "#ff6b6b", background: "rgba(255,107,107,0.1)",
    padding: "15px", borderRadius: "12px", marginBottom: "24px" }}>
    {error}
  </div>
)}

// After (module component)
import { Alert } from '@/components/ui';
{error && <Alert variant="error">{error}</Alert>}
```

```jsx
// Before (inline role badge)
<span style={{ color: m.role === "owner" ? "var(--color-primary)" : "var(--color-on-surface-muted)" }}>
  {m.role === "owner" ? Icon.crown : Icon.users}
</span>

// After (module component)
import { RoleBadge } from '@/components/ui';
<RoleBadge role={m.role} />
```


| ID | Lesson |
|---|---|
| LL-044 | `!important` cascade debt compounds — always fix at source, never add a FIX block |
| LL-045 | `next/font` + Google Fonts `@import` causes double-load and FOUT — use one or the other |
| LL-046 | Emoji as UI icons are unstylable, platform-inconsistent, and inaccessible — use Icon.* |
| LL-047 | Escaped quotes `\'` in automated import replacements break the Next.js SWC parser |
| LL-048 | Brand guide drifts from implementation — reference token names not hex values |
| LL-049 | New pages built with custom wrapper classes diverge from the card-surface standard — always use `pp-page-card` as the outermost div on interior pages |
| LL-050 | Functional data colours elevate dark themes. Reserve Amber/Primary for monospace values (Git SHAs, Codes), muted Greens for Success/Production, and pastel Blues for Previews. Keep headings uncoloured. |

---

## Related Files

- `src/app/globals.css` — canonical CSS (single source of truth for tokens + component styles)
- `src/app/themes/pretzelprep.css` — M3 tonal palette (imported after globals; wins cascade)
- `src/components/icons.js` — shared SVG icon library
- `src/app/layout.js` — font loading via `next/font`
- `docs/CSS_ARCHITECTURE.md` — full developer reference (token list, heading map, all classes, decision tree)
- `docs/ADR-018-css-modernization.md` — why these decisions were made
