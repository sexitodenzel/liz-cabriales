-- Maestros adicionales por curso (varios instructores por curso).
-- Ejecutar en Supabase SQL Editor. Idempotente.
--
-- Contexto:
--   courses.instructor_id sigue siendo el instructor PRINCIPAL (obligatorio,
--   usado en correos y vistas de un solo maestro). Esta tabla puente guarda
--   los maestros ADICIONALES que también imparten el curso (p. ej. las Master
--   class con 3 maestras o el seminario con ~9 ponentes).
--
--   El acceso es por service role (igual que course_images), por eso no lleva RLS.

CREATE TABLE IF NOT EXISTS course_instructors (
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (course_id, instructor_id)
);

CREATE INDEX IF NOT EXISTS course_instructors_course_id_idx
  ON course_instructors(course_id);
CREATE INDEX IF NOT EXISTS course_instructors_position_idx
  ON course_instructors(course_id, position);

-- Verificación:
--   SELECT c.title, i.name, ci.position
--   FROM course_instructors ci
--   JOIN courses c     ON c.id = ci.course_id
--   JOIN instructors i ON i.id = ci.instructor_id
--   ORDER BY c.title, ci.position;
