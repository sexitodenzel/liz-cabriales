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
    <header className="border-b border-[#ececec] bg-white px-6 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold tracking-[0.2em]" style={{ color: GOLD }}>
            RECEPCIÓN
          </span>
          <nav className="flex items-center gap-8 text-sm font-medium" aria-label="Panel recepción">
            <Link
              href="/admin/appointments"
              className="relative group text-[13px] tracking-[0.05em] text-[var(--foreground)]"
              aria-current="page"
            >
              <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
                Agenda
              </span>
              <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full" />
            </Link>
          </nav>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-[#ececec] bg-white px-4 py-2 text-sm font-medium text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a] transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
