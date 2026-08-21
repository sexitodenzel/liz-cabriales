-- Rol de cada vínculo curso↔instructor en la tabla puente course_instructors:
--   'master'    → maestro adicional (tarjeta bajo "Maestro invitado")
--   'organizer' → co-organizador (tarjeta bajo "Organiza e imparte", junto a Liz)
-- Ejecutar en Supabase SQL Editor DESPUÉS de sql-course-instructors.sql. Idempotente.

ALTER TABLE course_instructors
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'master';

ALTER TABLE course_instructors
  DROP CONSTRAINT IF EXISTS course_instructors_role_check;

ALTER TABLE course_instructors
  ADD CONSTRAINT course_instructors_role_check
  CHECK (role IN ('master', 'organizer'));

CREATE INDEX IF NOT EXISTS course_instructors_role_idx
  ON course_instructors(course_id, role, position);

-- Verificación:
--   SELECT role, count(*) FROM course_instructors GROUP BY role;
