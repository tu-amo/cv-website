export const metadata = {
  title: 'Impressum — Pretzel Prep',
  description: 'Impressum und rechtliche Hinweise für Pretzel Prep gemäß § 5 TMG.',
  robots: { index: false, follow: false },
};

export default function ImpressumPage() {
  return (
    <div className="pp-page-card" style={{ maxWidth: '800px' }}>
      <div style={{ padding: '2rem 0 1rem' }}>

        <h1 className="pp-section-heading" style={{ marginTop: 0 }}>Impressum</h1>
        <p className="pp-hint" style={{ marginBottom: '2rem' }}>
          Legal Notice · Angaben gemäß § 5 TMG
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">Verantwortlich / Responsible</h2>
          <address style={{ fontStyle: 'normal', lineHeight: 1.8 }}>
            <strong>Jane Petra Scott</strong><br />
            Peter-Rosseger Str. 29<br />
            40699, Erkrath<br />
            Deutschland / Germany
          </address>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">Kontakt / Contact</h2>
          <p>
            E-Mail: <a href="mailto:info@pretzelprep.com">info@pretzelprep.com</a>
          </p>
          {/* Optional: Telefon: +49 ... */}
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">Umsatzsteuer-ID</h2>
          <p>
            {/* If VAT registered, add: */}
            {/* Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE[123456789] */}
            Umsatzsteuer-Identifikationsnummer: <em>Noch nicht registriert / Not yet registered</em>
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <address style={{ fontStyle: 'normal', lineHeight: 1.8 }}>
            Jane Petra Scott<br />
            Peter-Rosseger Str. 29<br />
            40699, Erkrath
          </address>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">Haftungshinweis / Liability Disclaimer</h2>
          <p style={{ lineHeight: 1.7, color: 'var(--color-on-surface-muted)', fontSize: '0.9rem' }}>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
            externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber
            verantwortlich.
          </p>
          <p style={{ lineHeight: 1.7, color: 'var(--color-on-surface-muted)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
            Despite careful content control, we assume no liability for the content of external links.
            The operators of linked pages are solely responsible for their content.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">Urheberrecht / Copyright</h2>
          <p style={{ lineHeight: 1.7, color: 'var(--color-on-surface-muted)', fontSize: '0.9rem' }}>
            Die auf dieser Website veröffentlichten Inhalte unterliegen dem deutschen Urheberrecht.
            Nutzer-generierte Inhalte (Rezepte, Fotos) verbleiben im Eigentum des jeweiligen Nutzers.
            Die Vervielfältigung, Bearbeitung oder Verbreitung der Plattform selbst bedarf der
            schriftlichen Genehmigung des Betreibers.
          </p>
        </section>

        <p className="pp-hint" style={{ marginTop: '3rem', borderTop: '1px solid var(--color-hairline)', paddingTop: '1rem' }}>
          Stand / Last updated: April 2026
        </p>
      </div>
    </div>
  );
}
