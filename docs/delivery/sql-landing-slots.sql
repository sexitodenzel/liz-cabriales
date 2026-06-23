-- Landing Slots — ejecutar manualmente en Supabase SQL Editor.
-- Tabla para gestionar imágenes configurables de la landing page desde el panel admin.

CREATE TABLE IF NOT EXISTS landing_slots (
  key        text PRIMARY KEY,
  url        text NOT NULL DEFAULT '',
  label      text NOT NULL,
  section    text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: solo admins pueden escribir; la lectura es pública (para la landing)
ALTER TABLE landing_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "landing_slots_public_read" ON landing_slots;
CREATE POLICY "landing_slots_public_read"
  ON landing_slots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "landing_slots_admin_write" ON landing_slots;
CREATE POLICY "landing_slots_admin_write"
  ON landing_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- Seed: slots con URLs vacías (la diseñadora los llena desde el panel)
INSERT INTO landing_slots (key, label, section) VALUES
  ('hero_slide_1',  'Slide 1',      'hero'),
  ('hero_slide_2',  'Slide 2',      'hero'),
  ('hero_slide_3',  'Slide 3',      'hero'),
  ('brand_photo',   'Foto lateral', 'brand')
ON CONFLICT (key) DO NOTHING;

-- Migración: agregar campos de vinculación para slides del hero
ALTER TABLE landing_slots
  ADD COLUMN IF NOT EXISTS link_type  text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS link_value text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_label  text NOT NULL DEFAULT '';

-- Migración: texto auxiliar junto al botón CTA del hero
ALTER TABLE landing_slots
  ADD COLUMN IF NOT EXISTS cta_subtext text NOT NULL DEFAULT '';
