'use client';

import Link from 'next/link';

/**
 * SiteFooter — appears on every page via layout.js.
 *
 * Provides the legally required two-click access to:
 *   - Impressum (required by German TMG §5)
 *   - Datenschutzerklärung (required by GDPR/DSGVO)
 *   - AGB (required before payment goes live)
 *
 * Styled to be minimal inside the main authenticated app,
 * and cleanly visible on public tool/landing pages.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo" aria-label="Site footer">
      <div className="site-footer__inner">
        <span className="site-footer__copy">
          © {year} Pretzel Prep
        </span>

        <nav className="site-footer__nav" aria-label="Legal navigation">
          <Link href="/impressum">Impressum</Link>
          <span aria-hidden="true">·</span>
          <Link href="/datenschutz">Datenschutz</Link>
          <span aria-hidden="true">·</span>
          <Link href="/agb">AGB</Link>
          <span aria-hidden="true">·</span>
          <a href="mailto:info@pretzelprep.com">Kontakt</a>
        </nav>
      </div>
    </footer>
  );
}
