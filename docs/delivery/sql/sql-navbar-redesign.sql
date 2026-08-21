-- Navbar redesign — ejecutar manualmente en Supabase SQL Editor.
-- 1. Bandera is_best_seller en productos (mismo patrón que is_featured).
-- 2. Tabla top_searches: chips configurables del overlay de búsqueda móvil/desktop.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Best sellers
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_best_seller
  ON products (is_best_seller)
  WHERE is_best_seller = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Top searches (chips de "Más buscados")
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS top_searches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL,
  -- Si href es NULL, el chip navega a /tienda?search=<label>.
  -- Si tiene valor, se usa tal cual (ruta interna o externa).
  href       text,
  position   integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_top_searches_enabled_position
  ON top_searches (is_enabled, position);

-- RLS: lectura pública, escritura solo admins (mismo patrón que landing_slots).
ALTER TABLE top_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "top_searches_public_read"
  ON top_searches FOR SELECT
  USING (true);

CREATE POLICY "top_searches_admin_write_insert"
  ON top_searches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "top_searches_admin_write_update"
  ON top_searches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "top_searches_admin_write_delete"
  ON top_searches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
