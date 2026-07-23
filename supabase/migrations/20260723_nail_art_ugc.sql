-- Nail Art UGC: moderación, autoría editorial y likes.
-- Extiende nail_art_posts y añade nail_art_likes + RLS endurecido.

-- ── Columnas nuevas en nail_art_posts ─────────────────────────────────────
ALTER TABLE nail_art_posts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_display_name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS is_editorial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Posts existentes = editorial aprobada
UPDATE nail_art_posts
SET
  status = 'approved',
  is_editorial = true,
  author_display_name = COALESCE(NULLIF(author_display_name, ''), 'Liz Cabriales')
WHERE is_editorial IS DISTINCT FROM true
   OR author_display_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_nail_art_posts_status_active
  ON nail_art_posts(status, is_active, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nail_art_posts_pending
  ON nail_art_posts(created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_nail_art_posts_user
  ON nail_art_posts(user_id, created_at DESC);

-- ── Likes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nail_art_likes (
  post_id    uuid NOT NULL REFERENCES nail_art_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_nail_art_likes_user
  ON nail_art_likes(user_id, created_at DESC);

-- Contador atómico
CREATE OR REPLACE FUNCTION nail_art_likes_sync_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE nail_art_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE nail_art_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_nail_art_likes_count ON nail_art_likes;
CREATE TRIGGER trg_nail_art_likes_count
  AFTER INSERT OR DELETE ON nail_art_likes
  FOR EACH ROW
  EXECUTE FUNCTION nail_art_likes_sync_count();

-- ── RLS posts ─────────────────────────────────────────────────────────────
ALTER TABLE nail_art_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nail_art_posts_public_read" ON nail_art_posts;
CREATE POLICY "nail_art_posts_public_read"
  ON nail_art_posts FOR SELECT
  USING (is_active = true AND status = 'approved');

DROP POLICY IF EXISTS "nail_art_posts_own_read" ON nail_art_posts;
CREATE POLICY "nail_art_posts_own_read"
  ON nail_art_posts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nail_art_posts_auth_insert" ON nail_art_posts;
CREATE POLICY "nail_art_posts_auth_insert"
  ON nail_art_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND is_editorial = false
    AND is_active = false
  );

DROP POLICY IF EXISTS "nail_art_posts_admin_write" ON nail_art_posts;
CREATE POLICY "nail_art_posts_admin_write"
  ON nail_art_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- ── RLS post_products (lectura solo si el post es público o propio) ───────
ALTER TABLE nail_art_post_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nail_art_post_products_public_read" ON nail_art_post_products;
CREATE POLICY "nail_art_post_products_public_read"
  ON nail_art_post_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nail_art_posts
      WHERE nail_art_posts.id = nail_art_post_products.nail_art_post_id
        AND (
          (nail_art_posts.is_active = true AND nail_art_posts.status = 'approved')
          OR nail_art_posts.user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "nail_art_post_products_auth_insert" ON nail_art_post_products;
CREATE POLICY "nail_art_post_products_auth_insert"
  ON nail_art_post_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nail_art_posts
      WHERE nail_art_posts.id = nail_art_post_products.nail_art_post_id
        AND nail_art_posts.user_id = auth.uid()
        AND nail_art_posts.status = 'pending'
        AND nail_art_posts.is_editorial = false
    )
  );

DROP POLICY IF EXISTS "nail_art_post_products_admin_write" ON nail_art_post_products;
CREATE POLICY "nail_art_post_products_admin_write"
  ON nail_art_post_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- ── RLS likes ─────────────────────────────────────────────────────────────
ALTER TABLE nail_art_likes ENABLE ROW LEVEL SECURITY;

-- SELECT: solo las filas del usuario autenticado (no enumerar quién dio like a qué).
-- El conteo público vive en nail_art_posts.likes_count; toggles van por API + service role.
DROP POLICY IF EXISTS "nail_art_likes_public_read" ON nail_art_likes;
DROP POLICY IF EXISTS "nail_art_likes_own_read" ON nail_art_likes;
CREATE POLICY "nail_art_likes_own_read"
  ON nail_art_likes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nail_art_likes_auth_insert" ON nail_art_likes;
CREATE POLICY "nail_art_likes_auth_insert"
  ON nail_art_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM nail_art_posts
      WHERE nail_art_posts.id = nail_art_likes.post_id
        AND nail_art_posts.is_active = true
        AND nail_art_posts.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "nail_art_likes_auth_delete" ON nail_art_likes;
CREATE POLICY "nail_art_likes_auth_delete"
  ON nail_art_likes FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON COLUMN nail_art_posts.status IS
  'pending = inspiración UGC en revisión; approved = visible; rejected = rechazada';
COMMENT ON COLUMN nail_art_posts.is_editorial IS
  'TRUE = publicada por el estudio (badge Elaborado por Nosotros)';

-- ── Favoritos (estrella / wishlist Nail Art) ──────────────────────────────
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
