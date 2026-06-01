-- Follows: who follows whom
-- follower_id = the user who initiated the follow
-- following_id = the user being followed

CREATE TABLE IF NOT EXISTS follows (
  follower_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows (following_id);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx  ON follows (follower_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows readable by all"   ON follows;
DROP POLICY IF EXISTS "users can follow"          ON follows;
DROP POLICY IF EXISTS "users can unfollow"        ON follows;

CREATE POLICY "follows readable by all"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);
