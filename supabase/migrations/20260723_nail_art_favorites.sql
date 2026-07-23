-- Favoritos Nail Art (estrella), espejo de likes sin contador público.

CREATE TABLE IF NOT EXISTS nail_art_favorites (
  post_id    uuid NOT NULL REFERENCES nail_art_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_nail_art_favorites_user
  ON nail_art_favorites(user_id, created_at DESC);

ALTER TABLE nail_art_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nail_art_favorites_own_read" ON nail_art_favorites;
CREATE POLICY "nail_art_favorites_own_read"
  ON nail_art_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nail_art_favorites_auth_insert" ON nail_art_favorites;
CREATE POLICY "nail_art_favorites_auth_insert"
  ON nail_art_favorites FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM nail_art_posts
      WHERE nail_art_posts.id = nail_art_favorites.post_id
        AND nail_art_posts.is_active = true
        AND nail_art_posts.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "nail_art_favorites_auth_delete" ON nail_art_favorites;
CREATE POLICY "nail_art_favorites_auth_delete"
  ON nail_art_favorites FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE nail_art_favorites IS
  'Posts Nail Art marcados como favoritos por el usuario (wishlist / estrella)';
