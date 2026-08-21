import {
  getBeforeAfterItems,
  getBeforeAfterSettings,
} from "@/lib/supabase/before-after"
import BeforeAfterShowcase from "./BeforeAfterShowcase"

/* Wrapper server de la sección "Antes y Después" del home. Trae los pares
   curados (activos, en orden) y los textos del encabezado; no renderiza nada
   si el estudio aún no ha subido ningún par de fotos reales. El contenido y
   los textos se administran en /admin/antes-despues. */

export default async function BeforeAfterSection() {
  const [items, settings] = await Promise.all([
    getBeforeAfterItems(),
    getBeforeAfterSettings(),
  ])
  if (items.length === 0) return null

  const orUndef = (v: string) => (v.trim() ? v : undefined)

  return (
    <section className="py-14 md:py-20" aria-label="Antes y Después">
      <div className="site-container">
        <BeforeAfterShowcase
          items={items}
          eyebrow={orUndef(settings.eyebrow) ?? "Resultados reales"}
          title={orUndef(settings.title) ?? "Antes y Después"}
          subtitle={
            orUndef(settings.subtitle) ??
            "El resultado de nuestros tratamientos, en las manos y los pies de nuestras clientas."
          }
          ctaLabel={orUndef(settings.cta_label)}
          ctaHref={orUndef(settings.cta_href)}
        />
      </div>
    </section>
  )
}
