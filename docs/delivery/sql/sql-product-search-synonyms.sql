-- Sinónimos de búsqueda por producto.
-- Texto libre separado por comas (ej: "barniz, pintauñas, polish").
-- Se incluye en el filtro OR del endpoint /api/products/search-suggestions
-- y aporta score medio (similar a marca) al ranking.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_synonyms TEXT;

COMMENT ON COLUMN products.search_synonyms IS
  'Sinónimos de búsqueda separados por comas. Permite encontrar el producto cuando la clienta usa palabras distintas al nombre oficial.';
