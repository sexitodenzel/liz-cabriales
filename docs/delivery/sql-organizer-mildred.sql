-- Alta de Mildred Sainz y su asignación como CO-ORGANIZADORA del curso
-- "Técnicas Mixtas: Stamping". Ejecutar en Supabase SQL Editor DESPUÉS de
-- sql-course-instructors.sql y sql-course-instructor-role.sql. Idempotente.

-- 1) Crea a Mildred Sainz (si no existe) con su label "Organizadora".
INSERT INTO instructors (name, title)
SELECT 'Mildred Sainz', 'Organizadora'
WHERE NOT EXISTS (
  SELECT 1 FROM instructors WHERE lower(name) = lower('Mildred Sainz')
);

-- Si ya existía sin título, ponle el label (no pisa un título ya puesto).
UPDATE instructors
SET title = 'Organizadora'
WHERE lower(name) = lower('Mildred Sainz')
  AND (title IS NULL OR title = '');

-- 2) Asígnala como organizadora del curso (rol 'organizer').
DELETE FROM course_instructors ci
USING courses c, instructors i
WHERE ci.course_id = c.id AND ci.instructor_id = i.id
  AND c.title ILIKE 'Técnicas Mixtas: Stamping%'
  AND lower(i.name)  = lower('Mildred Sainz');

INSERT INTO course_instructors (course_id, instructor_id, role, position)
SELECT c.id, i.id, 'organizer', 0
FROM courses c, instructors i
WHERE c.title ILIKE 'Técnicas Mixtas: Stamping%'
  AND lower(i.name)  = lower('Mildred Sainz')
  AND i.id <> c.instructor_id
ON CONFLICT (course_id, instructor_id) DO NOTHING;

-- Verificación (debe devolver 1 fila con role = organizer):
--   SELECT c.title, i.name, ci.role
--   FROM course_instructors ci
--   JOIN courses c     ON c.id = ci.course_id
--   JOIN instructors i ON i.id = ci.instructor_id
--   WHERE lower(i.name) = lower('Mildred Sainz');
