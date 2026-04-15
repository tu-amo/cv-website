import { NutritionCalculator } from '@/components/tools/NutritionCalculator';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { copy } from '@/lib/tools/nutrition-calculator-copy';

const LANGS = {
  'x-default': '/tools/nutrition-calculator',
  en:  '/tools/nutrition-calculator',
  de:  '/tools/nahrwertrechner',
  es:  '/tools/calculadora-nutricional',
  fr:  '/tools/calculateur-nutrition',
  it:  '/tools/calcolatore-nutrizionale',
  nl:  '/tools/voedingswaarde-calculator',
};

export const metadata = {
  title:       'Calculadora Nutricional de Recetas Gratis | Pretzel Prep',
  description: 'Verifica las calorías y macros de tus recetas al instante. Calculadora gratuita con la base de datos del USDA. ✓ Pruébalo ahora.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Calculadora Nutricional de Recetas Gratis | Pretzel Prep',
    description: 'Verifica las calorías y macros de tus recetas al instante. Calculadora gratuita con la base de datos del USDA. ✓ Pruébalo ahora.',
    url:         'https://pretzelprep.com/tools/calculadora-nutricional',
    type:        'website',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Calculadora Nutricional de Recetas Gratis',
  url:                  'https://pretzelprep.com/tools/calculadora-nutricional',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Verifica las calorías y macros de tus recetas al instante. Calculadora gratuita con la base de datos del USDA. ✓ Pruébalo ahora.',
  inLanguage:           'es',
};

export default async function NutritionCalculatorPage() {
    const headerData = await headers();
    const forwardedFor = headerData.get('x-forwarded-for');
    const realIp = headerData.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || 'unknown-ip');
    const dailySalt = new Date().toISOString().split('T')[0];
    const sessionId = crypto.createHash('sha256').update(ip + dailySalt).digest('hex').substring(0, 16);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <NutritionCalculator sessionId={sessionId} copy={copy.es} />
        </>
    );
}
