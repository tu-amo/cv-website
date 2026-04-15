/**
 * robots.js — Next.js App Router robots
 * ─────────────────────────────────────────────────────────────────────────────
 * Served automatically at /robots.txt
 *
 * Allows all crawlers on public pages.
 * Disallows authenticated routes that would return 401/redirect.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pretzelprep.com';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/tools/',
          '/tools/recipe-scaler',
          '/tools/rezept-skalieren',
          '/tools/escalar-receta',
          '/tools/convertir-recette',
          '/tools/scalare-ricetta',
          '/tools/recept-omrekenen',
          '/login',
          '/signup',
          '/public/',
        ],
        disallow: [
          '/add',
          '/household',
          '/shopping',
          '/profile',
          '/system',
          '/recipe/',    // auth-required detail pages
          '/join/',      // invite-only, no crawl value
          '/api/',       // all API routes
          '/auth/',      // auth callbacks
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
