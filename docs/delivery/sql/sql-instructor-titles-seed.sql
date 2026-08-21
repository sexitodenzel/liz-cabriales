-- Rol/título (label) de los masters invitados — ejecutar en Supabase SQL Editor.
--
-- Contexto:
--   En la tarjeta de instructor del curso, el label pequeño (antes fijo
--   "Maestro invitado") ahora usa instructors.title. Este script siembra ese
--   título para cada master invitado según la lista oficial que dio Liz.
--
--   - El match es por nombre, sin importar mayúsculas/acentos de capitalización.
--   - Solo actualiza instructores QUE YA EXISTEN. Si un master aún no está
--     creado en la tabla, esa fila simplemente no se toca (no da error).
--   - Idempotente: se puede correr varias veces sin efectos secundarios.
--
--   Requisito previo: la columna instructors.title debe existir
--   (ver docs/delivery/sql-instructor-title.sql).

UPDATE instructors AS i
SET title = v.title
FROM (VALUES
  ('Héctor Alba',       'Podólogo'),
  ('Lore García',       'Podóloga'),
  ('Mirielle Ficacci',  'Pedicurista · máster internacional'),
  ('Liz Togo',          'Máster'),
  ('Lucero Enríquez',   'Máster'),
  ('Diana Gómez',       'Máster'),
  ('Ángela Juárez',     'Ingeniera · máster'),
  ('Lalo Arroyo',       'Máster'),
  ('Willy Álvarez',     'Máster internacional'),
  ('Oksana Makarova',   'Podóloga'),
  ('Meyda Salamanca',   'Pedicurista'),
  ('Yanzy Yáñez',       'Máster'),
  ('Armando Calderón',  'Podólogo'),
  ('Omar Lima',         'Doctor'),
  ('Ayde Hernández',    'Enfermera general'),
  ('Fabiola Guzmán',    'Podóloga')
) AS v(name, title)
WHERE lower(i.name) = lower(v.name);

-- Verificación — revisa que cada master quedó con su label:
--   SELECT name, title
--   FROM instructors
--   WHERE lower(name) IN (
--     'héctor alba','lore garcía','mirielle ficacci','liz togo',
--     'lucero enríquez','diana gómez','ángela juárez','lalo arroyo',
--     'willy álvarez','oksana makarova','meyda salamanca','yanzy yáñez',
--     'armando calderón','omar lima','ayde hernández','fabiola guzmán'
--   )
--   ORDER BY name;
