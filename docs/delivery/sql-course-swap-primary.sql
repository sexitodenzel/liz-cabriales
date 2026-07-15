-- Cambia el instructor PRINCIPAL de los cursos con panel de ponentes, para que
-- la primera tarjeta sea un maestro real y no "Academia Liz Cabriales".
-- Ejecutar en Supabase SQL Editor. Idempotente. Match por título exacto.
--
-- Deja de mostrar la tarjeta duplicada "Maestro invitado · Academia Liz
-- Cabriales" (esa quedaba porque el principal era el instructor genérico).

-- ── Edición II Seminario Quiro Aesthetic Pedicure → principal: Willy Álvarez ──
UPDATE courses c
SET instructor_id = i.id, updated_at = now()
FROM instructors i
WHERE lower(c.title) = lower('Edición II Seminario Quiro Aesthetic Pedicure')
  AND lower(i.name)  = lower('Willy Álvarez');

-- Quita al nuevo principal de la lista de adicionales (evita duplicado).
DELETE FROM course_instructors ci
USING courses c
WHERE ci.course_id = c.id
  AND lower(c.title) = lower('Edición II Seminario Quiro Aesthetic Pedicure')
  AND ci.instructor_id = c.instructor_id;

-- ── 2ª Master Class 2026 → principal: Lucero Enríquez ───────────────────────
UPDATE courses c
SET instructor_id = i.id, updated_at = now()
FROM instructors i
WHERE lower(c.title) = lower('2ª Master Class 2026')
  AND lower(i.name)  = lower('Lucero Enríquez');

DELETE FROM course_instructors ci
USING courses c
WHERE ci.course_id = c.id
  AND lower(c.title) = lower('2ª Master Class 2026')
  AND ci.instructor_id = c.instructor_id;

-- Verificación:
--   SELECT c.title, i.name AS principal
--   FROM courses c JOIN instructors i ON i.id = c.instructor_id
--   WHERE lower(c.title) IN (
--     lower('Edición II Seminario Quiro Aesthetic Pedicure'),
--     lower('2ª Master Class 2026')
--   );
