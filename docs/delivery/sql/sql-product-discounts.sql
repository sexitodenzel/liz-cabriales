-- Sistema de descuentos / ofertas por producto.
-- discount_percent: porcentaje 0-100. NULL o 0 = sin descuento.
-- El precio final se calcula en runtime como base_price * (1 - discount_percent/100).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_discount_percent_check;

ALTER TABLE products
  ADD CONSTRAINT products_discount_percent_check
  CHECK (discount_percent >= 0 AND discount_percent <= 95);

COMMENT ON COLUMN products.discount_percent IS
  'Porcentaje de descuento aplicado al producto (0-95). 0 = sin descuento.';

CREATE INDEX IF NOT EXISTS idx_products_discount_percent
  ON products (discount_percent)
  WHERE discount_percent > 0;
