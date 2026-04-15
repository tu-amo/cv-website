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
  title:       'Convertisseur de Recette Gratuit - Adapter Portions | Pretzel Prep',
  description: 'Adaptez n\'importe quelle recette en un instant. Collez vos ingrédients pour obtenir des quantités parfaites. 100% gratuit. ✓ Essayez.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Convertisseur de Recette Gratuit - Adapter Portions | Pretzel Prep',
    description: 'Adaptez n\'importe quelle recette en un instant. 100% gratuit.',
    url:         'https://pretzelprep.com/tools/convertir-recette',
    type:        'website',
    locale:      'fr_FR',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Convertisseur de Recette — Adapter Portions',
  url:                  'https://pretzelprep.com/tools/convertir-recette',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Calculateur gratuit pour adapter les portions de vos recettes.',
  inLanguage:           'fr',
};

export default function RecipeScalerFR() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <RecipeScaler copy={copy.fr} />
    </>
  );
}
