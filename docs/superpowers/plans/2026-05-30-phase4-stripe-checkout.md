# Phase 4: Stripe Connect + Web-Checkout + Käufer-Flow — Implementation Plan

**Goal:** Käufer kann auf iPhone ein Setup für Geld kaufen. Bezahlung läuft via Stripe Web-Checkout im in-App-Browser (Apple-IAP-frei). Nach erfolgreicher Zahlung sieht der Käufer den Asset-Link / Download in der SetupDetail-Page. Plattform-Provision (15%) wird automatisch abgezogen via Stripe Connect.

**Architecture:**
- **Stripe Connect Express**: Creator legt einmalig ein Connect-Konto an (KYC durch Stripe), Plattform leitet Zahlungen automatisch durch.
- **Web-Checkout**: kleines Next.js-Projekt (`web-checkout/`), gehostet auf Vercel. Eine Page, die Stripe-Checkout-Session aus URL-Params erstellt und auf Stripe-hosted Checkout redirected.
- **Webhook → Edge Function**: Supabase Edge Function (Deno) empfängt `checkout.session.completed`, legt Purchase-Row an.
- **App**: in-App-Browser (`expo-web-browser`) öffnet Checkout-URL, schließt sich bei success/cancel, App polled Purchase-Status.

**Tech Stack additions:**
- Next.js 15 (für Web-Checkout)
- Stripe Node.js SDK (server-side, in Next.js API route)
- Stripe JS (client-side im Checkout)
- Supabase Edge Functions (Deno) für Webhook
- `expo-web-browser` (in-App-Browser)

**Scope-Exclusions:**
- Creator-Payout-Schedule (Stripe Connect Default reicht V1)
- Refund-Flow (V1.5)
- Apple-IAP-Fallback (kommt erst wenn Apple ablehnt)
- Tax-Handling (Stripe Tax — V1.5)

---

## Task 0: Stripe + Vercel Account (Sicci)

**Stripe:**
1. https://stripe.com → Sign up (Email reicht)
2. Dashboard → links unten **„Test mode"** aktiv lassen
3. Dashboard → **Developers** → **API keys** → kopier mir:
   - **Publishable key** (`pk_test_...`)
   - **Secret key** (`sk_test_...`) — den **NUR** in den Chat schicken, nirgendwo committen
4. Dashboard → **Connect** → **Get started** → Standard-Onboarding aktivieren

**Vercel:**
1. https://vercel.com → Sign up (GitHub-Login am schnellsten)
2. Account ist genug — Project legen wir später via CLI an

Sag wenn beides done + paste die 2 Stripe-Keys.

---

## Task 1: Purchases-Tabelle in Supabase

```sql
create table public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  setup_id uuid references public.setups(id) on delete cascade not null,
  amount_cents integer not null,
  platform_fee_cents integer not null,
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_purchases_user_setup on public.purchases (user_id, setup_id);

alter table public.purchases enable row level security;

create policy "Purchases: nur eigene lesen"
  on public.purchases for select using (user_id = auth.uid());
```

(Service-Role kann insert/update für Webhook — RLS umgangen mit service-role-key.)

---

## Task 2: web-checkout Next.js Projekt

**Files:**
- Create: `/Users/Sicci/ai-setups-marketplace/web-checkout/`
- `package.json` mit Next.js 15, Stripe SDK, @supabase/supabase-js
- `app/page.tsx` — Checkout-Page mit URL-Params (`?setup_id=...`)
- `app/api/create-checkout-session/route.ts` — POST endpoint, erstellt Stripe Session
- `app/success/page.tsx` — Thank-you-Page nach Kauf
- `app/cancel/page.tsx` — Cancel-Page

**Env-Variables** in `web-checkout/.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
SUPABASE_URL=https://nqjcdoufafcgxqiklfil.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...  (vom Supabase Dashboard, NICHT der Anon-Key)
```

---

## Task 3: Vercel Deploy

```bash
cd web-checkout
npx vercel --prod
```

Vercel CLI fragt:
- Project name? → `ai-setups-checkout`
- Production URL kommt zurück, z.B. `https://ai-setups-checkout.vercel.app`
- Env-Variables in Vercel-Dashboard eintragen (gleich wie .env.local)

---

## Task 4: Supabase Edge Function für Webhook

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`

```bash
npx supabase functions new stripe-webhook
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

Webhook validiert Signature, parsed `checkout.session.completed`, insert Purchase-Row mit status='completed'.

**Im Stripe Dashboard:**
- Developers → Webhooks → Add endpoint
- URL: `https://nqjcdoufafcgxqiklfil.supabase.co/functions/v1/stripe-webhook`
- Event: `checkout.session.completed`
- Signing Secret kopieren → in Supabase Edge Function als Env-Var

---

## Task 5: App-Side Stripe Connect Onboarding für Creators

Vor dem ersten Setup-Upload: Creator muss Stripe-Connect-Account anlegen (KYC). Wenn nicht: Upload geblockt mit Hinweis "Verifiziere dich für Auszahlungen".

- ProfileScreen: zeigt Connect-Status. Wenn nicht da, Button "Stripe-Konto verbinden".
- Tap → in-App-Browser öffnet Connect-Onboarding-URL (gehosted von web-checkout/api/create-account-link).
- Nach Onboarding zurück zur App, App polled Status.

---

## Task 6: Kauf-Button in SetupDetail (Käufer-Flow)

- SetupDetail: „Setup holen · 29,00 €" Button → tap → erstellt Pending-Purchase via API → öffnet in-App-Browser mit Checkout-URL
- Browser schließt nach Success/Cancel
- App polled Purchase-Status (`useEffect` mit Interval auf 3 Sek)
- Bei `completed`: Button wird zu „Asset öffnen" / „Download" mit `asset_url` aus Setup

---

## Task 7: Eigene Käufe verwalten

- Profile → „Meine Käufe" → Liste aller `purchases` mit status='completed' → jedes Setup ist anklickbar mit Asset-Link

---

## Task 8: E2E iPhone-Test

1. Stripe Connect: dein eigenes Konto verbinden (Test-Mode, deutsche Adresse, IBAN egal)
2. Auf iPhone: Setup öffnen (nicht deins, weil du dir selbst nicht kaufen kannst)
3. Aber: für Test legen wir Test-Käufer-Account an (2. User auf gleichem Gerät via Logout/SignUp)
4. Kauf-Button → Stripe-Checkout im in-App-Browser
5. Test-Kreditkarte: `4242 4242 4242 4242`, beliebiges Datum, beliebiger CVC
6. „Pay" → Success-Page → Browser schließt
7. SetupDetail: Button wechselt zu „Asset öffnen" → Link funktioniert

---

## Was bewusst NICHT in Phase 4

- Refunds (V1.5)
- Disputes / Chargebacks (kommt automatisch via Stripe, kein App-Code nötig)
- Subscriptions (V2)
- Multi-Currency außer EUR (V1.5)
- Tax-Handling (V1.5)

---

## Risiken & Watchouts

- **Stripe Connect ist heikel:** Onboarding-Flow kann hängen bleiben. Wir testen mit deinem Account first.
- **Webhook braucht stabile URL:** Supabase Edge Functions sind production-stable, OK.
- **Apple-Submission:** für Reviewer brauchen wir Demo-Account + Erklärung warum Web-Checkout (Reader-App-Status).
- **Polling vs Webhook:** App polled Purchase-Status für 30 Sek nach Browser-Close. Wenn Webhook nicht in 30 Sek kommt, User muss Refresh drücken. V1 OK.
