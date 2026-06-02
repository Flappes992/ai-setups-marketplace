-- Stripe Connect: each creator can have a stripe_account_id (Express)
-- charges_enabled/payouts_enabled mirror the Stripe state so app can gate uploads/checkout.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_onboarded_at timestamptz;
