"use client"

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
      className={`shrink-0 ${signOutLinkClass}`}
    >
      {busy ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  )
}
