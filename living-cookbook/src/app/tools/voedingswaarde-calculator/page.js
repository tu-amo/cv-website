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
  title:       'Gratis Voedingswaarde Calculator & Macro Tool | Pretzel Prep',
  description: 'Bereken direct calorieën en macro\'s voor je recepten met onze gratis USDA database calculator. ✓ Probeer het nu.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Gratis Voedingswaarde Calculator & Macro Tool | Pretzel Prep',
    description: 'Bereken direct calorieën en macro\'s voor je recepten met onze gratis USDA database calculator. ✓ Probeer het nu.',
    url:         'https://pretzelprep.com/tools/voedingswaarde-calculator',
    type:        'website',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Gratis Voedingswaarde Calculator & Macro Tool',
  url:                  'https://pretzelprep.com/tools/voedingswaarde-calculator',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Bereken direct calorieën en macro\'s voor je recepten met onze gratis USDA database calculator. ✓ Probeer het nu.',
  inLanguage:           'nl',
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
            <NutritionCalculator sessionId={sessionId} copy={copy.nl} />
        </>
    );
}
