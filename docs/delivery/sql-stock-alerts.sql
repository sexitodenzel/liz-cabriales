-- Stock Alerts — ejecutar manualmente en Supabase SQL Editor.
-- Suscripciones "Avísame cuando esté disponible" por presentación (variante).

CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'notified', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_alerts_user_variant_pending
  ON stock_alerts (user_id, variant_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS stock_alerts_variant_pending
  ON stock_alerts (variant_id, status)
  WHERE status = 'pending';

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_alerts_select_own"
  ON stock_alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "stock_alerts_insert_own"
  ON stock_alerts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "stock_alerts_update_own"
  ON stock_alerts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
