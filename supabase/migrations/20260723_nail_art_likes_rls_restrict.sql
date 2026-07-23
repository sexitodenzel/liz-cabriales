-- Restringe SELECT en nail_art_likes: ya no es público.
-- El conteo agregado sigue en nail_art_posts.likes_count (público vía posts).
-- Toggle de likes: /api/nail-art/likes (service role).

DROP POLICY IF EXISTS "nail_art_likes_public_read" ON nail_art_likes;
DROP POLICY IF EXISTS "nail_art_likes_own_read" ON nail_art_likes;

CREATE POLICY "nail_art_likes_own_read"
  ON nail_art_likes FOR SELECT
  USING (auth.uid() = user_id);
