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

CREATE POLICY "landing_slots_public_read"
  ON landing_slots FOR SELECT
  USING (true);

CREATE POLICY "landing_slots_admin_write"
  ON landing_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- Seed: 13 slots con URLs vacías (la diseñadora los llena desde el panel)
INSERT INTO landing_slots (key, label, section) VALUES
  ('hero_slide_1',  'Slide 1',      'hero'),
  ('hero_slide_2',  'Slide 2',      'hero'),
  ('hero_slide_3',  'Slide 3',      'hero'),
  ('brand_photo',   'Foto lateral', 'brand'),
  ('pillar_dist_1', 'Imagen 1',     'pillar_dist'),
  ('pillar_dist_2', 'Imagen 2',     'pillar_dist'),
  ('pillar_dist_3', 'Imagen 3',     'pillar_dist'),
  ('pillar_acad_1', 'Imagen 1',     'pillar_acad'),
  ('pillar_acad_2', 'Imagen 2',     'pillar_acad'),
  ('pillar_acad_3', 'Imagen 3',     'pillar_acad'),
  ('pillar_serv_1', 'Imagen 1',     'pillar_serv'),
  ('pillar_serv_2', 'Imagen 2',     'pillar_serv'),
  ('pillar_serv_3', 'Imagen 3',     'pillar_serv')
ON CONFLICT (key) DO NOTHING;

-- Migración: agregar campos de vinculación para slides del hero
ALTER TABLE landing_slots
  ADD COLUMN IF NOT EXISTS link_type  text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS link_value text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_label  text NOT NULL DEFAULT '';

-- Migración: texto auxiliar junto al botón CTA del hero
ALTER TABLE landing_slots
  ADD COLUMN IF NOT EXISTS cta_subtext text NOT NULL DEFAULT '';
