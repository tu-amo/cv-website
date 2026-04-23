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
  title:       'Convertitore di Misure Cucina — Grammi, Tazze, °C/°F | Pretzel Prep',
  description: 'Converti tra metrico e imperiale all\'istante — grammi in once, ml in tazze, Celsius in Fahrenheit. Selettore UK/US incluso. Gratuito, senza account.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Convertitore di Misure Cucina | Pretzel Prep',
    description: 'Converti grammi, once, ml, tazze, °C e °F all\'istante. Selettore UK/US incluso.',
    url:         'https://pretzelprep.com/tools/convertitore-misure',
    type:        'website',
    locale:      'it_IT',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Convertitore di Misure Cucina',
  url:                  'https://pretzelprep.com/tools/convertitore-misure',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Convertitore di misure per la cucina gratuito. Metrico e imperiale — peso, volume e temperatura. Selettore UK/US.',
  inLanguage:           'it',
};

export default function UnitConverterIT() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <UnitConverter copy={copy.it} />
    </>
  );
}
