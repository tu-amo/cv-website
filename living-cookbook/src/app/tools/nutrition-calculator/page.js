import { NutritionCalculator } from '@/components/tools/NutritionCalculator';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { copy } from '@/lib/tools/nutrition-calculator-copy';

// Let's decide on the route names:
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
  title:       'Free Recipe Nutrition Calculator - Check Macros | Pretzel Prep',
  description: 'Instantly check your recipe calories and macros. Paste ingredients into our free USDA database calculator for accurate nutritional data. ✓ Try it now.',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       'Recipe Nutrition Calculator | Pretzel Prep',
    description: 'Instantly check your recipe calories and macros. Free USDA database calculator.',
    url:         'https://pretzelprep.com/tools/nutrition-calculator',
    type:        'website',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 'Recipe Nutrition Calculator',
  url:                  'https://pretzelprep.com/tools/nutrition-calculator',
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          'Free recipe nutrition calculator. Check calories and macros instantly.',
  inLanguage:           'en',
};

export default async function NutritionCalculatorPage() {
    // Basic anonymous session hashing via Next.js headers to avoid direct IP database storage
    const headerData = await headers();
    const forwardedFor = headerData.get('x-forwarded-for');
    const realIp = headerData.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || 'unknown-ip');
    
    // Hash the IP with a daily salt so it rotates but provides enough stability for same-day rate limiting
    const dailySalt = new Date().toISOString().split('T')[0];
    const sessionId = crypto.createHash('sha256').update(ip + dailySalt).digest('hex').substring(0, 16);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
            <NutritionCalculator sessionId={sessionId} copy={copy.en} />
        </>
    );
}
