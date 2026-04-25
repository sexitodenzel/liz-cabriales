import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getCourseById, getInstructors } from "@/lib/supabase/courses"

import CourseForm, {
  type CourseFormInitialValues,
} from "../../components/CourseForm"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/login")

  const [courseRes, instructorsRes] = await Promise.all([
    getCourseById(id),
    getInstructors(),
  ])

  if (!courseRes.data) {
    return (
      <div className="min-h-screen bg-black p-8 text-white">
        <Link
          href="/admin/courses"
          className="text-sm font-semibold text-[#C9A84C]"
        >
          ← Cursos
        </Link>
        <p className="mt-6">Curso no encontrado.</p>
      </div>
    )
  }

  const c = courseRes.data
  const initialValues: CourseFormInitialValues = {
    title: c.title,
    description: c.description,
    instructor_id: c.instructor_id,
    price: String(c.price),
    capacity: String(c.capacity),
    level: c.level,
    start_date: c.start_date,
    end_date: c.end_date ?? "",
    start_time: c.start_time.slice(0, 5),
    location: c.location,
    cover_image: c.cover_image ?? "",
    is_published: c.is_published,
  }

  return (
    <CourseForm
      mode="edit"
      courseId={c.id}
      instructors={instructorsRes.data ?? []}
      initialValues={initialValues}
    />
  )
}
