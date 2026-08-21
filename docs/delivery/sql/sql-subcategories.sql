-- Subcategorías administrables, hijas de categories.
-- Antes vivían solo como texto libre en products.subcategory.
-- Con esta tabla se pueden crear/renombrar/eliminar centralizadas y
-- reusar entre productos. El campo products.subcategory sigue siendo TEXT
-- (nombre denormalizado) para no romper consultas existentes; la integridad
-- la enforza la UI/admin (select dependiente de la categoría).

CREATE TABLE IF NOT EXISTS subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, name),
  UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id
  ON subcategories (category_id);

-- Backfill: pobla la tabla con las subcategorías ya escritas en products.
-- DISTINCT ON (category_id, slug) para colapsar duplicados de capitalización
-- ("Rubber Base" vs "Rubber base") que generan el mismo slug.
-- Como el name que persiste depende del orden, primero priorizamos los
-- "Title Case" (lower(name) <> name → mayúscula presente) sobre los
-- minúsculas, para que el nombre que quede sea el más "presentable".
WITH candidates AS (
  SELECT
    p.category_id,
    TRIM(p.subcategory) AS name,
    regexp_replace(
      regexp_replace(lower(TRIM(p.subcategory)), '\s+', '-', 'g'),
      '[^a-z0-9-]', '', 'g'
    ) AS slug
  FROM products p
  WHERE p.subcategory IS NOT NULL
    AND TRIM(p.subcategory) <> ''
)
INSERT INTO subcategories (category_id, name, slug)
SELECT DISTINCT ON (category_id, slug)
  category_id, name, slug
FROM candidates
WHERE slug <> ''
ORDER BY
  category_id,
  slug,
  -- Preferimos los que tienen al menos una mayúscula como nombre canónico.
  (lower(name) = name) ASC,
  name ASC
ON CONFLICT DO NOTHING;

-- Después del backfill, normaliza el texto en products.subcategory a la
-- versión canónica que quedó en subcategories (por slug). Así dos productos
-- que tenían "Rubber Base" y "Rubber base" terminan con el mismo nombre.
UPDATE products p
SET subcategory = s.name
FROM subcategories s
WHERE p.category_id = s.category_id
  AND p.subcategory IS NOT NULL
  AND TRIM(p.subcategory) <> ''
  AND lower(TRIM(p.subcategory)) = lower(s.name)
  AND TRIM(p.subcategory) <> s.name;
