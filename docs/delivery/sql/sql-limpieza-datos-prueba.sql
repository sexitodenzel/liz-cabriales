-- Limpieza de datos de prueba que quedaron publicados en la tienda.
-- YA EJECUTADO en Supabase el 2026-08-06. Se deja en el repo como registro
-- (y por si hay que repetirlo en otro entorno). Es idempotente.
--
-- Contexto: al construir el buscador unificado aparecieron dos productos de
-- prueba activos y visibles para las clientas, y una subcategoría basura que
-- existía solo porque uno de ellos la tenía asignada. La subcategoría se
-- colaba como sugerencia del autocompletado.
--
-- Criterio: los productos se dan de baja con SOFT delete (deleted_at), la
-- misma semántica que usa el panel en `softDeleteAdminProduct()`. Nada se
-- borra de verdad: para revivir uno, `UPDATE products SET deleted_at = NULL`.

-- 1) Productos de prueba fuera del catálogo público.
--    'agua-prueba'       — $1, sin imágenes, marca "aashta"     (09-jun-2026)
--    'testeo developers' — $100, sin imágenes, marca "Alfatech"
UPDATE products
SET deleted_at = NOW()
WHERE name IN ('agua-prueba', 'testeo developers')
  AND deleted_at IS NULL;

-- 2) El producto de prueba apuntaba a una subcategoría inexistente ("na"):
--    se desreferencia antes de borrarla para no dejar el campo colgando.
UPDATE products
SET subcategory = NULL
WHERE lower(subcategory) = 'na';

-- 3) Fuera la subcategoría basura (era la única de 86 con nombre inválido;
--    colgaba de "Acrílicos", junto a "Polímeros").
DELETE FROM subcategories
WHERE slug = 'na';

-- Verificación:
--   SELECT name, deleted_at FROM products
--    WHERE name IN ('agua-prueba','testeo developers');   -- ambos con fecha
--   SELECT count(*) FROM subcategories WHERE slug = 'na'; -- 0
--
-- Nota: el índice del buscador se refresca solo (unstable_cache, 120s +
-- stale-while-revalidate). Para verlo al instante, revalidar el tag
-- "products" desde el panel de admin.
