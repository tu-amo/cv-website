# 🎬 Google Flow Prompt Guide — The Living Cookbook
**Last Updated:** 2026-03-30  
**Companion doc:** [BRAND_GUIDE.md](./BRAND_GUIDE.md)

---

## What is Flow?

Google Flow (labs.google/flow) is an AI image and video generation tool powered by Imagen and Veo. It takes natural-language prompts and produces photorealistic images or short video clips.

For The Living Cookbook, Flow is used to:
- Generate hero images for recipe detail pages
- Create email header visuals
- Produce social media assets
- Build a branded image library over time

---

## How to Start a Flow Session

1. Visit [labs.google/flow](https://labs.google/flow)
2. Sign in with your Google account
3. Paste the **Brand Brief** below as your first prompt or system context
4. Then add your specific subject/scene prompt on top

---

## The Living Cookbook Brand Brief
*Paste this at the start of every new Flow canvas or session.*

```
BRAND BRIEF — The Living Cookbook

VISUAL STYLE: Magical Modern Kitchen Editorial
LIGHTING: Rembrandt-style chiaroscuro. One warm, directional light source 
  (candle, single pendant lamp, or side window). Deep warm shadows, 
  high contrast between lit and dark areas.
BACKGROUND TONE: Deep forest green, almost black — like aged cast iron or 
  a very dark olive (#1a2421).
COLOUR PALETTE:
  - Warm refined cream (like bone ivory or smooth parchment)
  - Old antique gold (saffron, burnished brass, amber)
  - Deep olive, polished slate, and architectural stone grey
  - Burnt ochre and refined metal accents
MOOD: Cinematic, intimate, geometric home cooking. Modernist soul.
  Professional culinary journal quality.
COMPOSITION: Mostly overhead flat-lay OR shallow-depth-of-field close-up. 
  Precise, balanced, artfully arranged geometric compositions.
PROPS: Refined bowls, plates, sculptural ceramics, polished slate or stone plates, 
  refined crystal, hand-blown glass, smooth pressed linen, honed wood boards, 
  polished silver or copper accents. (Avoid the term "vessel").
TEXTURES: Pressed linen, polished slate, architectural stone, flawless ceramic, 
  smooth wood grain, hand-blown glass, reflective silver and copper.
FOOD QUALITIES: Geometric and artfully arranged plating, glistening oil sheen, dewy fresh herbs, 
  vivid raw ingredient colour — food should look alive and precise.
  Capture ingredient form: sliced, crushed, or flaked as per notes.
AVOID: Bright white studio light, neon colours, weathered/distressed look,
  wrinkled linens, generic stock photo look, chaotic cluttered surfaces.
TECHNICAL: 
  - Aspect ratio specified per use case (see templates below)
  - Photorealistic, not illustrated
  - No text in the image unless specified
```

---

## Prompt Templates by Use Case

### 1. Email Hero Banner
**Dimensions:** 600 × 240px (landscape, 5:2 ratio in Flow)

```
[BRAND BRIEF ABOVE] +

A cinematic overhead flat-lay of a beautifully set kitchen scene for a 
welcome email header. [SPECIFIC SCENE]. Warm amber candlelight raking 
across pressed linen and polished stone. Deep olive and shadow tones dominate 
with cream and gold accents. Modern editorial food photography. No text. 
Photorealistic. 5:2 landscape crop.
```

**Example scenes to slot in:**
- `A modern open cookbook with a sprig of dewy rosemary, a polished silver spoon, and a sculptural crystal bowl of honey`
- `Fresh bread on a smooth pressed linen cloth, beside a hand-blown glass carafe and scattered herbs`
- `A dark architectural slate kitchen counter with steaming tea in a refined copper-rimmed cup, morning light`

---

### 2. Recipe Hero Image (Portrait — in-app)
**Dimensions:** 3:4 portrait (for phone upload compatibility)

```
[BRAND BRIEF ABOVE] +

A dramatic close-up portrait-format food photograph of [DISH NAME]. 
[DESCRIBE KEY INGREDIENTS AND TEXTURE]. Single warm side light, 
deep shadowed background, steam rising gently. Served on sculptural 
ceramics, polished slate, or hand-blown glass. 
Architectural stone surfaces with polished silver or copper accents. 
3:4 portrait. Photorealistic editorial food photography.
```

---

### 3. Mise en Place (Ingredients flat-lay)
**Dimensions:** 1:1 or 4:3

```
[BRAND BRIEF ABOVE] +

An overhead flat-lay of ingredients for [RECIPE NAME]: [LIST INGREDIENTS]. 
Arranged artfully on pressed linen and polished slate. Warm Rembrandt light 
from the upper left. Sculptural bowls, architectural copper spoons. 
Deep dark stone background. 1:1 or 4:3 ratio. Photorealistic.
```

---

### 4. Application Screenshot Background / Texture
**Dimensions:** 16:9

```
[BRAND BRIEF ABOVE] +

An abstract dark kitchen surface texture. Polished absolute black granite, 
subtle stone grain, warm candlelight catching the edge of a 
minimalist counter. Very low detail — meant as a subtle UI background. 
16:9 landscape. No food, no props — pure texture and mood.
```

---

## Welcome Email Hero — First Image Brief

Use this for the confirmation email header:

```
[BRAND BRIEF ABOVE] +

A warm, intimate email-width hero image (5:2 landscape) showing:
A modern open cookbook resting on pressed linen, beside a 
sculptural crystal bowl with a refined silver-rimmed spoon. A single candle or warm 
pendant lamp casts amber light from the left. Glistening oils suggest warmth. 
Deep olive-green and near-black background. Cream and polished metal accents. 
The image should feel like a welcome — a refined kitchen you are being 
invited into for the first time. No text. No people. 
Photorealistic architectural food styling.
```

---

## Flow Settings Reference

| Setting | Recommended for LC |
|---------|-------------------|
| Model | Imagen 3 (for stills) / Veo 3 (for video) |
| Style | Photorealistic |
| Aspect Ratio | See per-template above |
| Seed | Save seed numbers when you get a result you like — reuse for consistency |
| Negative prompt | bright white light, neon, cluttered, weathered/rustic, wrinkled linen, stock look |

---

## Saving and Reusing Seeds

When Flow generates an image you love, **save the seed number** shown in the output. Add it here for reproducibility:

| Asset | Seed | Notes |
|-------|------|-------|
| *(none yet)* | — | — |

---

## Output Storage

Generated images for the Living Cookbook should be saved to:
```
/Users/janescott/Projects/Anti/living-cookbook/public/brand/
```
