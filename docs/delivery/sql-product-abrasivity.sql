-- Clasificación de abrasividad para puntas (código de cinta).
-- extra-suave = amarilla, suave = roja, media = azul, fuerte = verde.
-- NULL para productos a los que no aplica (esmaltes, herramientas, cursos, etc.).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS abrasivity TEXT;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_abrasivity_check;

ALTER TABLE products
  ADD CONSTRAINT products_abrasivity_check
  CHECK (abrasivity IN ('extra-suave', 'suave', 'media', 'fuerte'));

COMMENT ON COLUMN products.abrasivity IS
  'Nivel de abrasividad para puntas (código de cinta): extra-suave=amarilla, suave=roja, media=azul, fuerte=verde. NULL si no aplica.';

CREATE INDEX IF NOT EXISTS idx_products_abrasivity
  ON products (abrasivity)
  WHERE abrasivity IS NOT NULL;
