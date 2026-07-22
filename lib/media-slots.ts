/**
 * Claves y URLs de fallback para slots de Media.
 * Archivo sin dependencias de servidor — seguro en Client y Server Components.
 */

export const HOME_TRI_SLOT_KEYS = [
  "home_tri_tienda",
  "home_tri_academia",
  "home_tri_cabina",
] as const

export const HOME_TRI_FALLBACKS = [
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=75",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=75",
]

export const SERVICIOS_GALLERY_SLOT_KEYS = [
  "servicios_gallery_1",
  "servicios_gallery_2",
  "servicios_gallery_3",
  "servicios_gallery_4",
  "servicios_gallery_5",
] as const

export const SERVICIOS_GALLERY_FALLBACKS = [
  "https://picsum.photos/seed/servicios-studio-a/1200/900",
  "https://picsum.photos/seed/servicios-studio-b/700/500",
  "https://picsum.photos/seed/servicios-studio-c/700/500",
  "https://picsum.photos/seed/servicios-studio-d/700/500",
  "https://picsum.photos/seed/servicios-studio-e/700/500",
]

export const ACADEMIA_HERO_SLOT_KEYS = [
  "academia_hero_1",
  "academia_hero_2",
  "academia_hero_3",
] as const

export const ACADEMIA_HERO_FALLBACKS = [
  "https://picsum.photos/seed/academia-hero-a/1200/900",
  "https://picsum.photos/seed/academia-hero-b/700/500",
  "https://picsum.photos/seed/academia-hero-c/700/500",
]

export const BLOG_HERO_SLOT_KEYS = [
  "blog_hero_1",
  "blog_hero_2",
  "blog_hero_3",
] as const

export const BLOG_HERO_FALLBACKS = [
  "https://picsum.photos/seed/blog-hero-a/700/900",
  "https://picsum.photos/seed/blog-hero-b/700/900",
  "https://picsum.photos/seed/blog-hero-c/700/900",
]
