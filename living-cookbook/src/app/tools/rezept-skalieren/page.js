import { RecipeScaler } from '@/components/tools/RecipeScaler';
import { copy } from '@/lib/tools/recipe-scaler-copy';

const LANGS = {
  'x-default': '/tools/recipe-scaler',
  en:  '/tools/recipe-scaler',
  de:  '/tools/rezept-skalieren',
  es:  '/tools/escalar-receta',
  fr:  '/tools/convertir-recette',
  it:  '/tools/scalare-ricetta',
  nl:  '/tools/recept-omrekenen',
};

export const metadata = {
  title:       'Kostenloser Rezeptrechner - Portionen Skalieren | Pretzel Prep',
  description: 'Rezepte sofort für mehr oder weniger Portionen umrechnen. Zutaten einfügen und exakte Mengen erhalten. Kostenlos. ✓ Jetzt ausprobieren.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Kostenloser Rezeptrechner - Portionen Skalieren | Pretzel Prep',
    description: 'Rezepte in Sekunden umrechnen. Komplett kostenlos.',
    url:         'https://pretzelprep.com/tools/rezept-skalieren',
    type:        'website',
    locale:      'de_DE',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Rezeptrechner — Rezept skalieren',
  url:                  'https://pretzelprep.com/tools/rezept-skalieren',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Kostenloser Rezeptrechner zum Skalieren von Rezepten. Portionen erhöhen oder verringern — in Sekunden.',
  inLanguage:           'de',
};

export default function RecipeScalerDE() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <RecipeScaler copy={copy.de} />
    </>
  );
}
