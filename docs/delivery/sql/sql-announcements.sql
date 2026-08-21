-- Announcement bar — ejecutar manualmente en Supabase SQL Editor.
-- Barra superior con slides rotativos (texto + link opcional) administrable
-- desde el panel admin.

CREATE TABLE IF NOT EXISTS announcements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL,
  href       text,
  position   integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_enabled_position
  ON announcements (is_enabled, position);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_public_read"
  ON announcements FOR SELECT
  USING (true);

CREATE POLICY "announcements_admin_write_insert"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "announcements_admin_write_update"
  ON announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "announcements_admin_write_delete"
  ON announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- Seed inicial (los tres slides iniciales).
INSERT INTO announcements (label, href, position) VALUES
  ('Envío gratis a partir de $1,999 MXN', NULL, 0),
  ('Capacítate con nosotros', '/academia', 1),
  ('Conoce nuestros servicios', '/servicios', 2)
ON CONFLICT DO NOTHING;

-- Toggle global de la barra negra (desactivada por defecto).
INSERT INTO app_settings (key, value)
VALUES ('announcement_bar_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
