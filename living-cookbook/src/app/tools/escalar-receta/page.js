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
  title:       'Calculadora de Recetas Gratis - Escalar Porciones | Pretzel Prep',
  description: 'Escala cualquier receta al instante. Pega tus ingredientes para calcular cantidades perfectamente ajustadas. Totalmente gratis. ✓ Pruébalo.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Calculadora de Recetas Gratis - Escalar Porciones | Pretzel Prep',
    description: 'Escala cualquier receta al instante. Totalmente gratis.',
    url:         'https://pretzelprep.com/tools/escalar-receta',
    type:        'website',
    locale:      'es_ES',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Calculadora de Recetas — Escalar Porciones',
  url:                  'https://pretzelprep.com/tools/escalar-receta',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Calculadora gratuita para escalar recetas al instante.',
  inLanguage:           'es',
};

export default function RecipeScalerES() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <RecipeScaler copy={copy.es} />
    </>
  );
}
