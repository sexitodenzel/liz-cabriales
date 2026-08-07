import { getPublishedCoursesCached } from "@/lib/supabase/courses"
import type { CourseWithStats } from "@/lib/supabase/courses"
import {
  getEventsGallery,
  getPastCoursesForGallery,
} from "@/lib/supabase/events-gallery"

import AcademiaShowcaseScroll from "./AcademiaShowcaseScroll"

/* Sección "showcase" de la academia en la landing — estilo editorial Dior
   ("The finishing touch"): en desktop es una galería horizontal ANCLADA por
   scroll (el scroll vertical empuja el riel de cursos; el panel de texto sale
   por la izquierda). En móvil / reduced-motion, swipe horizontal simple.
   Estética LC: fondo marfil, eyebrow dorado, título sans (Outfit). */

function isCoursePast(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(y, m - 1, d) < today
}

export default async function AcademiaShowcase() {
  const [result, events, pastGallery] = await Promise.all([
    getPublishedCoursesCached(),
    getEventsGallery(),
    getPastCoursesForGallery(),
  ])
  const all: CourseWithStats[] = result.data ?? []
  if (all.length === 0) return null

  // Collage de la card de portada: fotos reales de cursos pasados / eventos.
  // Preferimos las fotos curadas de eventos (liz_events) y rellenamos con las
  // portadas de galería de cursos pasados. Dedupe + 3 para la salerita.
  const galleryImages = Array.from(
    new Set([
      ...events.map((e) => e.image_url),
      ...pastGallery.courses.map((c) => c.cover_image),
    ]),
  )
    .filter(Boolean)
    .slice(0, 6)

  // Próximos primero (asc por fecha). Si hay pocos próximos, completamos con
  // el catálogo para no dejar el riel vacío.
  const upcoming = all
    .filter((c) => !isCoursePast(c.start_date))
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
  const base = upcoming.length >= 3 ? upcoming : all
  const courses = base.slice(0, 8)
  if (courses.length === 0) return null

  // NOTA: sin overflow-hidden en la sección — rompería el position:sticky de la
  // galería anclada. El clip horizontal lo hace el propio contenedor sticky.
  return (
    <section
      className="relative bg-ivory"
      aria-label="Academia — cursos y certificaciones"
    >
      <AcademiaShowcaseScroll courses={courses} galleryImages={galleryImages} />
    </section>
  )
}
