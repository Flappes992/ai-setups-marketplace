# Setiq E-Mail einrichten — `hi@setiq.net` (Cloudflare Email Routing, gratis)

Ziel: Mails an `hi@setiq.net` landen automatisch in `setiq.marketplace@gmail.com`,
und du kannst aus Gmail heraus *als* `hi@setiq.net` antworten. Kosten: 0 €.

Voraussetzung: Domain `setiq.net` ist registriert.

---

## Schritt 1 — Domain zu Cloudflare bringen

Email Routing braucht, dass Cloudflare deine DNS verwaltet (nicht zwingend, dass die
Domain bei Cloudflare *registriert* ist).

1. Account auf https://dash.cloudflare.com anlegen (gratis).
2. **"Add a site"** → `setiq.net` eingeben → Free-Plan wählen.
3. Cloudflare zeigt dir **2 Nameserver** (z. B. `xxx.ns.cloudflare.com`).
4. Beim Registrar (wo du setiq.net gekauft hast) die **Nameserver** auf diese zwei
   ändern. → DNS-Verwaltung wandert damit zu Cloudflare.
5. Warten bis Cloudflare "Active" zeigt (meist Minuten, max. 24 h).

> Falls du die Domain direkt bei Cloudflare registrierst (Registrar), ist das schon erledigt.

---

## Schritt 2 — Email Routing aktivieren

1. Im Cloudflare-Dashboard die Domain `setiq.net` öffnen.
2. Linkes Menü → **Email** → **Email Routing**.
3. **"Get started" / "Enable Email Routing"** klicken.
4. Cloudflare fügt automatisch die nötigen **MX- und TXT-Records** hinzu
   (einfach bestätigen). Das macht die Domain mail-fähig.

---

## Schritt 3 — Weiterleitung anlegen

1. Tab **"Routing rules"** → **"Create address"**.
2. Custom address: `hi@setiq.net`
3. Action: **Send to** → `setiq.marketplace@gmail.com`
4. Speichern.
5. Cloudflare schickt eine **Verify-Mail** an dein Gmail → Link klicken zum Bestätigen.

> Optional gleich mehrere anlegen: `support@`, `silvio@`, oder eine
> **Catch-all-Regel** ("alles @setiq.net → mein Gmail"). Catch-all ist bequem,
> fängt aber auch Spam an Fantasie-Adressen — für den Start reicht `hi@`.

**Test:** von einer anderen Adresse an `hi@setiq.net` mailen → muss in Gmail ankommen.

---

## Schritt 4 — Aus Gmail *als* `hi@setiq.net` senden (Reply-Identität)

Damit Antworten als `hi@setiq.net` rausgehen, nicht als deine Gmail-Adresse.

> Problem: Gmail "Senden als" will normalerweise einen **SMTP-Server**. Cloudflare
> Routing kann nur empfangen/weiterleiten, **nicht senden**. Zwei Lösungen:

### Variante A — gratis, schnell: SMTP eines Free-Mailers vorschalten
Geht, ist aber fummelig. Für die meisten unnötig. Überspringen, außer du brauchst
unbedingt 100 % "from"-Korrektheit ohne Kosten.

### Variante B — sauber & gratis: Zoho Mail als sendendes Postfach (empfohlen, wenn Senden wichtig)
Dann brauchst du Cloudflare Routing eigentlich nicht mehr — Zoho macht Empfang **und** Senden:
1. https://www.zoho.com/mail/ → **Forever Free Plan** (1 Domain, bis 5 Nutzer).
2. Domain `setiq.net` verifizieren (TXT-Record in Cloudflare DNS eintragen).
3. Zohos **MX-Records** in Cloudflare setzen (ersetzt dann die von Email Routing!).
4. Postfach `hi@setiq.net` anlegen → fertiges Webmail + IMAP/SMTP.
5. In Gmail unter **Einstellungen → Konten → "Senden als" → andere Adresse hinzufügen**
   mit Zohos SMTP (`smtp.zoho.eu`, Port 465, dein Zoho-Login). → Empfangen + Senden
   beides aus Gmail.

---

## Empfehlung / Entscheidung

| Du willst… | Nimm |
|---|---|
| Nur Mails **empfangen** (Kontaktadresse im Impressum), Antworten aus Gmail ist egal | **Cloudflare Email Routing** (Schritt 1–3). 5 Min, 0 €. |
| Auch sauber **als** `hi@setiq.net` **senden** | **Zoho Free** (Variante B). 0 €, etwas mehr Setup. |

Für den Launch reicht **Cloudflare Routing**. Wenn der erste echte Support-Verkehr
kommt und du professionell antworten willst, auf Zoho umziehen.

---

## Schritt 5 — Code zurückdrehen (macht Claude)

Sobald `hi@setiq.net` empfängt, Claude sagen:
> "setiq.net-Mail ist live, dreh legal.ts + Rechtstexte zurück auf hi@setiq.net"

Betroffen: `app/src/config/legal.ts` (`SUPPORT_EMAIL`), `web-checkout/app/impressum/page.tsx`,
`web-checkout/app/datenschutz/page.tsx` (2×). Ein Rutsch, ~2 Min.
