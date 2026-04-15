const fs = require('fs');
const path = require('path');

const LANGS = {
  'x-default': '/tools/nutrition-calculator',
  en:  '/tools/nutrition-calculator',
  de:  '/tools/nahrwertrechner',
  es:  '/tools/calculadora-nutricional',
  fr:  '/tools/calculateur-nutrition',
  it:  '/tools/calcolatore-nutrizionale',
  nl:  '/tools/voedingswaarde-calculator',
};

const metaData = {
  de: {
    title: 'Kostenloser Makro Rechner - Nährwerte Prüfen | Pretzel Prep',
    description: 'Prüfen Sie sofort Kalorien und Makros Ihrer Rezepte. Kostenloser USDA-Datenbank-Rechner für präzise Nährwertdaten. ✓ Jetzt ausprobieren.',
    lang: 'de'
  },
  es: {
    title: 'Calculadora Nutricional de Recetas Gratis | Pretzel Prep',
    description: 'Verifica las calorías y macros de tus recetas al instante. Calculadora gratuita con la base de datos del USDA. ✓ Pruébalo ahora.',
    lang: 'es'
  },
  fr: {
    title: 'Calculateur de Macros et Calories Gratuit | Pretzel Prep',
    description: 'Vérifiez instantanément les calories et macros de vos recettes. Base de données USDA gratuite et précise. ✓ Essayez maintenant.',
    lang: 'fr'
  },
  it: {
    title: 'Calcolatore Nutrizionale Gratuito per Ricette | Pretzel Prep',
    description: 'Controlla istantaneamente calorie e macro. Incolla gli ingredienti nel nostro calcolatore gratuito basato sul database USDA. ✓ Provalo.',
    lang: 'it'
  },
  nl: {
    title: 'Gratis Voedingswaarde Calculator & Macro Tool | Pretzel Prep',
    description: 'Bereken direct calorieën en macro\'s voor je recepten met onze gratis USDA database calculator. ✓ Probeer het nu.',
    lang: 'nl'
  }
};

const template = (lang, meta) => `import { NutritionCalculator } from '@/components/tools/NutritionCalculator';
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
  title:       '${meta.title}',
  description: '${meta.description.replace(/'/g, "\\'")}',
  alternates:  { languages: LANGS },
  openGraph: {
    title:       '${meta.title}',
    description: '${meta.description.replace(/'/g, "\\'")}',
    url:         'https://pretzelprep.com' + LANGS['${lang}'],
    type:        'website',
  },
};

const schema = {
  '@context':           'https://schema.org',
  '@type':              'WebApplication',
  name:                 '${meta.title.split(' |')[0]}',
  url:                  'https://pretzelprep.com' + LANGS['${lang}'],
  applicationCategory:  'UtilitiesApplication',
  operatingSystem:      'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:          '${meta.description.replace(/'/g, "\\'")}',
  inLanguage:           '${lang}',
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
            <NutritionCalculator sessionId={sessionId} copy={copy.${lang}} />
        </>
    );
}
`;

for (const [lang, meta] of Object.entries(metaData)) {
    const route = LANGS[lang].replace('/tools/', '');
    const dir = path.join(__dirname, 'src', 'app', 'tools', route);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'page.js'), template(lang, meta));
    console.log(`Generated ${route}`);
}
