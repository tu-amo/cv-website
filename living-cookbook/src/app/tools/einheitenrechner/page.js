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
  title:       'Küchenmaße umrechnen — Gramm, Tassen, °C/°F | Pretzel Prep',
  description: 'Metrisch und imperial sofort umrechnen — Gramm zu Unzen, ml zu Tassen, Celsius zu Fahrenheit. UK- & US-Einheiten-Umschalter. Kostenlos, kein Konto nötig.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Küchenmaße umrechnen | Pretzel Prep',
    description: 'Gramm, Unzen, ml, Tassen, °C und °F sofort umrechnen. UK/US-Umschalter enthalten.',
    url:         'https://pretzelprep.com/tools/einheitenrechner',
    type:        'website',
    locale:      'de_DE',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Küchen-Einheitenrechner',
  url:                  'https://pretzelprep.com/tools/einheitenrechner',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Kostenloser Küchen-Einheitenrechner. Metrisch und imperial umrechnen — Gewicht, Volumen und Temperatur. UK- und US-Einheiten-Umschalter.',
  inLanguage:           'de',
};

export default function UnitConverterDE() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <UnitConverter copy={copy.de} />
    </>
  );
}
