/**
 * Categorías del blog. Set fijo (editable aquí) inspirado en la estructura de
 * opi.com/blog, en español. Fuente única para los tiles de la página pública,
 * el tag de cada tarjeta y el selector del panel admin.
 *
 * Cada categoría trae un acento (clases Tailwind) para el tag y el tile.
 */

export type BlogCategory = {
  slug: string
  label: string
  tagline: string
  /** Clases del tag pequeño (fondo + texto + borde). */
  tag: string
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "nail-art",
    label: "Nail Art",
    tagline: "Diseños, técnicas e inspiración",
    tag: "border-[#e8c9c0] bg-[#f8ece8] text-[#8f4a30]",
  },
  {
    slug: "bioseguridad",
    label: "Bioseguridad",
    tagline: "Protocolos, higiene y buenas prácticas",
    tag: "border-[#cfe0c9] bg-[#eef4ea] text-[#4c6a3d]",
  },
  {
    slug: "tendencias",
    label: "Tendencias",
    tagline: "Lo que viene en el mundo de las uñas",
    tag: "border-[#e0cfa0] bg-[#f7f0da] text-[#7a5f21]",
  },
  {
    slug: "novedades",
    label: "Novedades",
    tagline: "Lanzamientos y noticias",
    tag: "border-[#dcdcdc] bg-[#f2f2f2] text-[#4a4a4a]",
  },
]

const BY_LABEL = new Map(BLOG_CATEGORIES.map((c) => [c.label, c]))
const BY_SLUG = new Map(BLOG_CATEGORIES.map((c) => [c.slug, c]))

export const DEFAULT_BLOG_CATEGORY = BLOG_CATEGORIES[0].label

/** El valor guardado en `blog_posts.category` es el `label`. */
export function getCategoryByLabel(label: string | null | undefined): BlogCategory | null {
  if (!label) return null
  return BY_LABEL.get(label) ?? null
}

export function getCategoryBySlug(slug: string | null | undefined): BlogCategory | null {
  if (!slug) return null
  return BY_SLUG.get(slug) ?? null
}

export function isValidCategory(label: string): boolean {
  return BY_LABEL.has(label)
}
