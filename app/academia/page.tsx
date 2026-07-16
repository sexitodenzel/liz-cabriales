import { getPublishedCoursesCached } from "@/lib/supabase/courses"
import SmoothImage from "@/app/components/shared/SmoothImage"
import Breadcrumb from "@/components/shared/Breadcrumb"
import CourseGrid from "./CourseGrid"

export const revalidate = 60

// Imágenes del collage hero (placeholder mientras no hay fotos reales del estudio).
const HERO_IMAGES = [
  "https://picsum.photos/seed/academia-hero-a/1200/900",
  "https://picsum.photos/seed/academia-hero-b/700/500",
  "https://picsum.photos/seed/academia-hero-c/700/500",
]

/** Encabezado editorial + galería collage: 1 imagen grande (2/3) + 2 apiladas. */
function HeroBand() {
  return (
    <>
      <header className="mb-5">
        <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(30px,5vw,46px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
          Academia
        </h1>
        <p className="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-[#5a5a5a]">
          Talleres presenciales, cupos reducidos y práctica con modelo.
        </p>
      </header>

      <section className="mb-10 grid gap-2 overflow-hidden rounded-2xl sm:h-[440px] sm:grid-cols-3 sm:grid-rows-2">
        <div className="relative aspect-[4/3] overflow-hidden sm:col-span-2 sm:row-span-2 sm:aspect-auto">
          <SmoothImage
            src={HERO_IMAGES[0]}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 66vw"
            priority
          />
        </div>
        <div className="relative hidden overflow-hidden sm:block">
          <SmoothImage
            src={HERO_IMAGES[1]}
            alt=""
            fill
            className="object-cover"
            sizes="33vw"
            priority
          />
        </div>
        <div className="relative hidden overflow-hidden sm:block">
          <SmoothImage
            src={HERO_IMAGES[2]}
            alt=""
            fill
            className="object-cover"
            sizes="33vw"
            priority
          />
        </div>
      </section>
    </>
  )
}

export default async function AcademiaPage() {
  const result = await getPublishedCoursesCached()

  if (!result.data) {
    return (
      <main className="min-h-screen bg-ivory px-8 py-16 text-[#1a1a1a]">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm text-[#6b6b6b]">
            No pudimos cargar los eventos. Intenta de nuevo mas tarde.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ivory text-[#1a1a1a]">
      <div className="site-container pt-5 pb-20">
        <Breadcrumb
          items={[{ label: "Inicio", href: "/" }, { label: "Academia" }]}
          className="mb-4"
        />
        <HeroBand />
        <CourseGrid courses={result.data} />
      </div>
    </main>
  )
}
