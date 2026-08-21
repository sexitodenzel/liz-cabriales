-- Rol/título del instructor — ejecutar manualmente en Supabase SQL Editor.
--
-- Contexto:
--   La página del curso mostraba un texto fijo "Instructora" debajo del nombre,
--   en femenino y hardcodeado. Con masters hombres (p.ej. Lalo Arroyo) se veía
--   mal. Esta columna guarda el rol/título de cada instructor (p.ej. "Máster",
--   "Educadora certificada", "Director Técnico"). Es opcional; si es null, el
--   sitio usa "Instructor(a)" como respaldo.
--
-- Idempotente.

ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE instructors
  DROP CONSTRAINT IF EXISTS instructors_title_length;

ALTER TABLE instructors
  ADD CONSTRAINT instructors_title_length
  CHECK (title IS NULL OR char_length(title) <= 60);

COMMENT ON COLUMN instructors.title IS
  'Rol o título del instructor (p.ej. "Máster", "Educadora certificada"). Opcional; respaldo "Instructor(a)".';

-- Verificación:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'instructors' AND column_name = 'title';
