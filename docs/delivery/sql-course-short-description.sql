-- Descripción breve del curso — ejecutar manualmente en Supabase SQL Editor.
--
-- Contexto:
--   Antes el curso tenía una sola `description`. La dueña pidió poder separar
--   una descripción BREVE (el gancho corto que va con el flyer) de la LARGA
--   (el detalle completo). Esta columna guarda la breve; es opcional.
--
--   Dónde se usa:
--     - Banner del curso y tarjeta del listado usan `short_description` si existe;
--       si está vacía, caen al recorte automático de `description` (compatibilidad
--       hacia atrás con los cursos que ya existen).
--     - El cuerpo "Sobre el taller" siempre muestra `description` (la larga).
--
-- Idempotente.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS short_description TEXT;

ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS courses_short_description_length;

ALTER TABLE courses
  ADD CONSTRAINT courses_short_description_length
  CHECK (short_description IS NULL OR char_length(short_description) <= 300);

COMMENT ON COLUMN courses.short_description IS
  'Descripción breve (gancho corto) del curso. Opcional; si es null se usa un recorte de description.';

-- Verificación:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'courses' AND column_name = 'short_description';
