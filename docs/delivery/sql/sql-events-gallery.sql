-- Galería de eventos /sobre-liz — ejecutar manualmente en Supabase SQL Editor.
-- Fotos de masterclasses, talleres y eventos administrables desde el panel admin.

CREATE TABLE IF NOT EXISTS liz_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   text NOT NULL,
  caption     text,
  event_date  date,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liz_events_sort
  ON liz_events (sort_order, event_date DESC);

ALTER TABLE liz_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "liz_events_public_read"
  ON liz_events FOR SELECT
  USING (true);

CREATE POLICY "liz_events_admin_insert"
  ON liz_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "liz_events_admin_update"
  ON liz_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "liz_events_admin_delete"
  ON liz_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
