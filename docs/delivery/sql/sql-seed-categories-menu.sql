-- Seed: categorías y subcategorías que aparecen en el menú hamburguesa.
-- Refleja el contenido de app/components/navbar/menuData.ts (tiendaCategories).
-- Idempotente: corre cuantas veces quieras.
-- "Cursos" no se siembra como categoría porque su href apunta a /academia.

-- =============================================================================
-- 1) Categorías (16 — orden de la imagen, excepto "Cursos" que va a /academia)
-- =============================================================================
INSERT INTO categories (name, slug)
VALUES
  ('Herramientas',        'herramientas'),
  ('Limas',               'limas'),
  ('Puntas',              'puntas'),
  ('Esmaltes en gel',     'esmaltes-en-gel'),
  ('Builder gel',         'builder-gel'),
  ('Polygel',             'polygel'),
  ('Líquidos',            'liquidos'),
  ('Bioseguridad',        'bioseguridad'),
  ('Nail art',            'nail-art'),
  ('Accesorios',          'accesorios'),
  ('Estructura',          'estructura'),
  ('Electrónicos',        'electronicos'),
  ('Insumos de pestañas', 'insumos-pestanas'),
  ('Producto Podal',      'producto-podal'),
  ('Cuidado de la piel',  'cuidado-piel')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 2) Subcategorías por categoría
-- =============================================================================

-- Limas
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Limas y sponges',              'limas-y-sponges'),
  ('Limas metálicas',              'limas-metalicas'),
  ('Repuestos para lima metálica', 'repuestos-lima-metalica'),
  ('Repuestos para pododisco',     'repuestos-pododisco')
) AS v(name, slug)
WHERE c.slug = 'limas'
ON CONFLICT DO NOTHING;

-- Puntas (solo material — la abrasividad vive en products.abrasivity)
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Carburo',  'carburo'),
  ('Diamante', 'diamante'),
  ('Silicona', 'silicona')
) AS v(name, slug)
WHERE c.slug = 'puntas'
ON CONFLICT DO NOTHING;

-- Esmaltes en gel
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Base',                  'base'),
  ('Top Coat',              'top-coat'),
  ('Color',                 'color'),
  ('Cat Eye (Ojo de gato)', 'cat-eye'),
  ('Reflectivos',           'reflectivos'),
  ('Top Matte',             'top-matte'),
  ('Esmalte',               'esmalte'),
  ('Tintas',                'tintas'),
  ('Vitrales',              'vitrales')
) AS v(name, slug)
WHERE c.slug = 'esmaltes-en-gel'
ON CONFLICT DO NOTHING;

-- Líquidos
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Limpiadores',           'limpiadores'),
  ('Hemostáticos',          'hemostaticos'),
  ('Sanitizantes',          'sanitizantes'),
  ('Preparadores',          'preparadores'),
  ('Monómero',              'monomero'),
  ('Solución para Polygel', 'solucion-polygel'),
  ('Removedor de cutícula', 'removedor-cuticula'),
  ('Acetona',               'acetona'),
  ('Remover Gel',           'remover-gel')
) AS v(name, slug)
WHERE c.slug = 'liquidos'
ON CONFLICT DO NOTHING;

-- Nail art
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Decoraciones',     'decoraciones'),
  ('Glitter',          'glitter'),
  ('Painting gel',     'painting-gel'),
  ('Relieves',         'relieves'),
  ('Cristalería',      'cristaleria'),
  ('Gel moldeador',    'gel-moldeador'),
  ('Gel para textura', 'gel-para-textura'),
  ('Plastilina',       'plastilina'),
  ('Acuarelas',        'acuarelas')
) AS v(name, slug)
WHERE c.slug = 'nail-art'
ON CONFLICT DO NOTHING;

-- Accesorios
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Mobiliario', 'mobiliario'),
  ('Pinceles',   'pinceles')
) AS v(name, slug)
WHERE c.slug = 'accesorios'
ON CONFLICT DO NOTHING;

-- Estructura
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Moldes',    'moldes'),
  ('Tips',      'tips'),
  ('Dual form', 'dual-form'),
  ('Soft Gel',  'soft-gel')
) AS v(name, slug)
WHERE c.slug = 'estructura'
ON CONFLICT DO NOTHING;

-- Cuidado de la piel
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.name, v.slug
FROM categories c
CROSS JOIN (VALUES
  ('Exfoliantes',          'exfoliantes'),
  ('Kits',                 'kits'),
  ('Aceite',               'aceite'),
  ('Mascarilla',           'mascarilla'),
  ('Crema',                'crema'),
  ('Velas para masaje',    'velas-masaje'),
  ('Sales efervescentes',  'sales-efervescentes'),
  ('Bombas efervescentes', 'bombas-efervescentes')
) AS v(name, slug)
WHERE c.slug = 'cuidado-piel'
ON CONFLICT DO NOTHING;
