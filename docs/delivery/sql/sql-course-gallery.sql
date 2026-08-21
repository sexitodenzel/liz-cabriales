-- Galería retrospectiva de cursos
-- Almacena imágenes y videos de lo aprendido/vivido en el curso.
-- Se muestra en la página pública del curso después de que éste termina.

CREATE TABLE course_gallery (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  url           TEXT        NOT NULL,
  thumbnail_url TEXT,
  caption       TEXT,
  position      INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_gallery_course   ON course_gallery(course_id);
CREATE INDEX idx_course_gallery_order    ON course_gallery(course_id, position);

ALTER TABLE course_gallery ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "course_gallery_public_read"
  ON course_gallery FOR SELECT
  USING (true);

-- Solo admins pueden escribir
CREATE POLICY "course_gallery_admin_write"
  ON course_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
