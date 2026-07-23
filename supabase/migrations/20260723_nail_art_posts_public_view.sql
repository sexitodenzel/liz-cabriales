-- Vista pública de Nail Art sin user_id (ni campos de moderación).
--
-- Por qué NO usamos security_invoker aquí:
--   Tras quitar nail_art_posts_public_read, anon no pasa RLS de la tabla.
--   La vista debe ejecutarse como dueño (definer) para devolver filas filtradas,
--   pero SOLO con columnas seguras. security_barrier evita que filtros externos
--   lean filas no aprobadas.
--
-- Aplicar en SQL Editor de Supabase.

-- 1) Vista pública (sin user_id, moderated_*, rejection_reason)
DROP VIEW IF EXISTS public.nail_art_posts_public;

CREATE VIEW public.nail_art_posts_public
WITH (security_barrier = true)
AS
SELECT
  id,
  title,
  slug,
  description,
  cover_image,
  is_active,
  sort_order,
  created_at,
  updated_at,
  author_display_name,
  status,
  is_editorial,
  likes_count
FROM public.nail_art_posts
WHERE is_active = true
  AND status = 'approved';

COMMENT ON VIEW public.nail_art_posts_public IS
  'Proyección pública de nail_art_posts: solo posts aprobados/activos, sin user_id ni datos de moderación.';

-- 2) Exponer la vista vía PostgREST (anon / authenticated)
GRANT SELECT ON public.nail_art_posts_public TO anon, authenticated;

-- 3) Quitar SELECT público de la tabla base
--    Sin esta política, anon/authenticated ya no pueden SELECT * y ver user_id.
--    Siguen vigentes: own_read (dueño), admin_write (admin), e insert auth.
DROP POLICY IF EXISTS "nail_art_posts_public_read" ON public.nail_art_posts;

-- Nota: las vistas normales no tienen políticas RLS propias en Postgres.
-- El aislamiento de filas/columnas lo dan el WHERE de la vista + el DROP de
-- nail_art_posts_public_read en la tabla.
