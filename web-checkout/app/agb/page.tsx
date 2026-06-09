import type { Metadata } from 'next';
import { LegalShell, LegalH2 } from '../_legal/LegalShell';

export const metadata: Metadata = {
  title: 'Nutzungsbedingungen (AGB) · Setiq',
  description: 'Allgemeine Geschäfts- und Nutzungsbedingungen der Setiq-Plattform.',
};

export default function AgbPage() {
  return (
    <LegalShell title="Nutzungsbedingungen (AGB)" updated="9. Juni 2026">
      <p>
        Diese Nutzungsbedingungen regeln die Nutzung der Setiq-App und der zugehörigen Dienste
        („Setiq", „Plattform") zwischen dir („Nutzer") und dem Anbieter (siehe{' '}
        <a className="text-[#2DD4BF] hover:underline" href="/impressum">
          Impressum
        </a>
        ). Mit deiner Registrierung erklärst du dich mit diesen Bedingungen einverstanden.
      </p>

      <LegalH2>1. Gegenstand und Rolle der Plattform</LegalH2>
      <p>
        Setiq ist ein Marktplatz, über den Nutzer („Creator") digitale Inhalte rund um KI –
        etwa Custom GPTs, Prompt-Stacks sowie n8n-/Make-Workflows („Setups") – anbieten und andere
        Nutzer („Käufer") diese entdecken und erwerben können. Setiq tritt dabei ausschließlich
        als <strong>Vermittler</strong> auf. Der Vertrag über ein Setup kommt unmittelbar zwischen
        Creator und Käufer zustande; Setiq wird nicht selbst Vertragspartei des Kaufs.
      </p>

      <LegalH2>2. Registrierung und Konto</LegalH2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Für die Nutzung kostenpflichtiger und sozialer Funktionen ist ein Konto erforderlich.</li>
        <li>Du musst mindestens 18 Jahre alt und voll geschäftsfähig sein.</li>
        <li>Deine Angaben müssen wahrheitsgemäß sein; Zugangsdaten sind geheim zu halten.</li>
        <li>Setiq darf Konten bei Verstößen gegen diese Bedingungen sperren oder löschen.</li>
      </ul>

      <LegalH2>3. Verhaltensregeln und nutzergenerierte Inhalte</LegalH2>
      <p className="rounded-lg border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 p-4">
        <strong className="text-white">Null-Toleranz-Politik.</strong> Für anstößige, illegale,
        beleidigende, belästigende oder missbräuchliche Inhalte sowie für missbräuchliches
        Verhalten gegenüber anderen Nutzern besteht <strong>keinerlei Toleranz</strong>. Mit der
        Nutzung von Setiq verpflichtest du dich, keine solchen Inhalte zu veröffentlichen oder zu
        verbreiten und dich anderen Nutzern gegenüber nicht missbräuchlich zu verhalten.
      </p>
      <p>Zur Durchsetzung gilt:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>
          Nutzer können anstößige Inhalte über die <strong>Melde-Funktion</strong> kennzeichnen.
        </li>
        <li>
          Nutzer können missbräuchliche andere Nutzer <strong>blockieren</strong>.
        </li>
        <li>
          Gemeldete anstößige Inhalte werden <strong>innerhalb von 24 Stunden</strong> geprüft und
          – sofern berechtigt – entfernt; der verantwortliche Nutzer kann ausgeschlossen werden.
        </li>
      </ul>
      <p>
        Untersagt sind insbesondere: rechtswidrige Inhalte, Verletzungen von Rechten Dritter
        (Urheber-, Marken-, Persönlichkeitsrechte), Schadsoftware, Spam, Täuschung sowie der Verkauf
        von Inhalten, an denen keine ausreichenden Rechte bestehen.
      </p>

      <LegalH2>4. Rechte an Inhalten</LegalH2>
      <p>
        Du behältst die Rechte an den von dir erstellten Inhalten. Du räumst Setiq ein einfaches,
        weltweites, vergütungsfreies Recht ein, deine Inhalte zum Zweck des Betriebs und der
        Bewerbung der Plattform zu speichern, anzuzeigen und zu vervielfältigen. Als Creator
        sicherst du zu, über alle erforderlichen Rechte an den angebotenen Setups zu verfügen.
      </p>

      <LegalH2>5. Käufe, Preise und Provision</LegalH2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Creator legen die Preise ihrer Setups selbst fest.</li>
        <li>
          Die Zahlungsabwicklung erfolgt über unseren Zahlungsdienstleister Stripe. Es gelten
          ergänzend dessen Bedingungen.
        </li>
        <li>
          Setiq behält je vermitteltem Verkauf eine <strong>Provision in Höhe von 15 %</strong> des
          Verkaufspreises ein; der verbleibende Betrag wird an den Creator ausgezahlt.
        </li>
        <li>
          Für Auszahlungen kann eine Verifizierung des Creator-Kontos bei Stripe erforderlich sein.
        </li>
      </ul>

      <LegalH2>6. Digitale Inhalte und Widerrufsrecht</LegalH2>
      <p>
        Bei den über Setiq angebotenen Setups handelt es sich um digitale Inhalte, die nicht auf
        einem körperlichen Datenträger geliefert werden. Als Verbraucher hast du grundsätzlich ein
        14-tägiges Widerrufsrecht. Dieses <strong>erlischt</strong>, wenn du ausdrücklich
        zustimmst, dass mit der Ausführung vor Ablauf der Widerrufsfrist begonnen wird, und du deine
        Kenntnis vom Verlust des Widerrufsrechts bestätigst (§ 356 Abs. 5 BGB). Mit dem Kauf und
        dem sofortigen Zugriff auf das Setup gibst du diese Zustimmung ab.
      </p>

      <LegalH2>7. Haftung</LegalH2>
      <p>
        Setiq haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach dem
        Produkthaftungsgesetz und bei Verletzung von Leben, Körper oder Gesundheit. Bei einfacher
        Fahrlässigkeit haftet Setiq nur bei Verletzung wesentlicher Vertragspflichten und begrenzt
        auf den vertragstypischen, vorhersehbaren Schaden. Für Inhalte und die Qualität der von
        Creatorn angebotenen Setups übernimmt Setiq als Vermittler keine Gewähr.
      </p>

      <LegalH2>8. Kündigung</LegalH2>
      <p>
        Du kannst dein Konto jederzeit über die App löschen. Setiq kann die Nutzung bei Verstößen
        gegen diese Bedingungen mit sofortiger Wirkung beenden.
      </p>

      <LegalH2>9. Änderungen der Bedingungen</LegalH2>
      <p>
        Setiq kann diese Bedingungen anpassen. Über wesentliche Änderungen informieren wir dich
        rechtzeitig. Widersprichst du nicht innerhalb der genannten Frist, gelten die geänderten
        Bedingungen als angenommen.
      </p>

      <LegalH2>10. Schlussbestimmungen</LegalH2>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
        Zwingende verbraucherschützende Vorschriften deines Aufenthaltsstaates bleiben unberührt.
        Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen
        unberührt.
      </p>
      <p className="text-sm text-gray-500">
        Anbieter: Silvio Castronovo, Auf dem Scheit 10, 55494 Liebshausen
      </p>
    </LegalShell>
  );
}
