import type { Metadata } from 'next';
import { LegalShell, LegalH2 } from '../_legal/LegalShell';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung · Setiq',
  description: 'Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13/14 DSGVO.',
};

export default function DatenschutzPage() {
  return (
    <LegalShell title="Datenschutzerklärung" updated="9. Juni 2026">
      <p>
        Mit dieser Datenschutzerklärung informieren wir dich über die Verarbeitung deiner
        personenbezogenen Daten bei Nutzung der Setiq-App und der zugehörigen Web-Dienste
        (zusammen „Setiq").
      </p>

      <LegalH2>1. Verantwortlicher</LegalH2>
      <p>
        Verantwortlich im Sinne der DSGVO ist:
        <br />
        Silvio Castronovo
        <br />
        Auf dem Scheit 10, 55494 Liebshausen
        <br />
        E-Mail:{' '}
        <a className="text-[#2DD4BF] hover:underline" href="mailto:setiq.marketplace@gmail.com">
          setiq.marketplace@gmail.com
        </a>
      </p>

      <LegalH2>2. Welche Daten wir verarbeiten</LegalH2>
      <p>Je nach Nutzung verarbeiten wir folgende Kategorien personenbezogener Daten:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>
          <strong>Kontodaten:</strong> E-Mail-Adresse, Benutzername, Anzeigename, Passwort (nur
          verschlüsselt gespeichert), Profilbild.
        </li>
        <li>
          <strong>Inhaltsdaten:</strong> von dir erstellte Setups, Kommentare, Bewertungen,
          Direktnachrichten, Likes und gespeicherte Inhalte.
        </li>
        <li>
          <strong>Transaktionsdaten:</strong> Käufe, Verkäufe und Auszahlungen (Zahlungsdaten
          selbst werden ausschließlich von Stripe verarbeitet, siehe Abschnitt 4).
        </li>
        <li>
          <strong>Nutzungs- und technische Daten:</strong> Geräte- und Log-Informationen, die zur
          Bereitstellung und Absicherung des Dienstes anfallen.
        </li>
      </ul>

      <LegalH2>3. Zwecke und Rechtsgrundlagen</LegalH2>
      <ul className="list-disc space-y-1 pl-6">
        <li>
          Bereitstellung von Konto und Plattformfunktionen sowie Abwicklung von Käufen/Verkäufen
          — <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfüllung).
        </li>
        <li>
          Sicherheit, Missbrauchs- und Betrugsprävention, Moderation gemeldeter Inhalte —{' '}
          <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse).
        </li>
        <li>
          Erfüllung gesetzlicher Pflichten (z. B. steuer- und handelsrechtliche
          Aufbewahrung) — <strong>Art. 6 Abs. 1 lit. c DSGVO</strong>.
        </li>
        <li>
          Optionale Funktionen, in die du ausdrücklich einwilligst — <strong>Art. 6 Abs. 1 lit. a
          DSGVO</strong> (Einwilligung, jederzeit widerrufbar).
        </li>
      </ul>

      <LegalH2>4. Empfänger und Auftragsverarbeiter</LegalH2>
      <p>
        Zur Bereitstellung von Setiq setzen wir sorgfältig ausgewählte Dienstleister ein. Mit
        Auftragsverarbeitern bestehen Verträge nach Art. 28 DSGVO; bei Datenübermittlung in
        Drittländer kommen die EU-Standardvertragsklauseln (SCC) zur Anwendung.
      </p>
      <ul className="list-disc space-y-1 pl-6">
        <li>
          <strong>Supabase</strong> (Authentifizierung, Datenbank, Datei-Speicher) — als
          Auftragsverarbeiter auf Grundlage eines AVV inkl. SCC.
        </li>
        <li>
          <strong>Stripe</strong> (Zahlungsabwicklung und Auszahlungen an Creator). Stripe handelt
          dabei sowohl als eigenständig Verantwortlicher (zur Erfüllung eigener regulatorischer
          Pflichten) als auch als Auftragsverarbeiter. Es gilt zusätzlich die{' '}
          <a
            className="text-[#2DD4BF] hover:underline"
            href="https://stripe.com/de/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Datenschutzerklärung von Stripe
          </a>
          .
        </li>
        <li>
          <strong>Vercel</strong> (Hosting der Web-Dienste, u. a. Checkout) — als
          Auftragsverarbeiter inkl. SCC.
        </li>
        <li>
          <strong>Apple / Google</strong> als Betreiber der App-Stores, soweit du die App über
          ihre Plattformen beziehst und nutzt.
        </li>
      </ul>

      <LegalH2>5. Speicherdauer</LegalH2>
      <p>
        Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke
        erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen. Löschst du deinen
        Account, werden deine Daten gelöscht oder anonymisiert, soweit keine gesetzliche
        Aufbewahrungspflicht entgegensteht.
      </p>

      <LegalH2>6. Deine Rechte</LegalH2>
      <p>Dir stehen nach der DSGVO folgende Rechte zu:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>Auskunft (Art. 15 DSGVO)</li>
        <li>Berichtigung (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
      </ul>
      <p className="rounded-lg border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 p-4">
        <strong className="text-white">Widerspruchsrecht (Art. 21 DSGVO):</strong> Du hast das
        Recht, aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit gegen die
        Verarbeitung deiner Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO Widerspruch
        einzulegen.
      </p>
      <p>
        Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen.
        Zur Ausübung deiner Rechte genügt eine Nachricht an{' '}
        <a className="text-[#2DD4BF] hover:underline" href="mailto:setiq.marketplace@gmail.com">
          setiq.marketplace@gmail.com
        </a>
        .
      </p>

      <LegalH2>7. Beschwerderecht bei der Aufsichtsbehörde</LegalH2>
      <p>
        Unbeschadet anderweitiger Rechtsbehelfe steht dir ein Beschwerderecht bei einer
        Datenschutz-Aufsichtsbehörde zu, insbesondere in dem Mitgliedstaat deines Aufenthaltsorts
        oder des mutmaßlichen Verstoßes.
      </p>

      <LegalH2>8. Änderungen dieser Datenschutzerklärung</LegalH2>
      <p>
        Wir passen diese Datenschutzerklärung an, sobald Änderungen der Dienste oder der
        Rechtslage dies erfordern. Es gilt die jeweils hier veröffentlichte aktuelle Fassung.
      </p>
    </LegalShell>
  );
}
