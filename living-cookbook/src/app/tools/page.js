import Link from 'next/link';

export const metadata = {
  title:       'Free Recipe Tools | Pretzel Prep',
  description: 'Free tools for home cooks and food professionals. Scale recipes and convert measurements in 6 languages — no account needed.',
};

const tools = [
  {
    slug:        '/tools/recipe-scaler',
    title:       'Recipe Scaler',
    description: 'Scale any recipe up or down in seconds. Paste your ingredient list, enter your servings, get perfectly adjusted quantities.',
    badge:       'Free',
    langs:       ['EN', 'DE', 'ES', 'FR', 'IT', 'NL'],
  },
  {
    slug:        '/tools/unit-converter',
    title:       'Kitchen Unit Converter',
    description: 'Convert between metric and imperial instantly — grams ↔ ounces, ml ↔ cups, °C ↔ °F. UK and US tablespoon/pint toggle included.',
    badge:       'Free',
    langs:       ['EN', 'DE', 'ES', 'FR', 'IT', 'NL'],
  },
];

export default function ToolsIndex() {
  return (
    <div className="pp-page-card">

      <header style={{ marginBottom: 'var(--space-10)' }}>
        <p className="pp-overline">Pretzel Prep</p>
        <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: 'var(--type-headline-lg)', fontWeight: 700, color: 'var(--color-on-surface)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          Free Cooking Tools
        </h1>
        <p style={{ fontSize: 'var(--type-body-lg)', color: 'var(--color-on-surface-muted)', maxWidth: 560 }}>
          Useful tools for home cooks and food professionals. Always free, no account required.
        </p>
      </header>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {tools.map(tool => (
          <li key={tool.slug}>
            <Link
              href={tool.slug}
              style={{
                display:         'block',
                background:      'var(--color-surface-container)',
                border:          '1px solid var(--color-hairline)',
                borderRadius:    'var(--radius-lg)',
                padding:         'var(--space-6)',
                textDecoration:  'none',
                transition:      'all var(--motion-fast)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontFamily: 'var(--font-brand)', fontSize: 'var(--type-title-md)', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  {tool.title}
                </span>
                <span style={{ fontSize: 'var(--type-label-md)', fontWeight: 700, background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '2px 10px', borderRadius: 'var(--radius-pill)', letterSpacing: '0.04em' }}>
                  {tool.badge}
                </span>
              </div>
              <p style={{ fontSize: 'var(--type-body-md)', color: 'var(--color-on-surface-muted)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
                {tool.description}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {tool.langs.map(lang => (
                  <span key={lang} style={{ fontSize: 'var(--type-label-sm)', color: 'var(--color-primary)', background: 'var(--color-primary-container)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                    {lang}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>

    </div>
  );
}
