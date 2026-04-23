import { UnitConverter } from '@/components/tools/UnitConverter';
import { copy } from '@/lib/tools/unit-converter-copy';

const LANGS = {
  'x-default': '/tools/unit-converter',
  en:  '/tools/unit-converter',
  de:  '/tools/einheitenrechner',
  es:  '/tools/convertidor-de-unidades',
  fr:  '/tools/convertisseur-d-unites',
  it:  '/tools/convertitore-misure',
  nl:  '/tools/eenheden-omrekenen',
};

export const metadata = {
  title:       'Convertisseur de Mesures Cuisine — Grammes, Tasses, °C/°F | Pretzel Prep',
  description: 'Convertissez entre métrique et impérial instantanément — grammes en onces, ml en tasses, Celsius en Fahrenheit. Bascule UK/US incluse. Gratuit, sans compte.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Convertisseur de Mesures Cuisine | Pretzel Prep',
    description: 'Convertissez grammes, onces, ml, tasses, °C et °F instantanément. Bascule UK/US incluse.',
    url:         'https://pretzelprep.com/tools/convertisseur-d-unites',
    type:        'website',
    locale:      'fr_FR',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Convertisseur de Mesures Cuisine',
  url:                  'https://pretzelprep.com/tools/convertisseur-d-unites',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Convertisseur de mesures cuisine gratuit. Métrique et impérial — poids, volume et température. Bascule UK/US.',
  inLanguage:           'fr',
};

export default function UnitConverterFR() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <UnitConverter copy={copy.fr} />
    </>
  );
}
