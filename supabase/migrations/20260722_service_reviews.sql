-- Reseñas del módulo de servicios (estudio).
-- Cualquier usuaria autenticada puede enviar una reseña.
-- is_approved DEFAULT FALSE → queda pendiente hasta que el admin la apruebe.

CREATE TABLE IF NOT EXISTS service_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_approved BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_approved
  ON service_reviews(is_approved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_reviews_user
  ON service_reviews(user_id);

ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_reviews_public_read" ON service_reviews;
CREATE POLICY "service_reviews_public_read"
  ON service_reviews FOR SELECT
  USING (is_approved = TRUE);

DROP POLICY IF EXISTS "service_reviews_own_read" ON service_reviews;
CREATE POLICY "service_reviews_own_read"
  ON service_reviews FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_reviews_auth_insert" ON service_reviews;
CREATE POLICY "service_reviews_auth_insert"
  ON service_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_reviews_own_update" ON service_reviews;
CREATE POLICY "service_reviews_own_update"
  ON service_reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_reviews_admin_all" ON service_reviews;
CREATE POLICY "service_reviews_admin_all"
  ON service_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

COMMENT ON TABLE service_reviews IS
  'Reseñas públicas del estudio en /servicios; requieren aprobación admin.';

COMMENT ON COLUMN service_reviews.is_approved IS
  'FALSE = pendiente o rechazada/oculta; TRUE = visible en /servicios.';
