-- Tier system: explorer → hustler → creator
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'explorer'
    CHECK (tier IN ('explorer','hustler','creator')),
  ADD COLUMN IF NOT EXISTS tier_changed_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS profiles_tier_idx ON profiles(tier);

CREATE TABLE IF NOT EXISTS creator_applications (
  user_id    uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  status     text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  note       text,
  decided_at timestamptz,
  decided_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can apply"           ON creator_applications;
DROP POLICY IF EXISTS "users see own application" ON creator_applications;

CREATE POLICY "users can apply"
  ON creator_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users see own application"
  ON creator_applications FOR SELECT
  USING (auth.uid() = user_id);
