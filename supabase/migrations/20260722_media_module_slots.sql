-- Slots de Media por módulo (imágenes fijas editables desde /admin/media).
-- Ejecutar en Supabase SQL Editor si aún no están.

INSERT INTO landing_slots (key, label, section, url) VALUES
  -- Servicios: collage / lightbox de /servicios
  ('servicios_gallery_1', 'Galería 1', 'servicios', 'https://picsum.photos/seed/servicios-studio-a/1200/900'),
  ('servicios_gallery_2', 'Galería 2', 'servicios', 'https://picsum.photos/seed/servicios-studio-b/700/500'),
  ('servicios_gallery_3', 'Galería 3', 'servicios', 'https://picsum.photos/seed/servicios-studio-c/700/500'),
  ('servicios_gallery_4', 'Galería 4', 'servicios', 'https://picsum.photos/seed/servicios-studio-d/700/500'),
  ('servicios_gallery_5', 'Galería 5', 'servicios', 'https://picsum.photos/seed/servicios-studio-e/700/500'),

  -- Inicio: tri-cards del hero
  ('home_tri_tienda', 'Tri-card Tienda', 'home', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=75'),
  ('home_tri_academia', 'Tri-card Academia', 'home', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=75'),
  ('home_tri_cabina', 'Tri-card Cabina / Citas', 'home', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=75'),

  -- Academia: collage superior de /academia
  ('academia_hero_1', 'Hero Academia 1', 'academia', 'https://picsum.photos/seed/academia-hero-a/1200/900'),
  ('academia_hero_2', 'Hero Academia 2', 'academia', 'https://picsum.photos/seed/academia-hero-b/700/500'),
  ('academia_hero_3', 'Hero Academia 3', 'academia', 'https://picsum.photos/seed/academia-hero-c/700/500'),

  -- Blog: collage superior de /blog
  ('blog_hero_1', 'Hero Blog 1', 'blog', 'https://picsum.photos/seed/blog-hero-a/700/900'),
  ('blog_hero_2', 'Hero Blog 2', 'blog', 'https://picsum.photos/seed/blog-hero-b/700/900'),
  ('blog_hero_3', 'Hero Blog 3', 'blog', 'https://picsum.photos/seed/blog-hero-c/700/900')
ON CONFLICT (key) DO NOTHING;
