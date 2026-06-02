CREATE TABLE IF NOT EXISTS blocks (
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS blocks_blocker_idx ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS blocks_blocked_idx ON blocks(blocked_id);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users see own blocks" ON blocks;
DROP POLICY IF EXISTS "users can block"      ON blocks;
DROP POLICY IF EXISTS "users can unblock"    ON blocks;

CREATE POLICY "users see own blocks" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "users can block"      ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "users can unblock"    ON blocks FOR DELETE USING (auth.uid() = blocker_id);
