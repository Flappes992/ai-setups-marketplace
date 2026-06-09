# Setiq — Launch-Plan: vom Jetzt bis Apple-Accept

Stand: 2026-06-09. Ausgangslage: App technisch weit (Phase 1–4 + viel Polish), Compliance
großteils gebaut, **noch kein Gewerbe angemeldet, nichts „live" geschaltet**.

**Rechtsform-Entscheidung:** Einzelunternehmen (Kleingewerbe) + Kleinunternehmer §19 UStG, solo.
**Zahlung:** Stripe Connect (du hältst kein Geld → ZAG-safe), 15 % Plattform-Provision.

## Prinzip der Reihenfolge
Alles **Kostenlose zuerst** (Strategie, Code-Polish, Security, Assets, Prep). Alles, was
**Geld kostet oder eine Identität/Anmeldung braucht**, kommt **gebündelt ganz zum Schluss**,
direkt vor der Einreichung. So bindest du erst Geld, wenn alles startklar ist.

⚠️ Hinweis: Keine Rechts-/Steuerberatung. Apple-EU-Gebühren & Plattformpflichten ändern sich —
vor Submission (Phase 7) nochmal gegen die aktuellen Apple-Guidelines verifizieren.

---

## PHASE 0 — Strategie-Entscheidung (0 €, ~1 Gespräch) ← ZUERST  ✅ ENTSCHIEDEN 2026-06-09
**Ergebnis:** Modell A (EU-only + externer Stripe-Checkout). Modell B (IAP) verworfen.
Account-Typ: Individual (Klarname als Seller, später Org-Upgrade). Provisions-Höhe (0.2)
bewusst vertagt → final in Phase 7, sobald exakte Apple-EU-Gebühren bekannt.

- [x] **0.1 Apple-Zahlungsmodell festlegen.** → Modell A. Optionen waren:
  - **A) EU-only-Launch + External-Purchase-Entitlement** (empfohlen für Start): externer
    Stripe-Checkout bleibt, Apple-EU-Gebühren akzeptieren, Verkauf nur in EU-Storefronts.
    Vorteil: dein Stripe-Connect-Stack bleibt, Marge höher als IAP. Nachteil: nur EU-Markt,
    Disclosure-Sheet + Entitlement nötig, Apple-Fees fressen Teil der 15 %.
  - **B) Apple IAP weltweit**: Apple wickelt ab (15 % Small-Business / 30 %). Problem: IAP ist
    **nicht für Auszahlung an Dritt-Verkäufer gebaut** → C2C-Payout-Logik bricht. Faktisch nur,
    wenn DU der Verkäufer bist (kein echter Marktplatz). Für Setiq unrealistisch.
  - → **Empfehlung: A.** Start EU-only, später Org-Account + ggf. IAP-Hybrid für Welt-Launch.
- [ ] **0.2 Marge neu rechnen:** 15 % Provision minus Apple-EU-Cut (CTC 5 % + Store Services Fee
  + 2 % Acquisition) minus Stripe-Gebühren. Prüfen ob 15 % reicht oder auf z.B. 20 % hoch.
- [ ] **0.3 Account-Typ akzeptieren:** Individual-Account → Klarname „Silvio Castronovo" als Seller
  im Store. OK für Launch, später Upgrade auf Organization (Setiq) wenn UG kommt.

---

## PHASE 1 — Code fertigstellen (0 €)
Reine Entwicklungsarbeit, kostet nichts.

- [ ] **1.1 Dark-Mode-Refactor** der ~8 hardcoded-weißen Screens (MySetups, Saved, Liked,
  Purchases, EditProfile, Notifications, SearchScreen, TagFeed, SetupDetail) → `palette.*`.
  Auch `app.json` `userInterfaceStyle` auf `automatic` prüfen.
- [ ] **1.2 MVP-Scope-Cut:** entscheiden was zum Launch MUSS vs. Post-Launch. Kandidaten zum
  Verschieben: Reviews/Sterne, Follow-Layer. (Nicht launch-kritisch → später.)
- [ ] **1.3 External-Purchase-Flow** an Apple-EU-Vorgaben anpassen (Disclosure-Sheet vor
  Weiterleitung zum Stripe-Checkout, wie von Apple verlangt).
- [ ] **1.4 Smoke-Test E2E** mit beiden Test-Accounts: Signup → Feed → Setup ansehen → Kauf
  (Test-Mode) → Purchase erscheint → Creator-Auszahlung. Bug-Liste abarbeiten.

---

## PHASE 2 — Security & Datenschutz-Härtung (0 €)
Vor Live unbedingt — und gratis.

- [ ] **2.1 Secrets-Audit:** keine Service-Role-Keys / Stripe-Secret-Keys im App-Bundle.
  Nur `anon`-Key client-seitig, alles Sensible auf Vercel/Server. `git grep` nach Keys,
  `.env` in `.gitignore` prüfen.
- [ ] **2.2 Supabase-RLS-Audit:** jede Tabelle (profiles, setups, purchases, likes, saves,
  comments, follows, comment_likes, reports, blocks, creator_applications) auf korrekte
  Row-Level-Security. Besonders: kann ein User fremde purchases/Daten lesen/schreiben?
- [ ] **2.3 Stripe-Webhook-Signaturprüfung** aktiv? Webhook-Secret gesetzt? Replay-Schutz?
- [ ] **2.4 `/security-review`** auf den aktuellen Diff laufen lassen + Findings fixen.
- [ ] **2.5 DSGVO-Pflichten:** Datenexport + Account-Löschung (Apple verlangt In-App-Account-
  Löschung, Guideline 5.1.1(v)!). Prüfen ob „Account löschen" existiert — **häufiger Ablehnungsgrund**.

---

## PHASE 3 — Rechtstexte & Plattform-Pflichten finalisieren (0 €)
- [x] **3.1 Impressum/Datenschutz/AGB** mit echten Daten gefüllt (erledigt 2026-06-09).
- [ ] **3.2 AGB Marktplatz-spezifisch prüfen:** Plattform-Rolle (du bist Vermittler, nicht
  Verkäufer), Provisionsklausel, Creator-Bedingungen, Haftungsausschluss für UGC.
- [ ] **3.3 Widerrufsrecht digitale Güter:** Pflicht-Hinweis + Zustimmung zum Verlust des
  Widerrufsrechts bei sofortiger Bereitstellung (§356 BGB). Im Kaufflow einbauen.
- [ ] **3.4 DSA-Pflichten (Digital Services Act):** Melde-/Abhilfeverfahren (hast du via Report),
  Transparenz, ggf. Händler-Rückverfolgbarkeit. Für kleine Plattform leichter, aber Basics prüfen.
- [ ] **3.5 Alterseinstufung** festlegen (UGC → meist 17+ wegen unmoderierter Inhalte; Report/Block
  vorhanden hilft).
- [ ] **3.6 Abmahnsichere Rechtstexte via eRecht24 (o. IT-Recht-Kanzlei).** Schutzpaket abschließen,
  AGB/Datenschutz/Impressum/Widerruf für **Marktplatz mit UGC** generieren und unsere selbst
  gebauten Texte damit ersetzen. Vorteil: anwaltlich gepflegt + **automatische Updates** bei
  Gesetzesänderung → schützt vor Abmahnungen (Marktplatz = beliebtes Abmahn-Ziel).
  ⚠️ Laufende Kosten (~10–30 €/Monat) → Abschluss zusammen mit Phase 6 timen, finale Texte
  aber **vor** der Submission (7.6) live setzen + web-checkout neu deployen.

---

## PHASE 4 — App-Store-Assets & Review-Vorbereitung (0 €)
Alles, was App Store Connect später braucht — jetzt schon bauen.

- [ ] **4.1 App-Icon + Splash** als PNG exportieren (1024² Icon, Splash) aus
  `~/Downloads/setiq-logo/` → in `app/assets/` ersetzen.
- [ ] **4.2 Screenshots** für alle Pflicht-Gerätegrößen (6.7", 6.5", 5.5" iPhone) erstellen.
- [ ] **4.3 Store-Texte:** Name (Setiq), Untertitel, Beschreibung, Keywords, Support-URL,
  Marketing-URL, Datenschutz-URL (= deine /datenschutz-Seite).
- [ ] **4.4 App-Privacy-„Nutrition Labels"** vorbereiten (welche Daten du sammelst: Account,
  Käufe, Nutzungsdaten). Muss zur Datenschutzerklärung passen.
- [ ] **4.5 Demo-Account + Review-Notes** für Apple: funktionierender Login + Test-Kauf-Anleitung.
  **Pflicht** bei Login-Wall + Käufen, sonst Ablehnung.
- [ ] **4.6 EAS-Config:** `ios.bundleIdentifier` (z.B. `net.setiq.app`), `buildNumber`,
  EAS-Projekt anlegen. (EAS-Build-Free-Tier reicht.)

---

## PHASE 5 — Deploy der Web-Komponenten (0 €)
- [ ] **5.1 web-checkout deployen**, damit Legal-Links + Stripe-Endpoints live erreichbar sind
  (Vercel Free, Deployment Protection AUS für Webhooks).
- [ ] **5.2 Verifizieren:** /impressum, /datenschutz, /agb laden öffentlich; Stripe-Endpoints
  antworten.

---

# ───────── AB HIER KOSTET ES GELD / BRAUCHT IDENTITÄT ─────────
# (gebündelt ganz zum Schluss, direkt vor Submission)

## PHASE 6 — Anmeldung & Identität (kostet Geld)
Reihenfolge wichtig: Gewerbe zuerst (Identitätsanker für Stripe-Live & Steuer).

- [ ] **6.1 Gewerbeanmeldung** beim Gewerbeamt (~20–60 €). Tätigkeit: „Betrieb einer
  Online-Plattform / Vermittlung digitaler Produkte". → bekommst Gewerbeschein.
- [ ] **6.2 Fragebogen zur steuerlichen Erfassung** (ELSTER, kostenlos): Kleinunternehmer §19
  ankreuzen → Steuernummer. (USt-IdNr nur falls nötig.)
- [ ] **6.3 Geschäftskonto** (optional, oft kostenlos: Kontist/Finom/N26) für saubere Trennung.
- [ ] **6.4 Domain registrieren** (`setiq.net`, ~10–15 €/Jahr) + Vercel-Alias setzen +
  E-Mail einrichten (siehe `SETIQ_EMAIL_SETUP.md`). Dann `legal.ts` zurück auf `hi@setiq.net`.
- [ ] **6.5 Stripe Live-Mode:** Dashboard-Connect-Setup (Marketplace, Funds-Flow, hosted
  Onboarding), Live-Keys auf Vercel, Webhook neu, Statement-Descriptor „SETIQ", Identität +
  Bankverbindung hinterlegen.

## PHASE 7 — Apple Developer & Submission (kostet Geld)
- [ ] **7.1 Apple Developer Program** beitreten (**99 USD/Jahr**), Individual-Account.
- [ ] **7.2 App Store Connect** App anlegen (Bundle-ID aus 4.6), alle Assets/Texte/Privacy-Labels
  aus Phase 4 eintragen, Verkauf auf **EU-Storefronts** beschränken (Phase 0 Entscheidung A).
- [ ] **7.3 External-Purchase-Entitlement** beantragen (falls Modell A).
- [ ] **7.4 Production-Build** via EAS → App Store Connect hochladen.
- [ ] **7.5 TestFlight** intern: finaler Funktions-Check auf echtem Gerät.
- [ ] **7.6 Einreichen** zur Review. Demo-Account + Review-Notes anhängen.
- [ ] **7.7 Review-Feedback** abarbeiten (mit Rückfragen rechnen — UGC, External-Payment,
  Account-Löschung sind die typischen Stolpersteine).

---

## Kosten-Übersicht (alles am Ende)
| Posten | Kosten | Phase |
|---|---|---|
| Gewerbeanmeldung | ~20–60 € einmalig | 6.1 |
| Domain setiq.net | ~10–15 €/Jahr | 6.4 |
| Apple Developer Program | 99 USD (~92 €)/Jahr | 7.1 |
| Stripe | nur % pro Verkauf, kein Fixum | 6.5 |
| Geschäftskonto / E-Mail-Routing | 0 € (Free-Optionen) | 6.3 / 6.4 |
| **Summe Start** | **~120–170 €** | |

→ Tatsächlicher Kapitaleinsatz bis Launch: **unter 200 €.** Genau dein „wenig Kapital"-Ziel.
(eRecht24 aus Phase 3.6 startet als laufende Kosten → siehe unten.)

---

## Laufende Tools & Kosten (NACH Launch — keine Launch-Blocker)
Bewusst getrennt vom Launch-Block. Alles optional bzw. erst bei echtem Umsatz nötig.
Keine macOS-12/Intel-Probleme — alles Web-SaaS.

| Tool / Posten | Wofür | Kosten | Wann |
|---|---|---|---|
| **eRecht24 / IT-Recht-Kanzlei** | Rechtstexte abmahnsicher + auto-aktuell halten | ~10–30 €/Monat | ab Launch (Phase 3.6) — **empfohlen** |
| **Steuerberater (1× Erstgespräch)** | Marktplatz-Rechnungslogik klären: wer rechnet wem ab (deine 15 % Provision ggü. Creatorn, Creator selbst steuerpflichtig) | oft 0 € Erstberatung | vor erstem echten Umsatz |
| **Lexoffice / sevDesk / Kontist** | Buchhaltung, GoBD-Rechnungen, EÜR, Steuerberater-Export | ~10–20 €/Monat | erst bei echtem Umsatz — Start geht mit Tabelle + Stripe-Reports |
| **Betriebshaftpflicht** | Restrisiko Haftung absichern (Einzelunternehmen = privat haftbar) | paar €/Monat | optional, je nach Risikoappetit |
| **Domain-Verlängerung** | setiq.net | ~10–15 €/Jahr | jährlich |
| **Apple Developer** | Account aktiv halten | 99 USD/Jahr | jährlich |
| **Geschäftskonto** | Trennung privat/geschäftlich | 0 € (Kontist/Finom/N26 Free) | optional |

**Merksatz:** Buchhaltung (Lexoffice) ≠ Rechtstexte (eRecht24). Zwei verschiedene Baustellen.
Lexoffice hält NICHT deine AGB aktuell — das macht eRecht24.
