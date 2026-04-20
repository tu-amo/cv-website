---
description: How to verify the Image Carousel and AI Image Generation feature end-to-end after implementation.
---

# Carousel & Image Feature Verification Workflow
**Last Reviewed:** 2026-04-20

This workflow validates all layers of the carousel and AI image system: logic, data, prompts, performance, and visual behaviour.

> 📋 For the full **human visual testing guide** (with DevTools tips, mobile simulation, and sign-off checklist), see:
> `carousel_visual_test_guide.md` in the artifacts directory.

// turbo-all

## Step 1: Run the Carousel Logic unit tests

Create and run the carousel logic test:

```bash
node /tmp/test_carousel_logic.js
```

Expected: All carousel index, looping, and auto-advance logic tests pass ✅

---

## Step 2: Validate Supabase image schema

Check that the `images` column exists and can be written to:

```bash
node /tmp/test_carousel_db.js
```

Expected: Recipes table has `images TEXT[]` column, test write succeeds ✅

---

## Step 3: Validate AI prompt template builder

Check that ingredient substitution in AI prompts works correctly:

```bash
node /tmp/test_carousel_prompts.js
```

Expected: Prep and Hero prompt strings contain the correct recipe title and ingredient names ✅

---

## Step 4: Validate image compression

Check that uploads are correctly resized and compressed below 300KB:

```bash
node /tmp/test_carousel_compression.js
```

Expected: All test images compress to < 300KB at 1200px wide ✅

---

## Step 5: Manual Visual Checklist (Browser)

Open the local server at http://localhost:3000 and verify the following:

### Library Page (`/`)
- [ ] Recipe cards show an image
- [ ] Hovering a card on desktop starts the carousel auto-advance (**2.5s interval**)
- [ ] Moving mouse off the card stops auto-advance
- [ ] Ken Burns effect is visible: subtle left-to-right pan + slight zoom
- [ ] Dot indicators update when slide changes
- [ ] Carousel loops — reaching the last image cycles back to the first
- [ ] On mobile (or DevTools mobile mode): card auto-advances when scrolled into view
- [ ] Swipe gesture advances/retreats the carousel on mobile
- [ ] Empty state (recipe with no images) shows a styled placeholder with recipe title

### Recipe View Page (`/recipe/[id]`)
- [ ] Hero carousel is full width, ~70vh height on desktop
- [ ] Auto-advances every **5 seconds** WITHOUT needing to hover *(bumped from 4s — B4, 2026-04-19)*
- [ ] Gradient overlay is visible (bottom of image darkens, text is readable)
- [ ] Prev/Next ghost arrows appear on hover (desktop only)
- [ ] Carousel loops infinitely
- [ ] Dot indicators are visible and update correctly
- [ ] On mobile: tap right half of image advances, tap left retreats
- [ ] Swipe left/right navigates between images

### Edit Mode (`/add?id=...`)
- [ ] Image Manager panel is visible below the recipe title
- [ ] Can upload a photo — thumbnail appears after upload
- [ ] Upload compresses to < 300KB (check DevTools Network tab for file size)
- [ ] First image in list is marked as "hero" (main)
- [ ] Can reorder images by dragging
- [ ] Can delete an image
- [ ] "Generate Prep Image" button is visible
- [ ] "Generate Hero Image" button is visible
- [ ] Clicking Generate shows "Painting your dish..." loading shimmer
- [ ] Generated image appears in the Image Manager
- [ ] After 2 generations, buttons are disabled/hidden (limit reached)
- [ ] Can delete a generated image to unlock a new generation

### Accessibility
- [ ] Tab to a carousel card → arrow keys advance/retreat slides
- [ ] Each image has a descriptive `aria-label`
- [ ] In DevTools: Enable `prefers-reduced-motion` → Ken Burns and auto-advance are disabled
- [ ] No layout shift (CLS) when carousel loads

---

## Step 6: Clean up temp test files

```bash
rm /tmp/test_carousel_logic.js /tmp/test_carousel_db.js /tmp/test_carousel_prompts.js /tmp/test_carousel_compression.js
```
