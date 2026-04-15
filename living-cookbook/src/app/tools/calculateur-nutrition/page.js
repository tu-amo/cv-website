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
  title:       'Calculateur de Macros et Calories Gratuit | Pretzel Prep',
  description: 'Vérifiez instantanément les calories et macros de vos recettes. Base de données USDA gratuite et précise. ✓ Essayez maintenant.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Calculateur de Macros et Calories Gratuit | Pretzel Prep',
    description: 'Vérifiez instantanément les calories et macros de vos recettes. Base de données USDA gratuite et précise. ✓ Essayez maintenant.',
    url:         'https://pretzelprep.com/tools/calculateur-nutrition',
    type:        'website',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Calculateur de Macros et Calories Gratuit',
  url:                  'https://pretzelprep.com/tools/calculateur-nutrition',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Vérifiez instantanément les calories et macros de vos recettes. Base de données USDA gratuite et précise. ✓ Essayez maintenant.',
  inLanguage:           'fr',
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
            <NutritionCalculator sessionId={sessionId} copy={copy.fr} />
        </>
    );
}
