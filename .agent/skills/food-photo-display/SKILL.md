---
name: food-photo-display
description: Strategy for displaying food photography in web apps — covering aspect ratios, object-fit choices, thumbnail carousels, and the Contain vs Cover tradeoff. Use when building or debugging image display for recipe galleries, product grids, or editorial food layouts.
---

# Food Photo Display Strategy

## Core Challenge

Food photography from phones is almost always **portrait** (e.g. 3000×4000). Recipe UI grids are almost always **landscape or square**. These two shapes conflict — and the wrong CSS choice destroys the composition of the photo.

---

## The Cover vs. Contain Decision

| Mode | Effect | Use When |
|---|---|---|
| `object-fit: cover` | Fills container, crops excess | Subject is in the center, crop is acceptable |
| `object-fit: contain` | Shrinks to fit inside container, shows bars | Full dish must be visible; composition is the value |

**Rule of thumb for food photography:** Default to `contain`. The chef's plating *is* the content — cropping it is unacceptable.

---

## Gallery Thumbnail Strategy

When displaying recipe thumbnails in a grid:

1. **Use `object-fit: contain`** on the image tag
2. **Set a themed background color** on the container to fill the "bars" (e.g. `background-color: var(--color-bg-deep-olive)`)
3. **Disable Ken Burns animation** for card-level thumbnails — motion on tiny cards is distracting and hides the dish
4. **Keep Ken Burns for hero/full-screen views** — cinematic motion works at scale

```css
/* Gallery cards — static, full-frame */
.carousel-container.card .ken-burns {
    animation: none !important;
    object-fit: contain !important;
    object-position: center center !important;
}

/* Hero detail — cinematic motion retained */
.carousel-container.hero .carousel-slide.active .ken-burns {
    animation: kenBurnsAnimation 10s linear infinite;
    object-fit: contain !important;
}
```

---

## Carousel Speed

- **Gallery cards**: 2.5s interval (keeps energy, fast enough to see both prep + dish)
- **Hero detail**: 5s interval (relaxed reading pace, cinematic feel)

---

## CSS Specificity Warning

If a `object-fit: cover` rule persists despite CSS changes, fall back to **inline styles** on the image tag. CSS `!important` is sometimes insufficient due to animation-class specificity. Inline styles are the nuclear option:

```jsx
<SecureImage
    style={{ objectFit: 'contain', width: '100%', height: '100%' }}
    className={type === 'hero' ? 'ken-burns' : ''}
/>
```

---

## Known Open Problem: Adaptive Framing

`contain` solves the cropping problem but introduces "bars" (like letterboxing). Future research areas:

- **Focal point detection**: Use AI to find the dish center, then crop to a smart region
- **Blurred background clone**: Render a blurred/downscaled version of the image as the container background, filling bars without losing subject context
- **Generative fill**: AI-extend the image to fill aspect ratio gaps (experimental)

**Status:** Deferred. Current `contain` approach is acceptable for MVP. Revisit when image quality becomes a product differentiator.

---

## Related Files

- `src/components/ImageCarousel.js` — Carousel logic, interval speed, image rendering
- `src/components/SecureImage.js` — Supabase signed URL resolution
- `src/app/globals.css` — Ken Burns animation, `.carousel-container` styles
