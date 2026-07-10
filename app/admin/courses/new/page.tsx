import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getInstructors } from "@/lib/supabase/courses"

import CourseForm, {
  type CourseFormInitialValues,
} from "../components/CourseForm"

export const dynamic = "force-dynamic"

const EMPTY_VALUES: CourseFormInitialValues = {
  title: "",
  short_description: "",
  description: "",
  instructor_id: "",
  price: "",
  capacity: "",
  level: "beginner",
  start_date: "",
  end_date: "",
  start_time: "",
  location: "",
  diploma_included: true,
  highlights: [],
  cover_image: "",
  is_published: false,
  allow_online_registration: false,
  show_price_public: false,
  show_capacity_public: true,
  public_registered_count: "",
  public_capacity: "",
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
