-- Reseñas de productos con estrellas
-- Solo clientas con compra verificada (order_item del producto en una orden
-- pagada, no cancelada) pueden calificar y comentar. Una reseña por usuaria
-- por producto. is_approved permite moderar desde el panel admin sin borrar.

CREATE TABLE product_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_approved BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id, is_approved);
CREATE INDEX idx_product_reviews_user    ON product_reviews(user_id);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Lectura pública solo de reseñas aprobadas
CREATE POLICY "product_reviews_public_read"
  ON product_reviews FOR SELECT
  USING (is_approved = TRUE);

-- La autora puede ver su propia reseña aunque esté oculta
CREATE POLICY "product_reviews_own_read"
  ON product_reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Insertar solo con compra verificada: order_item del producto dentro de una
-- orden propia ya pagada (cualquier estado posterior a 'pending' excepto
-- 'cancelled' implica pago aprobado en este flujo).
CREATE POLICY "product_reviews_verified_insert"
  ON product_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = product_reviews.product_id
        AND o.user_id = auth.uid()
        AND o.status IN ('paid', 'awaiting_shipping_payment', 'shipping_paid', 'shipped', 'delivered')
    )
  );

-- La autora puede editar su reseña
CREATE POLICY "product_reviews_own_update"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins: acceso total (moderación)
CREATE POLICY "product_reviews_admin_all"
  ON product_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
