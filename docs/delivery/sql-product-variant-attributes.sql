-- Atributos visuales para presentaciones (color/talla) y campo de aplicación
-- en productos. Habilita la página de detalle estilo Chanel con bolitas de
-- color, pills de talla, chip de edición limitada y la sección
-- "Aplicación / Tamaño" del acordeón.

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS color_hex TEXT,
  ADD COLUMN IF NOT EXISTS color_name TEXT,
  ADD COLUMN IF NOT EXISTS size_label TEXT,
  ADD COLUMN IF NOT EXISTS is_limited_edition BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_color_hex_check;

ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_color_hex_check
  CHECK (color_hex IS NULL OR color_hex ~* '^#[0-9a-f]{6}$');

COMMENT ON COLUMN product_variants.color_hex IS
  'Color hex (#RRGGBB) para renderizar la bolita en la página de producto. NULL si la variante no tiene color visible.';
COMMENT ON COLUMN product_variants.color_name IS
  'Nombre legible del color, ej. CRISTALLINE. Mostrado al lado de la bolita seleccionada.';
COMMENT ON COLUMN product_variants.size_label IS
  'Etiqueta de tamaño / presentación, ej. "13 ml", "M", "100 g".';
COMMENT ON COLUMN product_variants.is_limited_edition IS
  'Marca la presentación como edición limitada (chip en la tienda).';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS application_text TEXT;

COMMENT ON COLUMN products.application_text IS
  'Texto enriquecido para la sección Aplicación / Tamaño del acordeón en la página de producto.';
