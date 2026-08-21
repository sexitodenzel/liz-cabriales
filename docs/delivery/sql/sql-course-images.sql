-- Tabla para galería de imágenes de cursos (múltiples imágenes por curso)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS course_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL CHECK (char_length(image_url) > 0),
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS course_images_course_id_idx ON course_images(course_id);
CREATE INDEX IF NOT EXISTS course_images_position_idx ON course_images(course_id, position);
