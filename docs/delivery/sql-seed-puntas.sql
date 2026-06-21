-- Seed: contenedores para puntas.
-- Crea la categoría "Puntas" y sus 3 subcategorías por material.
-- No mete productos — eso lo hace la dueña desde el admin.
-- Idempotente: corre cuantas veces quieras.

-- 1) Categoría "Puntas"
INSERT INTO categories (name, slug)
VALUES ('Puntas', 'puntas')
ON CONFLICT (slug) DO NOTHING;

-- 2) Subcategorías por material, debajo de "Puntas"
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Diamante', 'diamante'),
  ('Carburo',  'carburo'),
  ('Silicona', 'silicona')
) AS v(name, slug)
WHERE c.slug = 'puntas'
ON CONFLICT DO NOTHING;
