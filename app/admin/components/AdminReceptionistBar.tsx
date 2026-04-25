"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

const GOLD = "#C9A84C"

export default function AdminReceptionistBar() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <header className="border-b border-neutral-200 bg-neutral-950 px-6 py-3 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold tracking-[0.2em]" style={{ color: GOLD }}>
            RECEPCIÓN
          </span>
          <nav className="flex items-center gap-2 text-sm" aria-label="Panel recepción">
            <Link
              href="/admin/appointments"
              className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 font-medium text-white"
            >
              Agenda
            </Link>
          </nav>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:border-[#C9A84C] hover:bg-white/10"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
