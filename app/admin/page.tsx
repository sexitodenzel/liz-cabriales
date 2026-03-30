"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/login")
        return
      }
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, role")
        .eq("id", user.id)
        .single()
      if (profile?.role !== "admin") {
        router.replace("/login")
        return
      }
      setUserName(
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          "Administrador"
      )
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/80">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#C9A84C]">
          Panel Administrador
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80">{userName}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 hover:border-[#C9A84C] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="p-8">
        <div className="space-y-6">
          <p className="text-white/80">
            Bienvenido al panel de administración
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href="/admin/products"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-[#C9A84C] hover:bg-white/10"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-br from-[#C9A84C] to-transparent transition-opacity" />
              <div className="relative space-y-1">
                <p className="text-sm font-semibold text-white">
                  Gestionar Productos
                </p>
                <p className="text-xs text-white/70">
                  Crear, editar, activar o eliminar productos del catálogo.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
