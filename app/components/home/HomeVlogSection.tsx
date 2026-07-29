import { getBlogPosts } from "@/lib/supabase/blog"
import type { HomeSpotlightItem } from "@/lib/supabase/home-spotlight"
import HomeSpotlight from "./HomeSpotlight"

/* Sección "Vlog" del home: toma los últimos posts del Blog y los muestra en el
   collage editorial estilo OPI (mismo componente HomeSpotlight que la sección
   curada, pero alimentado automáticamente desde /admin/blog). Cada imagen
   enlaza a su artículo. Se escribe una sola vez en el Blog y se refleja aquí.

   Muestra hasta los 5 posts más recientes con portada. Si no hay ninguno con
   imagen, no renderiza nada. */

const MAX_POSTS = 5

export default async function HomeVlogSection() {
  const posts = await getBlogPosts({ limit: MAX_POSTS })

  const items: HomeSpotlightItem[] = posts
    .filter((p) => Boolean(p.cover_image))
    .slice(0, MAX_POSTS)
    .map((p, i) => ({
      id: p.id,
      image_url: p.cover_image as string,
      avatar_url: null,
      label: p.title,
      link_href: `/blog/${p.slug}`,
      sort_order: i,
      is_active: true,
      created_at: p.created_at,
      updated_at: p.created_at,
    }))

  if (items.length === 0) return null

  return (
    <HomeSpotlight
      items={items}
      eyebrow="Del blog"
      titleLines={["Tips y", "tendencias"]}
      body="Lo último que publicamos para las alumnas: técnicas, bioseguridad y novedades del estudio."
      ctaHref="/blog"
      ctaLabel="Ver el blog"
    />
  )
}
