import { redirect } from "next/navigation"

import AdminReceptionistBar from "./components/AdminReceptionistBar"
import AdminNav from "./components/AdminNav"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = profile?.role

  if (role !== "admin" && role !== "receptionist") {
    redirect("/")
  }

  if (role === "receptionist") {
    return (
      <>
        <AdminReceptionistBar />
        {children}
      </>
    )
  }

  return (
    <>
      <header className="border-b border-[#ececec] bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <AdminNav />
        </div>
      </header>
      {children}
    </>
  )
}
