-- Account-Löschung (Apple 5.1.1(v) + DSGVO Art. 17)
-- Markiert anonymisierte Profile. Die eigentliche Lösch-/Anonymisierungs-Logik
-- läuft server-seitig in web-checkout/app/api/delete-account/route.ts (Service-Role).
--
-- Ansatz: Profil-Zeile bleibt als anonymisierter Anker erhalten (referenziert von
-- purchases/removed setups), PII wird gescrubbt. purchases bleiben unangetastet —
-- Stripe ist das Finanz-System-of-Record (GoBD-Aufbewahrung dort).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Optional-Index, um anonymisierte Profile schnell zu filtern (z.B. künftiger Purge-Job).
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles (deleted_at)
  WHERE deleted_at IS NOT NULL;
