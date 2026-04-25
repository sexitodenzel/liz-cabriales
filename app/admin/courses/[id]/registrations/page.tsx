import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  getCourseById,
  getRegistrationsByCourse,
} from "@/lib/supabase/courses"

import RegistrationsClient from "./RegistrationsClient"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminCourseRegistrationsPage({ params }: Props) {
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

  const [courseRes, regsRes] = await Promise.all([
    getCourseById(id),
    getRegistrationsByCourse(id),
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

  return (
    <RegistrationsClient
      course={courseRes.data}
      initialRegistrations={regsRes.data ?? []}
    />
  )
}
