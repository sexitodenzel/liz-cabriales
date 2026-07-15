-- Asigna los maestros ADICIONALES a los cursos con varios ponentes.
-- Ejecutar en Supabase SQL Editor DESPUÉS de sql-course-instructors.sql.
-- Idempotente: borra y reescribe los adicionales de cada curso.
--
-- El instructor PRINCIPAL de estos dos cursos es "Academia Liz Cabriales"
-- (courses.instructor_id); los de abajo se agregan como adicionales.
--
-- Match por TÍTULO EXACTO a propósito: existe también un "Seminario Quiro
-- Aesthetic Pedicure 2025" y una "1ª Master Class 2026" que NO deben tocarse.
-- Si renombraste algún curso en el panel, ajusta el título aquí.

-- ── 2ª Master Class 2026 ────────────────────────────────────────────────────
DELETE FROM course_instructors ci
USING courses c
WHERE ci.course_id = c.id
  AND lower(c.title) = lower('2ª Master Class 2026');

INSERT INTO course_instructors (course_id, instructor_id, position)
SELECT c.id, i.id, v.position
FROM (VALUES
  ('Lucero Enríquez', 0),
  ('Diana Gómez',     1),
  ('Ángela Juárez',   2)
) AS v(name, position)
JOIN courses c     ON lower(c.title) = lower('2ª Master Class 2026')
JOIN instructors i ON lower(i.name)  = lower(v.name)
WHERE i.id <> c.instructor_id
ON CONFLICT (course_id, instructor_id) DO NOTHING;

-- ── Edición II Seminario Quiro Aesthetic Pedicure ───────────────────────────
DELETE FROM course_instructors ci
USING courses c
WHERE ci.course_id = c.id
  AND lower(c.title) = lower('Edición II Seminario Quiro Aesthetic Pedicure');

INSERT INTO course_instructors (course_id, instructor_id, position)
SELECT c.id, i.id, v.position
FROM (VALUES
  ('Willy Álvarez',    0),
  ('Lore García',      1),
  ('Oksana Makarova',  2),
  ('Meyda Salamanca',  3),
  ('Ángela Juárez',    4),
  ('Yanzy Yáñez',      5),
  ('Armando Calderón', 6),
  ('Omar Lima',        7),
  ('Ayde Hernández',   8),
  ('Fabiola Guzmán',   9)
) AS v(name, position)
JOIN courses c     ON lower(c.title) = lower('Edición II Seminario Quiro Aesthetic Pedicure')
JOIN instructors i ON lower(i.name)  = lower(v.name)
WHERE i.id <> c.instructor_id
ON CONFLICT (course_id, instructor_id) DO NOTHING;

-- ── Verificación (esta vez SÍ debe devolver filas) ──────────────────────────
SELECT c.title AS curso, ci.position AS orden, i.name AS maestro, i.title AS label
FROM course_instructors ci
JOIN courses c     ON c.id = ci.course_id
JOIN instructors i ON i.id = ci.instructor_id
ORDER BY c.title, ci.position;
