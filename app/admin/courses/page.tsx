import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getAdminCourses } from "@/lib/supabase/courses"

import AdminCoursesClient from "./AdminCoursesClient"

export const dynamic = "force-dynamic"

export default async function AdminCoursesPage() {
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

  const result = await getAdminCourses()

  return <AdminCoursesClient initialCourses={result.data ?? []} />
}
