import { redirect } from "next/navigation"
import Link from "next/link"

import AdminReceptionistBar from "./components/AdminReceptionistBar"
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
          <nav
            className="flex flex-wrap items-center gap-1 text-sm"
            aria-label="Secciones del panel"
          >
            <Link
              href="/admin"
              className="rounded-md border border-[#e8dcb0] bg-[#f5efdc] px-3 py-1.5 font-medium text-[#a8893a] transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/admin/products"
              className="rounded-md px-3 py-1.5 font-medium text-[#3a3a3a] transition-colors hover:bg-[#f5efdc] hover:text-[#a8893a]"
            >
              Productos
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-md px-3 py-1.5 font-medium text-[#3a3a3a] transition-colors hover:bg-[#f5efdc] hover:text-[#a8893a]"
            >
              Órdenes
            </Link>
            <Link
              href="/admin/appointments"
              className="rounded-md px-3 py-1.5 font-medium text-[#3a3a3a] transition-colors hover:bg-[#f5efdc] hover:text-[#a8893a]"
            >
              Agenda
            </Link>
            <Link
              href="/admin/courses"
              className="rounded-md px-3 py-1.5 font-medium text-[#3a3a3a] transition-colors hover:bg-[#f5efdc] hover:text-[#a8893a]"
            >
              Cursos
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  )
}
