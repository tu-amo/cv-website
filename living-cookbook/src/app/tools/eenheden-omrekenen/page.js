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
  title:       'Maateenheden Omrekenen — Gram, Kopjes, °C/°F | Pretzel Prep',
  description: 'Converteer metrisch en imperiaal direct — gram naar ounces, ml naar kopjes, Celsius naar Fahrenheit. UK/US-schakelaar inbegrepen. Gratis, geen account nodig.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Maateenheden Omrekenen | Pretzel Prep',
    description: 'Converteer gram, ounces, ml, kopjes, °C en °F direct. UK/US-schakelaar inbegrepen.',
    url:         'https://pretzelprep.com/tools/eenheden-omrekenen',
    type:        'website',
    locale:      'nl_NL',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Keuken Maateenheden Omrekenen',
  url:                  'https://pretzelprep.com/tools/eenheden-omrekenen',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Gratis keuken maateenheden-omrekener. Metrisch en imperiaal — gewicht, volume en temperatuur. UK/US-schakelaar.',
  inLanguage:           'nl',
};

export default function UnitConverterNL() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <UnitConverter copy={copy.nl} />
    </>
  );
}
