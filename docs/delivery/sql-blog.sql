-- Blog — ejecutar manualmente en Supabase SQL Editor.
-- Posts editoriales (nail art, bioseguridad, tendencias, novedades) con
-- productos referenciados de la tienda. Espeja la estructura de nail_art_posts.

CREATE TABLE IF NOT EXISTS blog_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  slug         text UNIQUE NOT NULL,
  category     text NOT NULL DEFAULT 'Nail Art',
  excerpt      text,
  cover_image  text,
  body         text,
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   int NOT NULL DEFAULT 0,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_post_products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id      uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES products(id),
  usage_description text,
  sort_order        int NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blog_posts_active_sort
  ON blog_posts(is_active, sort_order, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_category
  ON blog_posts(category, is_active);

CREATE INDEX IF NOT EXISTS idx_blog_post_products_post
  ON blog_post_products(blog_post_id, sort_order);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_public_read"
  ON blog_posts FOR SELECT
  USING (is_active = true);

CREATE POLICY "blog_posts_admin_write"
  ON blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "blog_post_products_public_read"
  ON blog_post_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_products.blog_post_id
        AND blog_posts.is_active = true
    )
  );

CREATE POLICY "blog_post_products_admin_write"
  ON blog_post_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
