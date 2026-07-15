-- Alta de los masters del seminario que faltaban + su título (label).
-- Ejecutar en Supabase SQL Editor. Idempotente: si el instructor ya existe
-- (match por nombre, sin importar mayúsculas), no lo duplica ni lo modifica.
--
-- Requisito: la columna instructors.title debe existir
-- (ver docs/delivery/sql-instructor-title.sql).

INSERT INTO instructors (name, title)
SELECT v.name, v.title
FROM (VALUES
  ('Yanzy Yáñez',      'Máster'),
  ('Armando Calderón', 'Podólogo'),
  ('Omar Lima',        'Doctor'),
  ('Ayde Hernández',   'Enfermera general'),
  ('Fabiola Guzmán',   'Podóloga')
) AS v(name, title)
WHERE NOT EXISTS (
  SELECT 1 FROM instructors i
  WHERE lower(i.name) = lower(v.name)
);

-- Verificación:
--   SELECT name, title
--   FROM instructors
--   WHERE lower(name) IN (
--     'yanzy yáñez','armando calderón','omar lima',
--     'ayde hernández','fabiola guzmán'
--   )
--   ORDER BY name;
