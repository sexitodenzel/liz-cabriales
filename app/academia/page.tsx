import { getPublishedCoursesCached } from "@/lib/supabase/courses"
import CourseGrid from "./CourseGrid"
import Breadcrumb from "@/components/shared/Breadcrumb"

export const revalidate = 60

export default async function AcademiaPage() {
  const result = await getPublishedCoursesCached()

  if (!result.data) {
    return (
      <main className="min-h-screen bg-white px-8 py-16 text-[#1a1a1a]">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm text-[#6b6b6b]">
            No pudimos cargar los eventos. Intenta de nuevo mas tarde.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="site-container pt-5 pb-20">
        <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Academia" }]} />
        <CourseGrid courses={result.data} />
      </div>
    </main>
  )
}
