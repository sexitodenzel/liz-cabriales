-- Modo de interacción de imagen en cards de producto para desktop.
-- carousel: flechas + dots (actual)
-- hover: cambia entre 2 imágenes al pasar el mouse

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS desktop_image_mode TEXT NOT NULL DEFAULT 'carousel';

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_desktop_image_mode_check;

ALTER TABLE products
  ADD CONSTRAINT products_desktop_image_mode_check
  CHECK (desktop_image_mode IN ('carousel', 'hover'));

CREATE INDEX IF NOT EXISTS idx_products_desktop_image_mode
  ON products (desktop_image_mode);

-- Migración de datos existentes:
-- Productos con exactamente 2 imágenes pasarán a modo hover.
UPDATE products
SET desktop_image_mode = 'hover'
WHERE COALESCE(array_length(images, 1), 0) = 2
  AND desktop_image_mode = 'carousel';
