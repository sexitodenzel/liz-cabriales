"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { createClient } from "@/lib/supabase/client"

export default function PerfilSignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace("/")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={busy}
      className="shrink-0 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-60"
    >
      {busy ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  )
}
