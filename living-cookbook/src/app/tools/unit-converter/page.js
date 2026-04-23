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
  title:       'Free Kitchen Unit Converter — Cups, Grams, Ounces, °C/°F | Pretzel Prep',
  description: 'Convert between metric and imperial instantly — grams to ounces, ml to cups, Celsius to Fahrenheit. UK & US tablespoon/pint toggle. Free, no account needed.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Free Kitchen Unit Converter | Pretzel Prep',
    description: 'Convert grams, ounces, ml, cups, °C and °F instantly. UK/US toggle included.',
    url:         'https://pretzelprep.com/tools/unit-converter',
    type:        'website',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Kitchen Unit Converter',
  url:                  'https://pretzelprep.com/tools/unit-converter',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Free kitchen unit converter. Convert between metric and imperial — weight, volume, and temperature. UK and US tablespoon/pint toggle.',
  inLanguage:           'en',
};

export default function UnitConverterEN() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <UnitConverter copy={copy.en} />
    </>
  );
}
