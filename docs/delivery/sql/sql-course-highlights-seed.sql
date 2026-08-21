-- Semilla de ejemplo: pinta chips en un curso para verlos en vivo.
-- Curso "estética de los pies" que estabas viendo en /academia/794a6764-...
--
-- Puedes re-ejecutarlo cuando quieras; solo sobrescribe estos dos campos.

UPDATE courses
SET
  diploma_included = true,
  highlights = ARRAY[
    'Kit de materiales',
    'Práctica en modelo real',
    'Coffee break'
  ]
WHERE id = '794a6764-fc27-41c4-9a66-09c2e098c11f';

-- Verificación:
--   SELECT title, diploma_included, highlights
--   FROM courses
--   WHERE id = '794a6764-fc27-41c4-9a66-09c2e098c11f';
