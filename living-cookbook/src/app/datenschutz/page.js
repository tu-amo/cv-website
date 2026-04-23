export const metadata = {
  title: 'Datenschutzerklärung — Pretzel Prep',
  description: 'Privacy Policy / Datenschutzerklärung für Pretzel Prep. Informationen zur Datenverarbeitung gemäß DSGVO.',
  robots: { index: false, follow: false },
};

// ─── Reusable section wrapper ──────────────────────────────────────────────
function Section({ title, de, en }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 className="legal-section-heading">{title}</h2>
      {de && <p style={{ lineHeight: 1.8, marginBottom: '0.75rem', fontSize: '0.9rem' }}>{de}</p>}
      {en && <p style={{ lineHeight: 1.8, color: 'var(--color-on-surface-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>{en}</p>}
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <div className="pp-page-card" style={{ maxWidth: '800px' }}>
      <div style={{ padding: '2rem 0 1rem' }}>

        <h1 className="pp-section-heading" style={{ marginTop: 0, marginBottom: '0.5rem' }}>Datenschutzerklärung</h1>
        <p className="pp-hint" style={{ marginBottom: '0.5rem' }}>
          Privacy Policy · Gemäß DSGVO / GDPR, BDSG, TTDSG
        </p>
        <p className="pp-hint" style={{ marginBottom: '2.5rem' }}>
          Stand: April 2026 · Die deutsche Fassung ist rechtlich bindend. ·{' '}
          <em>The German version is legally binding.</em>
        </p>

        {/* ── 1. Verantwortlicher ─────────────────────────────────────── */}
        <Section
          title="1. Verantwortlicher / Data Controller"
          de={<>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:{' '}
            <strong>Jane Petra Scott, Peter-Rosseger Str. 29, 40699, Erkrath, Deutschland.</strong>{' '}
            E-Mail: <a href="mailto:info@pretzelprep.com">info@pretzelprep.com</a>
          </>}
          en="The person responsible for data processing on this website is as listed above."
        />

        {/* ── 2. Welche Daten wir erheben ─────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="legal-section-heading">
            2. Welche Daten wir erheben / What Data We Collect
          </h2>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', marginTop: '1rem' }}>a) Konto- und Profildaten / Account &amp; Profile Data</h3>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Bei der Registrierung erfassen wir: E-Mail-Adresse, Anzeigename (Display Name).
            Diese Daten werden benötigt, um ein Konto zu erstellen und den Dienst bereitzustellen.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            At registration, we collect: email address, display name. Legal basis: Art. 6(1)(b) GDPR (contract performance).
          </p>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', marginTop: '1rem' }}>b) Nutzerinhalt / User Content</h3>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Rezepte, Zutaten, Kochanweisungen, Fotos und Notizen, die Sie in der App erstellen.
            Diese Inhalte verbleiben in Ihrem Eigentum. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            Recipes, ingredients, steps, photos and notes you create. You retain ownership of your content. Legal basis: Art. 6(1)(b) GDPR.
          </p>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', marginTop: '1rem' }}>c) Nutzungsdaten / Usage Data</h3>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Wir erfassen anonymisierte Nutzungszähler (z.B. Anzahl der Rezept-Scans pro Monat) zur
            Durchsetzung von Nutzungsgrenzen bei kostenpflichtigen Tarifen. Kein Tracking über
            Sitzungen oder Seitenaufrufe. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            We collect anonymised usage counters (e.g. scan count per month) to enforce plan limits. No cross-session tracking. Legal basis: Art. 6(1)(b) GDPR.
          </p>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', marginTop: '1rem' }}>d) Technische Daten / Technical Data</h3>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Beim Zugriff auf die Webseite werden technische Daten temporär in Serverprotokollen gespeichert:
            IP-Adresse, Datum/Uhrzeit, aufgerufene URL, Browser-Typ. Diese Daten werden nach
            max. 30 Tagen gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Sicherheit).
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            Server logs (IP address, timestamp, URL, browser type) retained max. 30 days for security. Legal basis: Art. 6(1)(f) GDPR (legitimate interest).
          </p>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', marginTop: '1rem' }}>e) Kostenlose Tools / Free Tools (unangemeldet)</h3>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Die kostenlosen Werkzeuge (Rezept-Skalierer, Nährwertrechner) sind ohne Anmeldung nutzbar.
            Bei der Nährwertanfrage wird der eingegebene Zutatenname an die USDA FoodData Central API (USA)
            übermittelt, um Nährwertdaten abzurufen. Es werden keine personenbezogenen Daten gespeichert.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            Free tools (Recipe Scaler, Nutrition Calculator) require no login. For nutrition lookups, the entered ingredient name is sent to the USDA FoodData Central API (USA) to retrieve nutritional data. No personal data is stored. Legal basis: Art. 6(1)(f) GDPR.
          </p>
        </section>

        {/* ── 3. Cookies ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="legal-section-heading">3. Cookies</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Diese Website setzt ausschließlich technisch notwendige Cookies ein, die für den Betrieb des
            Dienstes und die Aufrechterhaltung der Anmeldesitzung erforderlich sind (Supabase
            Authentifizierungs-Session-Cookies). Diese Cookies erfordern gemäß TTDSG keine explizite
            Einwilligung. Es werden keine Tracking- oder Analyse-Cookies gesetzt.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            This website uses only technically necessary cookies required to operate the service and
            maintain login sessions (Supabase authentication session cookies). These cookies do not
            require explicit consent under TTDSG. No tracking or analytics cookies are set.
          </p>
        </section>

        {/* ── 4. Auftragsverarbeiter ──────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="legal-section-heading">4. Auftragsverarbeiter / Data Processors</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
            Wir setzen folgende Dienstleister ein, mit denen Auftragsverarbeitungsverträge (AVV)
            gemäß Art. 28 DSGVO bestehen oder bestehen werden:
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-container)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-hairline)' }}>Dienstleister</th>
                  <th style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-hairline)' }}>Zweck / Purpose</th>
                  <th style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-hairline)' }}>Sitz / Location</th>
                  <th style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-hairline)' }}>Drittlandtransfer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Supabase Inc.', 'Datenbank, Authentifizierung / Database & Auth', 'Irland (EU)', 'Nein / No'],
                  ['Vercel Inc.', 'Hosting, CDN, Serverless Functions', 'USA (EU-Edge)', 'Ja — EU SCC'],
                  ['Google LLC (Gemini API)', 'KI-Rezeptanalyse (Foto-Scan) und KI-Bildgenerierung (Magic Brief) / AI recipe scanning & image generation', 'USA', 'Ja — EU SCC · Art. 6(1)(b) DSGVO'],
                  ['Resend Inc.', 'Transaktionale E-Mails (Bestätigung, Passwort-Reset) / Transactional email', 'USA', 'Ja — EU SCC'],
                  ['USDA FoodData Central', 'Nährwertdaten-API (kein Konto erforderlich) / Nutrition data API', 'USA', 'Ja — Art. 6(1)(f) DSGVO'],
                ].map(([name, purpose, location, transfer]) => (
                  <tr key={name}>
                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-hairline)', fontWeight: 500 }}>{name}</td>
                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-hairline)' }}>{purpose}</td>
                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-hairline)' }}>{location}</td>
                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-hairline)' }}>{transfer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pp-hint" style={{ marginTop: '0.75rem' }}>
            SCC = EU-Standardvertragsklauseln (Standard Contractual Clauses) gemäß Art. 46 DSGVO.
          </p>
        </section>

        {/* ── 5. Gemini / KI-Hinweise ───────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="legal-section-heading">5. KI-gestützte Funktionen / AI-Powered Features</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Pretzel Prep nutzt die <strong>Google Gemini API</strong> (Google LLC, USA) für zwei optionale KI-Funktionen:
          </p>
          <ul style={{ lineHeight: 1.9, paddingLeft: '1.5rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            <li><strong>Rezept-Scan:</strong> Beim Hochladen eines Rezeptfotos wird das Bild an die Gemini API übertragen,
            um Zutaten, Mengen und Kochanweisungen zu extrahieren. Es werden keine personenbezogenen Daten übertragen.</li>
            <li><strong>Magic Brief:</strong> Auf ausdrückliche Nutzeranforderung (Klick auf „Magic Brief") werden
            Rezeptname und Zutatenliste an die Gemini API übertragen, um ein KI-generiertes Rezeptbild zu erstellen.
            Es werden keine personenbezogenen Daten übertragen — nur der Rezeptname und die Zutaten.</li>
          </ul>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Drittlandtransfer in die USA erfolgt auf Basis von
            EU-Standardvertragsklauseln (Art. 46 DSGVO). Datenschutzerklärung Google:{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            Pretzel Prep uses the <strong>Google Gemini API</strong> (Google LLC, USA) for two optional AI features:
            (1) <em>Recipe Scan</em> — your recipe photo is sent to Gemini to extract ingredients and steps; no personal data is transferred.
            (2) <em>Magic Brief</em> — your recipe name and ingredient list are sent to Gemini only when you explicitly click &quot;Magic Brief&quot;; no personal data is transferred.
            Legal basis: Art. 6(1)(b) GDPR. Transfer to the USA is based on EU Standard Contractual Clauses (Art. 46 GDPR).
          </p>
        </section>

        {/* ── 6. Speicherdauer ────────────────────────────────────────── */}
        <Section
          title="6. Speicherdauer / Retention"
          de="Kontodaten und Nutzerinhalte werden gespeichert, solange das Konto aktiv ist. Nach Kontolöschung werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht. Serverprotokolle: max. 30 Tage."
          en="Account data and user content are stored as long as the account is active. On account deletion, all personal data is deleted within 30 days. Server logs: max. 30 days."
        />

        {/* ── 7. Betroffenenrechte ─────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="legal-section-heading">7. Ihre Rechte / Your Rights (Art. 15–22 DSGVO)</h2>
          <ul style={{ lineHeight: 2, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
            <li><strong>Auskunft (Art. 15):</strong> Recht auf Auskunft über gespeicherte Daten. / Right of access.</li>
            <li><strong>Berichtigung (Art. 16):</strong> Recht auf Berichtigung unrichtiger Daten. / Right to rectification.</li>
            <li><strong>Löschung (Art. 17):</strong> Recht auf Löschung Ihrer Daten. / Right to erasure (&quot;right to be forgotten&quot;).</li>
            <li><strong>Einschränkung (Art. 18):</strong> Recht auf Einschränkung der Verarbeitung. / Right to restriction.</li>
            <li><strong>Datenübertragbarkeit (Art. 20):</strong> Recht auf Herausgabe Ihrer Daten in maschinenlesbarem Format. / Right to data portability.</li>
            <li><strong>Widerspruch (Art. 21):</strong> Recht auf Widerspruch gegen die Verarbeitung. / Right to object.</li>
          </ul>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', marginTop: '1rem' }}>
            Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{' '}
            <a href="mailto:info@pretzelprep.com">info@pretzelprep.com</a>
          </p>
        </section>

        {/* ── 8. Beschwerderecht ───────────────────────────────────────── */}
        <Section
          title="8. Beschwerderecht / Right to Lodge a Complaint"
          de="Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die zuständige Behörde ist in der Regel die des Bundeslandes, in dem Sie wohnen oder in dem der Verantwortliche seinen Sitz hat. Eine Liste aller deutschen Aufsichtsbehörden finden Sie unter: https://www.bfdi.bund.de"
          en="You have the right to lodge a complaint with a supervisory authority. A list of German data protection authorities is available at: https://www.bfdi.bund.de"
        />

        <p className="pp-hint" style={{ marginTop: '3rem', borderTop: '1px solid var(--color-hairline)', paddingTop: '1rem' }}>
          Stand / Last updated: April 2026 · Diese Datenschutzerklärung wird bei Bedarf aktualisiert.
        </p>
      </div>
    </div>
  );
}
