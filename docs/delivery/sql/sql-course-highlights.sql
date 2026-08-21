-- Distintivos / chips del curso — ejecutar manualmente en Supabase SQL Editor.
--
-- Contexto:
--   La página del curso mostraba un chip fijo "Diploma incluido" en TODOS los
--   cursos (hardcodeado), aunque un curso no diera diploma. Esta migración lo
--   hace configurable por curso con una casilla en el panel admin, y además
--   permite agregar chips libres extra (p.ej. "Kit de materiales", "Coffee
--   break", "Cupo limitado", "Certificado avalado").
--
--   - diploma_included: casilla ON/OFF para el chip "Diploma incluido".
--       DEFAULT true para conservar el comportamiento actual en cursos ya
--       existentes (seguían mostrando "Diploma incluido").
--   - highlights: arreglo de textos cortos; cada uno se pinta como un chip.
--
-- Idempotente.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS diploma_included BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS highlights TEXT[] NOT NULL DEFAULT '{}';

-- Tope defensivo: máximo 6 chips extra y cada uno de ≤ 40 caracteres.
-- Postgres NO permite subqueries dentro de un CHECK, así que la validación va
-- en una función IMMUTABLE (sí permitida en constraints).
CREATE OR REPLACE FUNCTION courses_highlights_valid(arr TEXT[])
  RETURNS BOOLEAN
  LANGUAGE sql
  IMMUTABLE
AS $$
  SELECT coalesce(array_length(arr, 1), 0) <= 6
     AND NOT EXISTS (
       SELECT 1
       FROM unnest(coalesce(arr, '{}'::text[])) AS h
       WHERE char_length(h) > 40
     );
$$;

ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS courses_highlights_limit;

ALTER TABLE courses
  ADD CONSTRAINT courses_highlights_limit
  CHECK (courses_highlights_valid(highlights));

COMMENT ON COLUMN courses.diploma_included IS
  'Casilla admin: muestra el chip "Diploma incluido" en la página del curso.';
COMMENT ON COLUMN courses.highlights IS
  'Chips/distintivos extra del curso (p.ej. "Kit de materiales", "Coffee break"). Máx 6, ≤40 chars c/u.';

-- Verificación:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'courses'
--     AND column_name IN ('diploma_included', 'highlights');
