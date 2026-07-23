import { getPublishedCoursesCached } from "@/lib/supabase/courses"
import { getOrderedSlotUrls } from "@/lib/supabase/landing-slots"
import {
  ACADEMIA_HERO_SLOT_KEYS,
  ACADEMIA_HERO_FALLBACKS,
} from "@/lib/media-slots"

import Breadcrumb from "@/components/shared/Breadcrumb"

import AcademiaHero from "./AcademiaHero"

import CourseGrid from "./CourseGrid"



export const revalidate = 60



export default async function AcademiaPage() {

  const [result, heroImages] = await Promise.all([
    getPublishedCoursesCached(),
    getOrderedSlotUrls([...ACADEMIA_HERO_SLOT_KEYS], ACADEMIA_HERO_FALLBACKS),
  ])



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

      <div className="site-container pb-20 pt-5 max-lg:pt-0">

        <Breadcrumb

          items={[{ label: "Inicio", href: "/" }, { label: "Academia" }]}

          className="mb-4 hidden lg:flex"

        />

        <AcademiaHero images={heroImages} />

        <CourseGrid courses={result.data} />

      </div>

    </main>

  )

}

