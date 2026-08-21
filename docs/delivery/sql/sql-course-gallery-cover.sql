-- Portada de galería por curso
-- Separa la portada del curso (cover_image, normalmente el flyer) de la foto
-- que representa al curso en la galería de eventos de /sobre-liz.
-- Si ninguna foto está marcada, se usa la primera imagen de la galería del
-- curso y, como último recurso, cover_image.

ALTER TABLE course_gallery
  ADD COLUMN is_cover BOOLEAN NOT NULL DEFAULT FALSE;
