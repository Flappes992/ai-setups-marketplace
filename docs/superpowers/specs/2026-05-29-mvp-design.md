# AI-Setups Marketplace — MVP Design Spec

**Datum:** 2026-05-29
**Status:** Draft, Review pending
**Working Title:** `AI-Setups Marketplace` (Final-Name TBD)
**Autor:** Sicci + Claude

> ⚠️ **Annahme-Marker:** Stellen mit `🟡 ANNAHME` markieren Defaults, die ich gesetzt habe und die du beim Review bestätigen oder ändern musst.

---

## 1. Vision & Scope

**Eine-Satz-Vision:** TikTok-Style Discovery-Plattform für AI-Setups, auf der Hobby-Bastler/ChatGPT-Power-User Setups anderer Creator entdecken, klonen oder als PDF/Video-Tutorial kaufen können — Creator monetarisieren, Plattform verdient Provision.

**Win-Win-Win-Logik (das eigentliche Wertversprechen):**
- **Käufer** (Anfänger / Inspiration-Suchende): Bekommen geballte Inspiration und sofort umsetzbare Setups von Leuten, die's schon gebaut haben — ohne stundenlange Eigen-Recherche und ohne Risiko, auf Scam-Kurse reinzufallen. Schnellster Weg vom „Ich will mit AI starten" zum „Ich nutze AI produktiv".
- **Creator** (AI-Power-User): Monetarisieren ihr Setup-Wissen direkt, ohne eigenen Funnel / eigene Website / eigene Reichweite aufbauen zu müssen. Plattform liefert Discovery und Payment.
- **Plattform** (Sicci): Wächst mit beiden Seiten via Provision. Erfolg nur wenn beide Seiten Wert sehen.

Diese Win-Win-Win-Logik ist Nordstern für jede Produkt-Entscheidung: Wenn ein Feature eine der drei Seiten benachteiligt, ist's wahrscheinlich falsch.

**MVP-Scope-Grenze:** C2C-Marketplace mit Video-Feed + Setup-Detail-Page + Stripe-Checkout. B2B-Vertikal, internationale Sprachen und Advanced-Features explizit später.

**Was Erfolg im MVP heißt:**
- 🟡 ANNAHME: 50 aktive Setups im Feed, 10 zahlende Creators, 100 Käufe insgesamt, ~500 € durchgesetztes Volume innerhalb von 3 Monaten nach Launch. Wenn unter 30 % davon erreicht → Pivot nötig.

---

## 2. Persona & Cold-Start

**Primärer Seed-Käufer:** Hobby-Bastler, 18-35, DE, nutzt ChatGPT/Claude täglich, will Custom-GPTs / Prompt-Stacks / kleine Workflows entdecken. Tickets 15-50 €.

**Cold-Start-Strategie:**
- **5-10 Founding-Creators** aus DE-AI-Twitter/TikTok/Insta-Bubble (Sicci-Recruitment)
- Founding-Bonus: **95 %** Revenue-Share statt **90 %** für die ersten 12 Monate
- Zusätzlich: 10 selbst-erstellte Seed-Setups (Sicci), damit Feed bei Launch nicht leer
- Discovery-Kanäle: Founding-Creators bringen Audience, TikTok/Insta-Eigenmarketing, Reddit-DE-AI-Communities

---

## 3. MVP Feature Cut

### Drin (V1)

| Feature | Warum |
|---|---|
| **Email + Google Sign-In** | Niedrigste Hemmschwelle, Stripe braucht eh verifizierte Email |
| **Video-Feed (vertikal, swipe up/down)** | Kern der Discovery, TikTok-Format |
| **Right-Swipe → Setup-Detail-Page** | Conversion-Funnel von Discovery zu Kauf |
| **Setup-Detail mit zwei Asset-Typen** | Hybrid wie besprochen: klonbar ODER PDF+Video-Tutorial |
| **Creator-Profil-Seite** | Trust + Cross-Setup-Discovery |
| **Setup-Upload-Flow (Creator)** | Video + Title + Description + Asset + Preis |
| **Stripe Connect Checkout (Web)** | Käufe via in-App-Browser, kein Apple-Cut |
| **Asset-Delivery nach Kauf** | Automatischer Download/Clone-Link via Email + In-App |
| **Like + Save** | Engagement-Signal, billig zu bauen, wichtig für Retention |
| **Report-Funktion** | Trust-Layer V1 (Scam/Misuse/Spam) |
| **Basic Text-Suche** | Findbarkeit für gezielte Suche |
| **Transactional Email** | Signup, Kaufbestätigung, Asset-Delivery, Report-Updates |

### Raus (V1.5+ / V2)

| Feature | Warum raus |
|---|---|
| Push Notifications | Tricky bei iOS/Android Setup, später wenn Engagement-Daten zeigen, dass nötig |
| Follow Creator + Following-Feed | Erst wenn Creator-Mass kritisch |
| Comments + In-App-Messaging | Moderations-Aufwand, Trust-Risiko |
| Subscriptions / Abos | One-Time-Sales first, Abos sind eigenes Modell |
| Advanced Discovery-Filter | Kommt mit Skala, nicht für 50 Setups |
| Creator-Analytics-Dashboard | Erst wenn Creators sich beschweren, dass sie nichts sehen |
| **B2B-Vertikal** | Komplett separates Produkt, Phase 2 |
| Multi-Lingual (EN) | DE-First, EN nach Product-Market-Fit |
| Algorithmic Feed (For-You) | V1 ist chronologisch + Random + Like-Boost. ML-Algo später |

---

## 4. Architektur

### Tech-Stack

```
┌─────────────────────────────────────────┐
│ Mobile App (Expo / React Native)        │
│ iOS + Android, OTA-Updates              │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│ Supabase                                │
│ ─ Postgres (Daten)                      │
│ ─ Auth (Email + Google OAuth)           │
│ ─ Storage (Setup-Assets, PDFs)          │
│ ─ Edge Functions (Webhooks, Async-Jobs) │
│ ─ Row-Level-Security (RLS)              │
└──────┬─────────────────────┬────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌──────────────┐     ┌─────────────────┐
│ Mux/CF Stream│     │ Stripe Connect  │
│ Video-Host   │     │ Payments + KYC  │
└──────────────┘     └─────────────────┘
```

### Daten-Modell (Entities)

| Entity | Felder (Kern) |
|---|---|
| **User** | id, email, name, role (consumer\|creator), stripe_account_id?, created_at |
| **Setup** | id, creator_id, title, description, video_url, video_thumbnail, asset_type (clonable\|tutorial_bundle), asset_url, price_cents, currency, status (draft\|review\|live\|removed), tags[], created_at |
| **Purchase** | id, user_id, setup_id, amount_cents, platform_fee_cents, stripe_payment_intent_id, asset_delivered_at, created_at |
| **Like** | user_id, setup_id, created_at (composite key) |
| **Save** | user_id, setup_id, created_at (composite key) |
| **Report** | id, reporter_id, setup_id, reason, details, status (open\|reviewed\|action_taken), created_at |
| **CreatorPayout** | id, creator_id, period_start, period_end, gross_cents, fee_cents, net_cents, stripe_transfer_id, status |

### Datenfluss: Kauf eines Setups (klonbar)

```
1. User tippt im Feed "Kaufen für 25 €" → App öffnet in-App-Browser mit Stripe Checkout URL
2. Stripe Checkout (extern, kein Apple-Cut)
3. Stripe Webhook → Supabase Edge Function: "Purchase erfolgreich"
4. Edge Function:
   - Erstellt Purchase-Row
   - Berechnet Plattform-Fee (10% / 5% Founding)
   - Triggert Stripe Connect Transfer an Creator (-Fee)
   - Generiert signed Asset-URL (Storage Bucket, 7 Tage gültig)
   - Sendet Email mit Asset-Link + In-App-Notification
5. App pollt / lauscht Realtime auf "purchases" Tabelle → zeigt "Asset verfügbar" Button
```

### Datenfluss: Setup-Upload (Creator)

```
1. Creator nimmt Video in der App auf oder lädt hoch
2. Video direkt zu Mux via Direct-Upload-URL (umgeht Backend-Bandwidth)
3. Mux Webhook: "Asset ready" → Supabase Edge Function setzt video_url + thumbnail
4. Creator füllt Title, Description, Preis, Asset-Type, lädt Asset hoch (Storage)
5. Setup-Status: draft → review (Sicci manuelle Freigabe der ersten 200) → live
6. Live-Setups erscheinen im Feed
```

---

## 5. Apple-IAP-Workaround

**Problem:** Apple verlangt für Digital Goods In-App-Purchase → 30 % Cut, killt Provisionsmodell.

**Lösung: "Reader-App"-Modell mit External Checkout**

| Phase | Was passiert |
|---|---|
| In-App-Feed | User sieht Setup, tippt "Mehr Infos" |
| Detail-Page | Zeigt Setup-Info + Preis + "Auf Website kaufen"-Button |
| Tap "Kaufen" | Öffnet **in-App-Browser** (`expo-web-browser` SafariViewController) mit Stripe Checkout URL auf eigener Domain (`checkout.deinedomain.de`) |
| Zahlungsmethoden im Checkout | **Apple Pay**, **Google Pay**, PayPal, Kreditkarte, SEPA, Klarna — alle über Stripe Checkout out-of-box, **0 % Apple-Cut** weil Web-basiert |
| Nach Bezahlung | Browser zeigt Confirmation, schließt sich, App synct via Realtime + Asset-Link erscheint |

**Apple-Compliance-Risiko:** Apple ist bei „Reader-Apps" für UGC-Marketplaces zickig. Wir müssen sauber argumentieren:
- App ist primär **Discovery-Plattform** (UGC-Video-Content)
- Käufe sind **optional** und betreffen Digital-Asset-Lieferung extern
- Kein "Buy"-Button in der App, sondern "Weiter erfahren"-Button der zu externem Web führt

**Plan B falls Apple ablehnt:** Android-only Launch, iOS-Submission iterieren bis Apple OK gibt (übliches Wartespiel, 1-3 Versuche).

✅ ENTSCHIEDEN: Test-Device ist iPhone → iOS-Submission ist Tag-1-Pflicht. External-Checkout-Modell ist nicht mehr „Workaround", sondern fester Architektur-Bestandteil. Plan B (Android-only) gilt nur noch falls Apple nach 3 Einreichungs-Iterationen final ablehnt.

---

## 6. Trust-Layer V1

**Manuelle Setup-Review für die ersten 200 Setups:**
- Sicci reviewt jedes Setup vor Live-Schaltung (Video + Asset checken)
- Dauer: ~5 Min pro Setup → ~16h für 200 Setups, verteilt über erste 2-3 Monate

**Nach jedem Kauf:**
- 5-Sterne-Rating-Prompt nach 24h via Email + In-App
- Optional Textreview (max 280 Zeichen)
- Creator-Rating = Durchschnitt aller Setup-Ratings, angezeigt im Profil

**Report-Funktion:**
- Ein-Klick-Report mit Reason (Scam, Spam, Misuse, Copyright, Andere)
- Bei 3+ Reports auf ein Setup: Auto-Pause + Sicci-Review innerhalb 24h
- Bei Creator mit 2+ removed Setups: Auto-Pause Account

**Refund-Policy:**
- Käufer kann innerhalb 14 Tagen Refund anfragen wenn Setup nicht wie beschrieben
- Refunds gehen über Stripe Standard Process
- Bei wiederholten Refunds gegen einen Creator: Creator-Pause

---

## 7. Provisions-Modell

| Käufer-Typ / Creator-Typ | Plattform-Provision | Creator behält |
|---|---|---|
| Alle Creators (auch Founding) | **10 %** | 90 % |

✅ ENTSCHIEDEN (2026-05-29): Einheitliche 10 %, kein Founding-Bonus. Founding-Creators bekommen stattdessen nicht-monetäre Anreize (z.B. „Founding"-Badge im Profil, optionale Feed-Boosts in den ersten Launch-Wochen) — Details in V1.5-Spec.

**Stripe-Gebühren** (~1,5 % + 0,25 € pro Transaktion in EU): werden **on top** auf den Käuferpreis gerechnet, sodass Creator+Plattform die volle Brutto-Summe teilen. Standard Marketplace-Praxis.

**Mindest-Setup-Preis:** 🟡 ANNAHME: 5 € (verhindert Mikro-Käufe die unter Stripe-Mindestgebühr fallen). Maximum: kein Cap.

**Free-Setups:** Creators können Setups auch kostenlos anbieten (für Reichweite/Reputation). Kein Revenue, aber zählt für Creator-Reputation-Score.

---

## 8. Erfolgs-Kriterien für MVP

**Quantitativ (Ziel: 3 Monate nach Launch):**
- 50+ live Setups
- 100+ Käufe insgesamt
- ~500 € durchgesetztes Brutto-Volume (≈ 50 € Provisions-Einnahme)
- 10+ Creators mit mindestens 1 Verkauf
- Day-7-Retention der Käufer ≥ 20 %

**Qualitativ:**
- 5-Sterne-Rating-Durchschnitt ≥ 4,0
- Refund-Quote ≤ 10 %
- Zero kritische Scam-Vorfälle (alle Reports innerhalb 24h gelöst)
- Apple App-Store-Approval erreicht

**Wenn unter 30 % der Ziele:** Pivot diskutieren — entweder Persona-Wechsel, Asset-Format-Wechsel, oder Plattform-Strategie überarbeiten.

---

## 9. Out-of-Scope (Phase 2+)

Damit klar ist, was bewusst **nicht** im MVP ist:

- B2B-Vertikal (eigene App, eigene Sales-Cycle, eigener Trust-Layer)
- Internationale Sprachen (EN, ES, FR)
- Algorithmischer For-You-Feed (V1 ist chronologisch + Like-Boost)
- Comments / In-App-Messaging zwischen User und Creator
- Subscriptions / Recurring Revenue
- Creator-Analytics-Dashboard
- Native Push Notifications (kommt mit V1.5)
- Following + Following-Feed (kommt mit V1.5)
- Advanced Discovery-Filter (Tool, Preis-Range, Use-Case)
- Affiliate-System (Creators verlinken auf andere Setups gegen Cut)

---

## 10. Annahmen — Review-Status

1. ✅ **Erfolgs-Ziele (Section 1 + 8):** 50 Setups, 100 Käufe, 500 € Volume in 3 Mo. — bestätigt 2026-05-29.
2. ✅ **Apple-Risiko (Section 5):** External-Checkout + iOS-Submission. — bestätigt 2026-05-29.
3. ✅ **Provisionen (Section 7):** 10 % für alle, kein Founding-Bonus. — bestätigt 2026-05-29.
4. ✅ **Mindest-Setup-Preis (Section 7):** 5 €. — bestätigt 2026-05-29.
5. ✅ **Test-Device (Section 5):** iPhone. — bestätigt 2026-05-29.

Alle Annahmen geklärt → bereit für Implementation-Plan via `writing-plans`.

---

## Next Steps nach Review-Approval

1. Spec-Self-Review (Inkonsistenzen, Ambiguität)
2. Implementation-Plan via `writing-plans` Skill (Schritt-für-Schritt was wir wann coden)
3. Erst dann: erste Datei wird geöffnet
