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
  title:       'Free Recipe Scaler - Scale Servings Instantly | Pretzel Prep',
  description: 'Scale any recipe up or down in seconds. Paste ingredients to calculate perfectly adjusted quantities. Completely free tool. ✓ Try it now.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Free Recipe Scaler | Pretzel Prep',
    description: 'Scale any recipe up or down in seconds. Completely free.',
    url:         'https://pretzelprep.com/tools/recipe-scaler',
    type:        'website',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Recipe Scaler',
  url:                  'https://pretzelprep.com/tools/recipe-scaler',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Free recipe scaling calculator. Scale any recipe up or down instantly.',
  inLanguage:           'en',
};

export default function RecipeScalerEN() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <RecipeScaler copy={copy.en} />
    </>
  );
}
