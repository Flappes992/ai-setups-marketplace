# Setiq — App Store Connect Einreichung (copy-paste-fertig)

Stand 2026-06-09. Alles hier ist vorbereitet → bei der Apple-Einreichung (Phase 7) nur noch
einfügen. Felder, die du noch finalisieren musst, sind mit ⚠️ markiert.

---

## 1. App-Identität

| Feld | Wert |
|---|---|
| **Name** | Setiq |
| **Untertitel** (max 30 Z.) | `AI-Setups entdecken & kaufen` |
| **Bundle ID** | `com.setiq.app` ⚠️ (nach 1. Einreichung PERMANENT — jetzt ändern, falls gewünscht) |
| **Primär-Kategorie** | Produktivität |
| **Sekundär-Kategorie** | Einkaufen (Shopping) |
| **Sprache (primär)** | Deutsch |
| **Preis** | Gratis (Käufe laufen extern über Stripe) |
| **Verfügbarkeit** | ⚠️ NUR EU-Storefronts (Modell A, Phase 0) |

---

## 2. Store-Texte

**Werbetext** (Promotional, max 170 Z., jederzeit änderbar):
```
Entdecke geniale AI-Setups im Feed: Custom GPTs, Prompt-Stacks und fertige
Automations-Workflows von echten Creatorn. Finden, kaufen, sofort nutzen.
```

**Beschreibung** (max 4000 Z.):
```
Setiq ist der Marktplatz für sofort einsetzbare AI-Setups.

Statt stundenlang Prompts zu basteln oder Automationen von null aufzubauen,
entdeckst du im vertikalen Feed fertige Setups von Creatorn, die wissen, was
funktioniert – und nutzt sie in Minuten.

WAS DU FINDEST
• Custom GPTs für konkrete Aufgaben
• Prompt-Stacks, die wirklich liefern
• n8n- & Make-Workflows zum Direkt-Import
• Claude- & ChatGPT-Setups für Alltag, Business und Content

WIE ES FUNKTIONIERT
• Im Feed swipen und entdecken – wie gewohnt, nur produktiv
• Setups liken, speichern, kommentieren
• Mit einem Tap kaufen, sofort Zugriff
• Creatorn folgen und nichts mehr verpassen

FÜR CREATOR
• Lade deine besten Setups hoch und verdiene mit
• Faire Auszahlung über Stripe
• Reichweite ohne eigene Audience

Setiq bringt die, die mit AI schon weit sind, mit denen zusammen, die schnell
Ergebnisse wollen. Win-win.

Käufe werden über unseren Zahlungsdienstleister Stripe abgewickelt.
```

**Keywords** (max 100 Z., kommagetrennt, keine Leerzeichen):
```
ai,ki,prompts,chatgpt,gpt,claude,automation,n8n,workflow,setup,creator,marktplatz,produktiv
```

**URLs:**
| Feld | Wert |
|---|---|
| Support-URL | `https://web-checkout-sicci-s-projects.vercel.app/impressum` ⚠️ (→ setiq.net wenn live) |
| Marketing-URL | (optional) — `https://setiq.net` sobald live |
| Datenschutz-URL | `https://web-checkout-sicci-s-projects.vercel.app/datenschutz` |

---

## 3. Alterseinstufung
UGC ohne Vorab-Moderation (Report/Block vorhanden) → bei Apples Fragebogen ehrlich angeben:
„User-Generated Content" = Ja. Erwartetes Rating: **17+**. Report-Funktion + Block + Admin-
Moderation erfüllen Apple 1.2 (UGC-Safeguards).

---

## 4. App Privacy / „Nutrition Labels"
Muss zur Datenschutzerklärung passen. Tracking (Cross-App/Ads): **NEIN**.
Datenarten, die Setiq sammelt (alle „mit Identität verknüpft", Zweck „App-Funktionalität"):

| Datenart (Apple-Kategorie) | Konkret | Zweck |
|---|---|---|
| Kontaktdaten → E-Mail | Login/Account (Supabase Auth) | App-Funktion, Account |
| Identifikatoren → User-ID | Account-Zuordnung | App-Funktion |
| Nutzerinhalte → Fotos/Videos | Setup-Videos, Profilbild (Upload) | App-Funktion |
| Nutzerinhalte → andere Inhalte | Setups, Kommentare, Reviews, Nachrichten | App-Funktion |
| Käufe → Kaufhistorie | gekaufte Setups | App-Funktion |
| Nutzungsdaten → Produktinteraktion | Likes/Saves/Views (optional angeben) | App-Funktion |

Hinweis Zahlungsdaten: Kreditkarten-/Zahlungsdaten werden **von Stripe** erhoben/verarbeitet,
nicht von Setiq gespeichert → bei Setiq nur „Kaufhistorie" deklarieren.

---

## 5. Review-Infos (App Review Information)

**Demo-Account** ⚠️ (lege EINEN frischen Test-Account an, der bleibt — nicht löschen!):
```
E-Mail:   ⚠️ <demo@…>
Passwort: ⚠️ <…>
```
Vorab befüllen: ein paar Setups im Feed sichtbar, damit der Reviewer was sieht.

**Review-Notes** (ins Notes-Feld kopieren):
```
Setiq ist ein C2C-Marktplatz für digitale AI-Setups (EU-only Launch).

ZAHLUNG: Käufe werden über einen externen Zahlungsdienstleister (Stripe)
abgewickelt, nicht über In-App-Purchase. Vor jeder Weiterleitung zeigt die App
einen Hinweis, dass der Kauf außerhalb des App Stores erfolgt und Apple nicht
Vertragspartner ist. (External Purchase, EU/DMA.)

TEST EINES KAUFS: Setup im Feed öffnen → „Kaufen" → Hinweis bestätigen →
Stripe-Checkout im Browser. Test-Kreditkarte: 4242 4242 4242 4242, beliebiges
zukünftiges Datum, beliebiger CVC.

UGC-MODERATION: Inhalte können über das „…"-Menü gemeldet und Nutzer blockiert
werden. Es gibt ein Admin-Moderations-Dashboard.

ACCOUNT-LÖSCHUNG: Einstellungen → ganz unten „Account löschen" → endgültige,
DSGVO-konforme Löschung/Anonymisierung (Apple 5.1.1(v)).

KONTAKT: setiq.marketplace@gmail.com
```

---

## 6. Screenshots (Plan — du nimmst sie auf)
Pflicht (Apple, Stand 2026): **iPhone 6.9"/6.7"** (z.B. 1320×2868 oder 1290×2796).
6.5"/5.5" optional. **iPad NUR falls iPad-Support an bleibt — siehe ⚠️ unten.**

Vorschlag 5–6 Shots (vertikal, je 1 Kernbotschaft):
1. Feed mit Setup („Entdecke fertige AI-Setups")
2. Setup-Detail („Sofort kaufen, sofort nutzen")
3. Such-/Tag-Ansicht („Finde genau dein Thema")
4. Creator-Profil / Upload („Werde Creator, verdiene mit")
5. Bundles oder Reviews („Geprüft von der Community")
6. (optional) Dark-Mode-Shot als Stilmittel

⚠️ **iPad-Entscheidung:** `app.json` hat aktuell `supportsTablet: true` → Apple verlangt dann
zusätzlich iPad-Screenshots + iPad-QA. Für einen phone-first Vertical-Video-Marktplatz empfehle
ich für den Launch `supportsTablet: false` (spart Screenshots + Test). Sag Bescheid, dann stelle
ich's um.

---

## 7. Was technisch noch fehlt (Phase 7, kostet Geld)
- [ ] Apple Developer Program (99 USD/J)
- [ ] `eas init` (braucht deinen Expo-Login) → setzt EAS-Projekt-ID in app.json
- [ ] Production-Build via `eas build -p ios`
- [ ] External-Purchase-Entitlement beantragen
- [ ] Diese Inhalte in App Store Connect eintragen + einreichen
