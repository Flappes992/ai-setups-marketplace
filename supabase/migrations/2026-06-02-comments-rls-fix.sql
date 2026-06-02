-- Comments RLS were missing/restrictive: comments inserted but not visible on refetch.
-- This fixes by ensuring SELECT is open and INSERT/DELETE are own-only.

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments readable"    ON comments;
DROP POLICY IF EXISTS "users can comment"    ON comments;
DROP POLICY IF EXISTS "users can delete own" ON comments;

CREATE POLICY "comments readable"
  ON comments FOR SELECT USING (true);

CREATE POLICY "users can comment"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
