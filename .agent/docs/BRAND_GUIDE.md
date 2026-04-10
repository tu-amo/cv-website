# 🎨 Brand Guide — The Living Cookbook
**Version:** 1.1  
**Last Updated:** 2026-04-11  
**Status:** Updated after CSS Modernization (Phases 1–7). Token names and hex values reflect the current M3 design system.

---

## Brand Soul

> *"A magical modern kitchen where heritage recipes meet cinematic light."*

The Living Cookbook lives at the intersection of elevated home cooking, cultural heritage, and architectural drama. It is not a utility app — it is a personal culinary archive. The aesthetic should always feel **refined, intimate, and cinematic**, as if every recipe page belongs in a luxury modern cookbook.

**Emotional Keywords:** Intimate · Refined · Architectural · Elevated · Soulful · Modernist · Precise

---

## Colour Palette

> Token values are the canonical reference — always use CSS tokens in code, never hardcoded hex values.
> Full token system documented in [`docs/CSS_ARCHITECTURE.md`](../../living-cookbook/docs/CSS_ARCHITECTURE.md).

| Role | Name | Hex | CSS Token | Natural Language (for AI) |
|------|------|-----|-----------|--------------------------|
| Background | Deep Charcoal | `#121010` | `--color-bg` | "deep near-black charcoal, almost pitch dark" |
| Surface | Dark Neutral | `#1E1B1B` | `--color-surface` | "dark warm neutral, like blackened cast iron" |
| Surface Hover | Lifted Surface | `#2A2727` | `--color-surface-container` | "slightly lighter neutral, like brushed graphite" |
| Text Primary | Weathered Papyrus | `#ebdcb2` | `--color-text-papyrus` | "warm cream, like aged parchment or bone ivory" |
| Text Muted | Faded Papyrus | `rgba(235,220,178,0.6)` | `--color-text-muted` | "pale gold-cream, translucent, ghosted" |
| Accent | Brand Primary | `#B0ADDA` (M3) | `--color-accent-amber` / `--color-primary` | "soft indigo-lavender, like candlelit silver" |
| Glow | Primary Glow | `rgba(176,173,218,0.25)` | `--color-accent-amber-glow` | "soft lavender haze, ghosted" |

> **Note:** The visual accent in inline interactive elements (Pro Kitchen pro badge, amber hover borders) uses `#f59e0b` (warm amber) via JS variables. The M3 primary token resolves to indigo/lavender. These exist in parallel and will be unified in a future token pass.

---

## Typography

| Role | Typeface | Weight | Feel |
|------|----------|--------|------|
| Page headings, nav, CTAs | **Poppins** | 600 | Clean modern editorial, geometric precision |
| Body, labels, captions | **Nunito** | 400–700 | Warm, readable, approachable |
| Recipe hero title only | **Playfair Display** | 400–900, italic | Heritage editorial, cookbook chapter headers |

> **Font loading:** All three are self-hosted via `next/font` in `src/app/layout.js`. **Do NOT add a Google Fonts CDN `@import`** — this was the source of a double-load bug fixed in Phase 1 of the CSS modernization. DM Sans (listed in v1.0 of this guide) was never implemented and has been removed.

**Tone of Voice:** Warm and authoritative. Uses poetic language without being pretentious. Addresses users as fellow cooks ("your kitchen", "your library"), not as app users.

**Vocabulary Examples:**
- "Welcome Home" not "Sign In"
- "Claim your Apron" not "Register"  
- "Check your inbox" with warmth, not anxiety
- "Your kitchen is ready" not "Account created"

---

## Visual Aesthetic

### Photography & Imagery Style
**Name:** Magical Modern Kitchen Editorial

| Element | Direction |
|---------|-----------|
| **Lighting** | Rembrandt-style chiaroscuro — one warm source (candle, window, pendant lamp), deep shadows, high contrast |
| **Mood** | Cinematic, intimate, modernist. Like a high-end editorial still from a contemporary culinary journal |
| **Perspective** | Mostly overhead flat-lay or shallow-depth close-up. Precise, balanced compositions |
| **Colour Grading** | Warm shadows, neutral highlights. Deep olives, golds, and slate dominate |
| **Plating** | Geometric, precise, artfully arranged compositions. Modernist soul |
| **Props** | Sculptural ceramics, refined crystal, hand-blown glass, polished slate, architectural stone, smooth pressed linens, honed wood, high-end silver or copper utensils. **Avoid: "vessels". Use "bowls", "plates", or "glass".** |
| **Texture** | Refined materials — pressed linen, polished slate, architectural stone, smooth wood, flawless ceramic, hand-blown glass, reflective metals |
| **Steam & Life** | Subtle steam wisps, glistening oils, dewy fresh herbs — the food should look alive and vibrant |

### What to Avoid
- ❌ Bright white studio lighting (clinical, cold)
- ❌ Highly saturated colors (Instagram-filter look)
- ❌ Distressed or heavily weathered textures (too rustic)
- ❌ Wrinkled linens or chipped ceramics
- ❌ Generic stock photo food (no branded chain-restaurant shots)
- ❌ Chaotic, cluttered surfaces
- ❌ Neon or synthetic colors

---

## Iconography & UI Components

| Element | Style |
|---------|-------|
| Icons | Inline SVG, 24×24 viewBox, `stroke="currentColor"`, `stroke-width: 2`, rounded linecap/join |
| Icon library | **`src/components/icons.js`** — 28 icons (Lucide paths, zero npm dependency). Import: `import { Icon } from '@/components/icons'`. See CSS_ARCHITECTURE.md §4 for full list. |
| Icon sizing | Default 18px (inline `Icon.name`); custom size via `makeIcon()` factory |
| **Never use emoji as UI icons** | All affordance icons must use `Icon.*`. Emoji are permitted only in: toast strings, WhatsApp share text, and the 🥨 brand mark. |
| Buttons | Pill-shaped or rounded-rect, amber-on-dark primary style |
| Cards | Glassmorphism — dark frosted glass, amber border accent |
| Animations | Subtle: 0.5s ease transitions, Ken Burns on images |
| Corner Radius | 12–24px range (generous rounding) |

---

## Google Flow & AI Image Prompt System

See → [`.agent/docs/FLOW_PROMPT_GUIDE.md`](.agent/docs/FLOW_PROMPT_GUIDE.md) for the full prompt library.

### Quick Brand Brief (paste this at the start of every Flow session)

```
BRAND: The Living Cookbook
STYLE: Magical Modern Kitchen Editorial
LIGHTING: Rembrandt chiaroscuro — single warm source, deep shadows, high contrast
BACKGROUND: Deep forest green (#1a2421), almost black
PALETTE: Warm cream (refined), old gold (saffron brass), deep olive greens, polished slate
MOOD: Cinematic, intimate, architectural home cooking. Professional culinary journal feel.
PROPS: Sculptural ceramics, polished stone, smooth pressed linen, honed wood, copper accents
TEXTURES: Refined pressed linens, smooth stone surfaces, flawless ceramic, polished wood
FOOD: Architectural plating, glistening oils, dewy fresh herbs, subtle steam
AVOID: Weathered/rustic look, wrinkled linens, cluttered surfaces, neon colors, bright studio light
```

---

## Email Visual Standards

| Asset | Dimensions | Key Rules |
|-------|------------|-----------|
| Email hero banner | 600 × 240px | Dark palette, single warm light source, legible over dark |
| Email icon/mark | 80 × 80px | Amber gold on deep olive |

---

## Brand Evolution Notes

This is a **seed brand guide** — extracted from the existing codebase aesthetics. As the brand matures, add:
- [ ] Logo / wordmark
- [ ] Brand photography library  
- [ ] Social media templates
- [ ] Illustration style guide
- [ ] Motion and animation principles
