-- Reseñas de cursos pasados
-- Solo participantes avaladas (inscripción pagada al curso) pueden calificar
-- y comentar. Una reseña por usuaria por curso. is_approved permite moderar
-- desde el panel admin sin borrar la reseña.

CREATE TABLE course_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_approved BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, user_id)
);

CREATE INDEX idx_course_reviews_course ON course_reviews(course_id, is_approved);
CREATE INDEX idx_course_reviews_user   ON course_reviews(user_id);

ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

-- Lectura pública solo de reseñas aprobadas
CREATE POLICY "course_reviews_public_read"
  ON course_reviews FOR SELECT
  USING (is_approved = TRUE);

-- La autora puede ver su propia reseña aunque esté oculta
CREATE POLICY "course_reviews_own_read"
  ON course_reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Insertar solo con inscripción pagada al curso (participante avalada)
CREATE POLICY "course_reviews_verified_insert"
  ON course_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM course_registrations cr
      WHERE cr.course_id = course_reviews.course_id
        AND cr.user_id = auth.uid()
        AND cr.status = 'paid'
    )
  );

-- La autora puede editar su reseña
CREATE POLICY "course_reviews_own_update"
  ON course_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins: acceso total (moderación)
CREATE POLICY "course_reviews_admin_all"
  ON course_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
