# Living Cookbook — CSS Architecture & Styling Guide

> **Audience:** Any developer (including new joiners) working on the Living Cookbook frontend.
> **Last updated:** 2026-04-11 · Based on CSS Modernization Phase 1–7

---

## Quick-Start for New Developers

The three files that govern all styling:

| File | Purpose |
|---|---|
| `src/app/globals.css` | Single source of truth — all tokens, all component classes |
| `src/components/icons.js` | All inline SVG icons — `Icon.cart`, `Icon.trash`, etc. |
| `src/app/layout.js` | Font loading (Google Fonts — Poppins, Playfair Display) |

**The cardinal rule:** Style with `className` using classes from `globals.css`. Avoid `style={{}}` unless the value is dynamic (JS-driven) or unique to one element.

---

## 1. Design Token System (M3-inspired)

All colours, typography, spacing, and radii are defined as CSS custom properties on `:root` in `globals.css`. The hierarchy has two layers:

### Layer 1 — Semantic role tokens (use these in JSX)

```css
/* Surfaces */
var(--color-bg)             /* Page background */
var(--color-surface)        /* Card/panel background */
var(--color-footer)         /* Footer / toast background */

/* Text */
var(--color-text-papyrus)   /* Primary body text */
var(--color-text-muted)     /* Secondary / caption text */
var(--color-on-surface)     /* Text on surface cards */

/* Accent */
var(--color-accent-amber)       /* Primary brand amber — CTA, links, highlights */
var(--color-accent-amber-glow)  /* Amber at low opacity — badge backgrounds */
var(--color-accent)             /* Teal/green accent — checkbox, active states */

/* Borders */
var(--color-divider)        /* Subtle rule / separator */
```

### Layer 2 — M3 component tokens (set by primitives, consumed by Layer 1)

These live in the `:root` block as `--md-sys-color-*` or `--pp-*` prefixed tokens. Do not use them directly in JSX — they feed into Layer 1.

### DO NOT use hardcoded colour values in JSX

```jsx
// ❌ Wrong
<span style={{ color: '#f59e0b' }}>

// ✅ Correct
<span style={{ color: 'var(--color-accent-amber)' }}>

// ✅ Even better — use a class
<span className="pp-overline">
```

---

## 2. Typography Scale

| Element | Class / Tag | Size | Use case |
|---|---|---|---|
| Page title | `<h1 className="font-heading">` | 3–3.5rem (page-specific inline) | One per page |
| Section heading | `<h2 className="section-title">` | 2rem | Major content sections |
| Sub-section | `<h2 className="pp-overline">` | 0.7rem uppercase | Form section labels, eyebrow text |
| Body / labels | `<p>`, `<span>` | 1rem (body default) | Paragraph text, form labels |
| Caption / hint | `<span className="pp-hint">` | 0.75rem | Helper text under inputs |

### Heading hierarchy rules (see Phase 7e audit)

- **One `<h1>` per page.** Conditional renders (login states, join invitation states) are OK — only one renders at a time.
- **Never skip levels.** `<h1>` → `<h3>` without `<h2>` is invalid.
- **Decorative text is not a heading.** Carousel captions and image titles → use `<p className="font-heading">`.
- **Form section labels** → use `<h2 className="pp-overline">` (maintains document structure, styled as label).

### Font families

```css
var(--font-heading)   /* Playfair Display — page/section headings */
var(--font-body)      /* Poppins — all body copy, labels, buttons */
```

### Pages and their heading structure

| Page | h1 | h2 | h3 |
|---|---|---|---|
| `/` (Gallery) | Dynamic title | Empty state, kitchen hint | — |
| `/recipe/[id]` | Recipe title | Ingredients, Method | Nutrition |
| `/add` | Add/Edit Recipe | Photos (ImageManager), Source Reference | — |
| `/shopping` | Market List | Empty state message | — |
| `/household` | Kitchens | Create New, Join, Your Kitchens | Kitchen name |
| `/kitchen/plans/[id]` | Recipe title | Ingredient Stock Check | — |
| `/profile` | My Profile | Display Name, Email Address | — |
| `/login` | Conditional (one at a time) | — | — |

---

## 3. Component Classes

Core layout and component classes are defined in block sections within `globals.css`. Use these before reaching for inline styles:

### Page layout

```css
.pp-page-card      /* Full-page content wrapper with max-width + padding */
.view-gallery      /* Recipe grid gallery layout */
.form-container    /* Centered form wrapper */
```

### Buttons

```css
.btn-add-recipe    /* Primary amber CTA button */
.btn-scan          /* Secondary action / ghost button */
.btn-add           /* Small inline add button (forms) */
.action-btn        /* Minimal icon-adjacent action */
```

### Recipe detail

```css
.recipe-detail-wrapper   /* Two-column recipe layout */
.section-title           /* Recipe section heading (Ingredients / Method) */
.section-title--ingredients
.section-title--method
.ingredients-list        /* Semantic ul for ingredient rows */
.ingredient-item         /* Individual ingredient <li> */
```

### Utility classes

```css
.font-heading      /* Apply Playfair + weight + line-height */
.pp-overline       /* 0.7rem uppercase muted label */
.pp-hint           /* 0.75rem block caption text */
.pp-flex-col       /* flex column gap:16px vertical stack */
```

### Empty states

```css
.empty-state       /* Centred empty state container */
.empty-state-icon  /* Large icon display area */
.empty-state-title /* Heading inside empty state */
.empty-state-text  /* Body copy inside empty state */
```

---

## 4. Icon System

All UI icons live in `src/components/icons.js`. Import and use:

```jsx
import { Icon } from '@/components/icons';

// In JSX (renders an inline SVG):
{Icon.cart}       // shopping cart
{Icon.trash}      // delete / clear
{Icon.clipboard}  // copy to clipboard
{Icon.house}      // household / home
{Icon.warn}       // warning / alert
```

### All available icons

| Key | Visual | Use case |
|---|---|---|
| `menu` | ☰ | Navigation drawer toggle |
| `x` | ✕ | Close / dismiss / delete item |
| `home` | 🏠 | Home navigation |
| `house` | 🏠 | Household/personal context |
| `users` | 👥 | Group / household |
| `chef` | 👨‍🍳 | Pro kitchen context |
| `book` | 📖 | Recipe library |
| `cart` | 🛒 | Shopping list |
| `store` | 🏪 | Supplier |
| `plan` | 📅 | Production plan |
| `clipboard` | 📋 | Copy action |
| `file` | 📄 | PDF / document |
| `trash` | 🗑 | Delete / clear |
| `pencil` | ✏️ | Edit |
| `plus` | ➕ | Add / create |
| `search` | 🔍 | Search |
| `flag` | 🚩 | Flag / report |
| `warn` | ⚠️ | Warning |
| `info` | ℹ️ | Info tooltip |
| `check` | ✓ | Confirmation |
| `globe` | 🌍 | Public / global |
| `settings` | ⚙️ | Settings / private |
| `whatsapp` | 💬 | WhatsApp share |
| `switch` | ⇄ | Move between lists |
| `share` | ↗ | General share |
| `close` | ✕ | Modal close |

### Icon design rules
- All icons are `24×24` viewBox, `stroke="currentColor"`, `fill="none"`, `aria-hidden="true"`
- Size is controlled by the parent `font-size` or an explicit `width`/`height` on a wrapper
- Never use emoji as UI icons — use `Icon.*` instead
- For interactive elements that use only an icon (no text), add a `title` attribute or `aria-label` on the button

---

## 5. The !important Rule

After the Phase 4 CSS cascade cleanup, `!important` is reduced from 360 → 23 uses. The **only** legitimate cases are:

| Category | Example | Why |
|---|---|---|
| Print media | `@media print { .no-print { display: none !important; } }` | Prevents page elements from printing |
| Accessibility | `.visually-hidden { position: absolute !important; }` | SR-only elements must not reflow layout |
| JS inline overrides | Login panel gradient overriding JSX inline style | CSS cannot beat inline without !important |
| Third-party resets | Overriding injected library styles | When you truly can't modify the source |

**If you feel the urge to add `!important`, stop.** The cascade can always be fixed properly — add specificity, fix source order, or move the rule. Using `!important` is a sign of a cascade conflict that needs architectural resolution.

---

## 6. When to Use Inline Style vs className

| Scenario | Use |
|---|---|
| Value comes from JS state (`on ? 'amber' : 'grey'`) | `style={{}}` |
| Value is a one-off for that specific element | `style={{}}` |
| Same style block appears 3+ times across 2+ files | Extract to `className` |
| Token reference with no dynamic parts | `className` |
| Dynamic numeric calculation (`left: offset + 'px'`) | `style={{}}` |
| Layout that matches an existing utility class | `className` |

---

## 7. Adding New Styles — Decision Tree

```
Need to add a style?
    │
    ├─ Does an existing class cover it? ──YES──► Use that class
    │
    ├─ Is the value dynamic (JS state/calculation)? ──YES──► Use style={{}}
    │
    ├─ Is this the 3rd+ time you're writing this pattern?
    │       ──YES──► Add a utility class to globals.css (utility section)
    │                List it in this document
    │
    └─ Otherwise ──► Use style={{}} and leave a comment explaining why
```

---

## 8. Known Architectural Lessons (Phase 7d)

These are patterns discovered during the CSS modernization. They are committed as decisions to avoid repeating the same mistakes.

### L1 — Cascade over !important
**Problem:** Legacy code used `!important` to brute-force overrides, creating an arms-race. Any subsequent override also needed `!important`.
**Decision:** Resolve conflicts through specificity and source order. `!important` is reserved for the 4 categories in §5.

### L2 — Tokens over hardcoded values
**Problem:** Raw hex values like `#C7A96A` and `rgba(235,220,178,0.1)` scattered across 100+ rules made colour changes require a global search-and-replace.
**Decision:** All colour primitives are defined once in `:root`. Component rules consume tokens. A single design change requires one line in globals.css.

### L3 — Shared icon library over per-file SVG definitions
**Problem:** PretzelNav had 89 lines of local SVG icon definitions. Any new file needing the same icon would copy-paste, leading to drift.
**Decision:** `src/components/icons.js` is the single source for all SVG icons. No inline SVG definitions in component files.

### L4 — Emoji are not UI icons
**Problem:** Using emoji for UI affordance (🗑, 📋, 🛒) creates inconsistency across operating systems (emoji rendering differs), fails on screen readers, and can't be styled.
**Decision:** Replace UI emoji with `Icon.*` SVG icons. Emoji remain acceptable in: user-generated content, WhatsApp share strings, toast message personality (low-risk), and the 🥨 brand mark.

### L5 — Inline styles for dynamic values only
**Problem:** Repeated inline style blocks like `{ fontSize: "0.7rem", textTransform: "uppercase" }` copied across 8 files. A design change required 8 edits.
**Decision:** Extract patterns appearing 3+ times across 2+ files to CSS utility classes. Leave contextual/dynamic styles inline.

### L6 — One h1 per rendered page
**Problem:** Heading levels were assigned visually (big = h1, medium = h2) rather than semantically, creating h1→h3 skips.
**Decision:** Document hierarchy follows WCAG heading rules. Form section labels use `<h2 className="pp-overline">`. Decorative display text uses `<p className="font-heading">`. See §2 for the full heading map.

### L7 — CSS source order defines the cascade
**Problem:** Component styles were scattered without predictable ordering. `globals.css` grew to 5,000+ lines with duplicate rules.
**Decision:** globals.css follows strict top-to-bottom ordering: tokens → resets → typography → layout → components → recipe-specific → nav → utilities → responsive. New rules go in the correct section.

---

## 9. File Structure Reference

```
src/
├── app/
│   ├── globals.css          ← SINGLE SOURCE OF TRUTH for all styles
│   ├── layout.js            ← Font loading + root HTML wrapper
│   ├── page.js              ← Gallery (home) page
│   ├── add/page.js          ← Add/edit recipe form
│   ├── recipe/[id]/page.js  ← Recipe detail
│   ├── shopping/page.js     ← Shopping list + supplier orders
│   ├── household/page.js    ← Household management
│   └── kitchen/...          ← Pro kitchen + production plans
│
├── components/
│   ├── icons.js             ← ALL inline SVG icons
│   ├── PretzelNav.js        ← Top app bar + nav drawer
│   ├── RecipeCard.js        ← Recipe grid card
│   ├── RecipeHeader.js      ← Recipe detail hero section
│   ├── NutritionPanel.js    ← Nutritional info table
│   ├── ImageManager.js      ← Photo management in forms
│   └── ImageCarousel.js     ← Photo slideshow component
│
└── lib/
    ├── recipe-utils.js      ← Ingredient parsing, scaling, shopping
    ├── HouseholdContext.js  ← React context for active kitchen
    └── supabase/            ← Supabase client setup
```

---

## 10. Quick Reference Commands

```bash
# Count !important declarations (target: ≤ 23)
grep -c "!important" src/app/globals.css

# Find any new inline styles added (check for patterns to extract)
grep -rn "style={{" src/ --include="*.js" | grep -v "api/\|lib/" | wc -l

# Check heading hierarchy across all pages
grep -rn "<h[1-6]" src/ --include="*.js" | grep -v "api/\|lib/"

# Find emoji in JSX (should only be in toast strings and brand text)
grep -rn --include="*.js" "[🍳🔪🛒🏠📖✅❌⚠️🔍]" src/ | grep -v "api/\|toast\|WhatsApp"
```
