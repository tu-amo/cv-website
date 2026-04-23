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
  title:       'Convertidor de Medidas de Cocina — Gramos, Tazas, °C/°F | Pretzel Prep',
  description: 'Convierte entre métrico e imperial al instante — gramos a onzas, ml a tazas, Celsius a Fahrenheit. Selector UK/US incluido. Gratis, sin cuenta.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Convertidor de Medidas de Cocina | Pretzel Prep',
    description: 'Convierte gramos, onzas, ml, tazas, °C y °F al instante. Selector UK/US incluido.',
    url:         'https://pretzelprep.com/tools/convertidor-de-unidades',
    type:        'website',
    locale:      'es_ES',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Convertidor de Medidas de Cocina',
  url:                  'https://pretzelprep.com/tools/convertidor-de-unidades',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Convertidor de medidas de cocina gratuito. Métrico e imperial — peso, volumen y temperatura. Selector UK/US.',
  inLanguage:           'es',
};

export default function UnitConverterES() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <UnitConverter copy={copy.es} />
    </>
  );
}
