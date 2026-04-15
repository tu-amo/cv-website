/**
 * sitemap.js — Next.js App Router sitemap
 * ─────────────────────────────────────────────────────────────────────────────
 * Served automatically at /sitemap.xml
 *
 * Only PUBLIC, indexable pages are listed here.
 * Authenticated-only pages (/add, /recipe/[id], /shopping, /household,
 * /profile, /system) are intentionally excluded — they are behind auth and
 * have no SEO value.
 *
 * Tool pages use alternates.languages to declare hreflang to Google.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pretzelprep.com';

/** ISO date string for today — used as lastModified for static pages */
const TODAY = new Date().toISOString();

/** Tool pages: one canonical per language, all linked via alternates */
const TOOL_LASTMOD = '2026-04-15';

export default function sitemap() {
  return [

    // ── Homepage ────────────────────────────────────────────────────────────
    {
      url:          `${BASE_URL}/`,
      lastModified: TODAY,
      changeFrequency: 'daily',
      priority:     1.0,
    },

    // ── Login / Signup ───────────────────────────────────────────────────────
    // Included so GSC can verify these aren't returning errors.
    // Low priority — not content pages.
    {
      url:          `${BASE_URL}/login`,
      lastModified: TODAY,
      changeFrequency: 'monthly',
      priority:     0.3,
    },
    {
      url:          `${BASE_URL}/signup`,
      lastModified: TODAY,
      changeFrequency: 'monthly',
      priority:     0.4,
    },

    // ── Free Tools index ────────────────────────────────────────────────────
    {
      url:          `${BASE_URL}/tools`,
      lastModified: TOOL_LASTMOD,
      changeFrequency: 'weekly',
      priority:     0.9,
    },

    // ── Recipe Scaler — English (canonical) ─────────────────────────────────
    {
      url:          `${BASE_URL}/tools/recipe-scaler`,
      lastModified: TOOL_LASTMOD,
      changeFrequency: 'monthly',
      priority:     0.9,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/tools/recipe-scaler`,
          en:          `${BASE_URL}/tools/recipe-scaler`,
          de:          `${BASE_URL}/tools/rezept-skalieren`,
          es:          `${BASE_URL}/tools/escalar-receta`,
          fr:          `${BASE_URL}/tools/convertir-recette`,
          it:          `${BASE_URL}/tools/scalare-ricetta`,
          nl:          `${BASE_URL}/tools/recept-omrekenen`,
        },
      },
    },

    // ── Recipe Scaler — German ───────────────────────────────────────────────
    {
      url:          `${BASE_URL}/tools/rezept-skalieren`,
      lastModified: TOOL_LASTMOD,
      changeFrequency: 'monthly',
      priority:     0.9,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/tools/recipe-scaler`,
          en:          `${BASE_URL}/tools/recipe-scaler`,
          de:          `${BASE_URL}/tools/rezept-skalieren`,
          es:          `${BASE_URL}/tools/escalar-receta`,
          fr:          `${BASE_URL}/tools/convertir-recette`,
          it:          `${BASE_URL}/tools/scalare-ricetta`,
          nl:          `${BASE_URL}/tools/recept-omrekenen`,
        },
      },
    },

    // ── Recipe Scaler — Spanish ──────────────────────────────────────────────
    {
      url:          `${BASE_URL}/tools/escalar-receta`,
      lastModified: TOOL_LASTMOD,
      changeFrequency: 'monthly',
      priority:     0.9,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/tools/recipe-scaler`,
          en:          `${BASE_URL}/tools/recipe-scaler`,
          de:          `${BASE_URL}/tools/rezept-skalieren`,
          es:          `${BASE_URL}/tools/escalar-receta`,
          fr:          `${BASE_URL}/tools/convertir-recette`,
          it:          `${BASE_URL}/tools/scalare-ricetta`,
          nl:          `${BASE_URL}/tools/recept-omrekenen`,
        },
      },
    },

    // ── Recipe Scaler — French ───────────────────────────────────────────────
    {
      url:          `${BASE_URL}/tools/convertir-recette`,
      lastModified: TOOL_LASTMOD,
      changeFrequency: 'monthly',
      priority:     0.9,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/tools/recipe-scaler`,
          en:          `${BASE_URL}/tools/recipe-scaler`,
          de:          `${BASE_URL}/tools/rezept-skalieren`,
          es:          `${BASE_URL}/tools/escalar-receta`,
          fr:          `${BASE_URL}/tools/convertir-recette`,
          it:          `${BASE_URL}/tools/scalare-ricetta`,
          nl:          `${BASE_URL}/tools/recept-omrekenen`,
        },
      },
    },

    // ── Recipe Scaler — Italian ──────────────────────────────────────────────
    {
      url:          `${BASE_URL}/tools/scalare-ricetta`,
      lastModified: TOOL_LASTMOD,
      changeFrequency: 'monthly',
      priority:     0.9,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/tools/recipe-scaler`,
          en:          `${BASE_URL}/tools/recipe-scaler`,
          de:          `${BASE_URL}/tools/rezept-skalieren`,
          es:          `${BASE_URL}/tools/escalar-receta`,
          fr:          `${BASE_URL}/tools/convertir-recette`,
          it:          `${BASE_URL}/tools/scalare-ricetta`,
          nl:          `${BASE_URL}/tools/recept-omrekenen`,
        },
      },
    },

    // ── Recipe Scaler — Dutch ────────────────────────────────────────────────
    {
      url:          `${BASE_URL}/tools/recept-omrekenen`,
      lastModified: TOOL_LASTMOD,
      changeFrequency: 'monthly',
      priority:     0.9,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/tools/recipe-scaler`,
          en:          `${BASE_URL}/tools/recipe-scaler`,
          de:          `${BASE_URL}/tools/rezept-skalieren`,
          es:          `${BASE_URL}/tools/escalar-receta`,
          fr:          `${BASE_URL}/tools/convertir-recette`,
          it:          `${BASE_URL}/tools/scalare-ricetta`,
          nl:          `${BASE_URL}/tools/recept-omrekenen`,
        },
      },
    },

  ];
}
