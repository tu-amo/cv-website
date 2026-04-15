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
  title:       'Calcolatore di Ricette Gratuito - Scala Porzioni | Pretzel Prep',
  description: 'Scala le porzioni di qualsiasi ricetta in pochi secondi. Incolla gli ingredienti per ricalcolare le quantità. Gratuito. ✓ Provalo ora.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Calcolatore di Ricette Gratuito - Scala Porzioni | Pretzel Prep',
    description: 'Scala le porzioni di qualsiasi ricetta in pochi secondi. Totalmente gratuito.',
    url:         'https://pretzelprep.com/tools/scalare-ricetta',
    type:        'website',
    locale:      'it_IT',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Calcolatore di Ricette — Scala Porzioni',
  url:                  'https://pretzelprep.com/tools/scalare-ricetta',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Calcolatore gratuito per scalare le porzioni di qualsiasi ricetta.',
  inLanguage:           'it',
};

export default function RecipeScalerIT() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <RecipeScaler copy={copy.it} />
    </>
  );
}
