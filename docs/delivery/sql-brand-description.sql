-- Descripción editable por marca (se muestra en /tienda al filtrar por esa marca).
-- Idempotente.

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN brands.description IS
  'Texto descriptivo de la marca que aparece como header en /tienda cuando se filtra solo por esta marca.';
