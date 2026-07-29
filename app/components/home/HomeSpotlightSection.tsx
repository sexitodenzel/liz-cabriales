import {
  getHomeSpotlightItems,
  getHomeSpotlightSettings,
} from "@/lib/supabase/home-spotlight"
import HomeSpotlight from "./HomeSpotlight"

/* Wrapper server de la sección Spotlight del home. Trae los items curados
   (activos, en orden) y los textos del encabezado; no renderiza nada si el
   estudio aún no ha subido ninguna imagen. El contenido y los textos se
   administran en /admin/home-spotlight. */

export default async function HomeSpotlightSection() {
  const [items, settings] = await Promise.all([
    getHomeSpotlightItems(),
    getHomeSpotlightSettings(),
  ])
  if (items.length === 0) return null

  // Campos vacíos → undefined para que el componente use sus defaults.
  const orUndef = (v: string) => (v.trim() ? v : undefined)
  const titleLines = settings.title.trim()
    ? settings.title.split("\n").map((l) => l.trim()).filter(Boolean)
    : undefined

  return (
    <HomeSpotlight
      items={items}
      eyebrow={orUndef(settings.eyebrow)}
      titleLines={titleLines}
      subtitle={orUndef(settings.subtitle)}
      body={orUndef(settings.body)}
      ctaLabel={orUndef(settings.cta_label)}
      ctaHref={orUndef(settings.cta_href)}
    />
  )
}
