import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getInstructors } from "@/lib/supabase/courses"

import CourseForm, {
  type CourseFormInitialValues,
} from "../components/CourseForm"

export const dynamic = "force-dynamic"

const EMPTY_VALUES: CourseFormInitialValues = {
  title: "",
  description: "",
  instructor_id: "",
  price: "",
  capacity: "",
  level: "beginner",
  start_date: "",
  end_date: "",
  start_time: "",
  location: "",
  cover_image: "",
  is_published: false,
}

export default async function NewCoursePage() {
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

  const instructorsRes = await getInstructors()

  return (
    <CourseForm
      mode="create"
      instructors={instructorsRes.data ?? []}
      initialValues={EMPTY_VALUES}
    />
  )
}
