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
  title:       'Gratis Recepten Omrekenen - Porties Aanpassen | Pretzel Prep',
  description: 'Reken elk recept in seconden om. Plak ingrediënten en bereken direct de perfecte hoeveelheden. Volledig gratis tool. ✓ Probeer nu.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Gratis Recepten Omrekenen - Porties Aanpassen | Pretzel Prep',
    description: 'Reken elk recept in seconden om. Volledig gratis.',
    url:         'https://pretzelprep.com/tools/recept-omrekenen',
    type:        'website',
    locale:      'nl_NL',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Recepten Omrekenen',
  url:                  'https://pretzelprep.com/tools/recept-omrekenen',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Gratis rekenaar om porties van recepten aan te passen.',
  inLanguage:           'nl',
};

export default function RecipeScalerNL() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <RecipeScaler copy={copy.nl} />
    </>
  );
}
