import type { Metadata } from 'next';
import { LegalShell, LegalH2, Placeholder } from '../_legal/LegalShell';

export const metadata: Metadata = {
  title: 'Impressum · Setiq',
  description: 'Anbieterkennzeichnung gemäß § 5 DDG.',
};

export default function ImpressumPage() {
  return (
    <LegalShell title="Impressum" updated="9. Juni 2026">
      <LegalH2>Angaben gemäß § 5 DDG</LegalH2>
      <p>
        Silvio Castronovo
        <br />
        Auf dem Scheit 10
        <br />
        55494 Liebshausen
        <br />
        Deutschland
      </p>
      <LegalH2>Kontakt</LegalH2>
      <p>
        E-Mail:{' '}
        <a className="text-[#2DD4BF] hover:underline" href="mailto:setiq.marketplace@gmail.com">
          setiq.marketplace@gmail.com
        </a>
      </p>

      <LegalH2>Umsatzsteuer</LegalH2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:{' '}
        <Placeholder>USt-IdNr., falls vorhanden – sonst diesen Absatz entfernen</Placeholder>
      </p>
      <p className="text-sm text-gray-500">
        Sofern die Kleinunternehmerregelung nach § 19 UStG genutzt wird, wird keine
        Umsatzsteuer ausgewiesen.
      </p>

      <LegalH2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</LegalH2>
      <p>
        Silvio Castronovo
        <br />
        Auf dem Scheit 10, 55494 Liebshausen
      </p>

      <LegalH2>EU-Streitschlichtung</LegalH2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
        <a
          className="text-[#2DD4BF] hover:underline"
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
        . Unsere E-Mail-Adresse findest du oben im Impressum.
      </p>

      <LegalH2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</LegalH2>
      <p>
        Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <LegalH2>Haftung für Inhalte</LegalH2>
      <p>
        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
        nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
        Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
        Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
        Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
        Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
      </p>

      <LegalH2>Haftung für Links</LegalH2>
      <p>
        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
        Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
        übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
        Betreiber der Seiten verantwortlich.
      </p>

      <LegalH2>Urheberrecht</LegalH2>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
        dem deutschen Urheberrecht. Von Nutzern bereitgestellte Inhalte („Setups", Kommentare,
        Nachrichten) verbleiben im Eigentum der jeweiligen Urheber.
      </p>
    </LegalShell>
  );
}
