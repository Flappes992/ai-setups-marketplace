-- 1. Replies: parent_id on comments
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);

-- 2. Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment likes readable" ON comment_likes;
DROP POLICY IF EXISTS "users can like comment" ON comment_likes;
DROP POLICY IF EXISTS "users can unlike comment" ON comment_likes;

CREATE POLICY "comment likes readable"   ON comment_likes FOR SELECT USING (true);
CREATE POLICY "users can like comment"   ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can unlike comment" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- 3. Reports table
CREATE TABLE IF NOT EXISTS reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('comment','setup','profile')),
  target_id   uuid NOT NULL,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_target_idx ON reports(target_type, target_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can submit reports" ON reports;
DROP POLICY IF EXISTS "users see own reports"    ON reports;

CREATE POLICY "users can submit reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "users see own reports"    ON reports FOR SELECT USING (auth.uid() = reporter_id);
