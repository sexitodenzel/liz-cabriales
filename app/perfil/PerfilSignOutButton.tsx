"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { createClient } from "@/lib/supabase/client"

type PerfilSignOutButtonProps = {
  variant?: "header" | "nav" | "nav-inline"
}

const signOutLinkClass =
  "text-xs font-medium uppercase tracking-[0.18em] text-neutral-900 underline underline-offset-4 transition-colors hover:text-black disabled:opacity-60"

export default function PerfilSignOutButton({ variant = "header" }: PerfilSignOutButtonProps) {
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

  if (variant === "nav") {
    return (
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={busy}
        className={`block w-full text-left ${signOutLinkClass}`}
      >
        {busy ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    )
  }

  if (variant === "nav-inline") {
    return (
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={busy}
        className={`shrink-0 whitespace-nowrap ${signOutLinkClass}`}
      >
        {busy ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={busy}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-800 transition-colors hover:border-[var(--gold)] hover:text-neutral-900 disabled:opacity-60"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      {busy ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  )
}
