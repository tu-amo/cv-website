export const metadata = {
  title: 'AGB — Pretzel Prep',
  description: 'Allgemeine Geschäftsbedingungen / Terms of Service für Pretzel Prep.',
  robots: { index: false, follow: false },
};

export default function AGBPage() {
  return (
    <div className="pp-page-card" style={{ maxWidth: '800px' }}>
      <div style={{ padding: '2rem 0 1rem' }}>

        <h1 className="pp-section-heading" style={{ marginTop: 0, marginBottom: '0.5rem' }}>
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>
        <p className="pp-hint" style={{ marginBottom: '0.5rem' }}>
          Terms of Service · Stand / Last updated: April 2026
        </p>
        <p className="pp-hint" style={{ marginBottom: '2.5rem', fontStyle: 'italic' }}>
          Die deutsche Fassung ist rechtlich bindend. · The German version is legally binding.
        </p>

        {/* ── §1 Geltungsbereich ─────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§1 Geltungsbereich / Scope</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Plattform Pretzel Prep
            (pretzelprep.com), betrieben von <strong>Jane Petra Scott</strong> (nachfolgend „Anbieter").
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            These Terms of Service govern the use of the Pretzel Prep platform (pretzelprep.com),
            operated by Jane Petra Scott ("Provider").
          </p>
        </section>

        {/* ── §2 Leistungsbeschreibung ───────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§2 Leistungsbeschreibung / Services</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Pretzel Prep ist eine digitale Plattform zur Verwaltung von Rezepten. Sie bietet:
          </p>
          <ul style={{ lineHeight: 2, paddingLeft: '1.5rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <li>Speichern, Bearbeiten und Teilen von Rezepten</li>
            <li>Haushalt-Sharing (gemeinsame Rezepte innerhalb eines Haushalts)</li>
            <li>Einkaufsliste und Marktplanung</li>
            <li>KI-gestützte Rezeptbilder (optionale Funktion, kostenpflichtig)</li>
            <li>Kostenlose Küchen-Tools: Rezept-Skalierer, Nährwertrechner (ohne Anmeldung nutzbar)</li>
          </ul>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            Pretzel Prep is a digital recipe management platform offering: recipe storage and sharing,
            household collaboration, shopping lists, AI-generated recipe images, and free public tools
            (recipe scaler, nutrition calculator).
          </p>
        </section>

        {/* ── §3 Nutzerkonto ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§3 Nutzerkonto / User Account</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Die Nutzung des vollen Funktionsumfangs setzt die Erstellung eines Nutzerkontos voraus. Der
            Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und sein Konto vor unbefugtem
            Zugriff zu schützen.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            Full platform access requires creating an account. Users must provide accurate information
            and protect their account credentials.
          </p>
        </section>

        {/* ── §4 Nutzerpflichten ─────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§4 Pflichten und Nutzungsregeln / User Obligations</h2>
          <ul style={{ lineHeight: 2, paddingLeft: '1.5rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <li>Keine rechtswidrigen, beleidigenden oder urheberrechtsverletzenden Inhalte hochladen</li>
            <li>Der Nutzer trägt die alleinige Verantwortung für die von ihm eingestellten Inhalte</li>
            <li>Rezepte Dritter dürfen nur mit Genehmigung geteilt werden</li>
            <li>Keine automatisierten Zugriffe oder Scraping ohne Genehmigung</li>
          </ul>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            No illegal, offensive or copyright-infringing content. Users are solely responsible for
            their uploaded content. Third-party recipes may only be shared with permission. No automated
            access or scraping without permission.
          </p>
        </section>

        {/* ── §5 Kostenlose und kostenpflichtige Tarife ─────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§5 Tarife / Plans</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Pretzel Prep bietet kostenlose und kostenpflichtige Tarife an. Einzelheiten zu den
            kostenpflichtigen Tarifen (Preise, Laufzeiten, Zahlungsmodalitäten) werden auf der
            Seite <a href="/upgrade">/upgrade</a> beschrieben und sind integraler Bestandteil dieser AGB.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            Pretzel Prep offers free and paid plans. Details of paid plans (pricing, billing periods,
            payment terms) are described on the <a href="/upgrade">/upgrade</a> page and form part
            of these Terms.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', background: 'var(--color-surface-container)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.75rem' }}>
            💳 <strong>Zahlungskonditionen / Payment Terms:</strong> Werden bei Einführung der kostenpflichtigen
            Tarife ergänzt. / Will be added prior to the launch of paid plans.
          </p>
        </section>

        {/* ── §6 Widerrufsrecht ──────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§6 Widerrufsrecht / Right of Withdrawal</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Bei kostenpflichtigen digitalen Diensten besteht ein gesetzliches Widerrufsrecht von 14 Tagen
            gemäß § 312g BGB. Durch ausdrückliche Zustimmung zur sofortigen Leistungserbringung und
            Kenntnis des damit verbundenen Erlöschens des Widerrufsrechts erlischt dieses Recht mit
            Beginn der Leistungserbringung.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            For paid digital services, a 14-day statutory right of withdrawal applies under § 312g BGB.
            By expressly agreeing to immediate service delivery, the right of withdrawal expires upon
            commencement of the service.
          </p>
        </section>

        {/* ── §7 Haftung ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§7 Haftungsbeschränkung / Limitation of Liability</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Die Haftung des Anbieters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Bei einfacher
            Fahrlässigkeit haftet der Anbieter nur bei Verletzung einer vertragswesentlichen Pflicht.
            Nährwertangaben auf der Plattform dienen lediglich als Information und ersetzen keine
            medizinische oder diätetische Beratung.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            The Provider&apos;s liability is limited to intent and gross negligence. Nutritional information
            on the platform is for informational purposes only and does not constitute medical or
            dietary advice.
          </p>
        </section>

        {/* ── §8 Anwendbares Recht ───────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§8 Anwendbares Recht / Governing Law</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit gesetzlich
            zulässig, der Sitz des Anbieters.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            German law applies. Jurisdiction is, to the extent legally permitted, the Provider&apos;s place
            of business.
          </p>
        </section>

        {/* ── §9 Änderungen ──────────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="legal-section-heading">§9 Änderungen / Amendments</h2>
          <p style={{ lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Der Anbieter behält sich vor, diese AGB mit einer Frist von 30 Tagen zu ändern.
            Änderungen werden per E-Mail mitgeteilt. Die fortgesetzte Nutzung nach Ablauf der Frist
            gilt als Zustimmung.
          </p>
          <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
            The Provider reserves the right to amend these Terms with 30 days&apos; notice via email.
            Continued use after the notice period constitutes acceptance.
          </p>
        </section>

        <p className="pp-hint" style={{ marginTop: '3rem', borderTop: '1px solid var(--color-hairline)', paddingTop: '1rem' }}>
          Stand / Last updated: April 2026 · Jane Petra Scott · info@pretzelprep.com
        </p>
      </div>
    </div>
  );
}
