-- Ver también: supabase/migrations/20260723_nail_art_ugc.sql
-- Este archivo documenta el esquema base; la migración UGC añade status,
-- is_editorial, likes y políticas RLS actualizadas.

-- Nail Art Posts — ejecutar manualmente en Supabase SQL Editor.
-- Tabla para publicaciones de nail art con productos referenciados de la tienda.

CREATE TABLE IF NOT EXISTS nail_art_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  cover_image text,
  slug        text UNIQUE NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nail_art_post_products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nail_art_post_id  uuid NOT NULL REFERENCES nail_art_posts(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES products(id),
  usage_description text,
  sort_order        int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_nail_art_posts_active_sort
  ON nail_art_posts(is_active, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nail_art_post_products_post
  ON nail_art_post_products(nail_art_post_id, sort_order);

ALTER TABLE nail_art_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nail_art_post_products ENABLE ROW LEVEL SECURITY;

-- Tras crear las tablas base, ejecuta:
--   supabase/migrations/20260723_nail_art_ugc.sql
