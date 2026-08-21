-- Course display settings — ejecutar manualmente en Supabase SQL Editor.
-- Permite que Liz decida por curso si se compra en línea o se canaliza por WhatsApp,
-- y si el precio/cupo se muestran en el sitio público.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS allow_online_registration BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS show_price_public BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS show_capacity_public BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS public_registered_count INTEGER;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS public_capacity INTEGER;

ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS courses_public_registered_count_nonnegative;

ALTER TABLE courses
  ADD CONSTRAINT courses_public_registered_count_nonnegative
  CHECK (public_registered_count IS NULL OR public_registered_count >= 0);

ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS courses_public_capacity_positive;

ALTER TABLE courses
  ADD CONSTRAINT courses_public_capacity_positive
  CHECK (public_capacity IS NULL OR public_capacity >= 1);

COMMENT ON COLUMN courses.allow_online_registration IS
  'Si true, el curso permite inscripción y pago en línea; si false, el CTA público va a WhatsApp.';

COMMENT ON COLUMN courses.show_price_public IS
  'Si true, el precio del curso se muestra al público; el admin siempre conserva el precio interno.';

COMMENT ON COLUMN courses.show_capacity_public IS
  'Si true, el sitio público muestra disponibilidad del curso; si false, se oculta.';

COMMENT ON COLUMN courses.public_registered_count IS
  'Conteo público opcional de inscritos; si es null se usa el conteo real de inscripciones pagadas.';

COMMENT ON COLUMN courses.public_capacity IS
  'Cupo público opcional; si es null se usa el cupo real operativo del curso.';
