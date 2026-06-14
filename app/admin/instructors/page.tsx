import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getInstructors } from "@/lib/supabase/courses"
import InstructorsClient from "./InstructorsClient"

export const dynamic = "force-dynamic"

export default async function InstructorsPage() {
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

  const { data: instructors } = await getInstructors()

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]">
      <InstructorsClient initial={instructors ?? []} />
    </main>
  )
}
