"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

const PENDING_STORAGE_KEY = "pendingStockAlert"

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException || error instanceof Error) &&
    error.name === "AbortError"
  )
}

type PendingStockAlert = {
  variantId: string
  productSlug: string
}

type Props = {
  productId: string
  productSlug: string | null
  productName: string
  variantId: string
  outOfStock: boolean
  className?: string
  label?: string
}

export default function NotifyWhenAvailable({
  productId,
  productSlug,
  variantId,
  outOfStock,
  className,
  label = "Notificar disponibilidad",
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const buttonClassName =
    className ??
    "inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"

  const refreshSubscription = useCallback(async (signal: AbortSignal) => {
    if (!outOfStock) return

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (signal.aborted) return

      if (!session?.user) {
        setIsAuthenticated(false)
        setWhatsappEnabled(false)
        setSubscribed(false)
        return
      }

      setIsAuthenticated(true)

      const [profileRes, alertRes] = await Promise.all([
        supabase
          .from("users")
          .select("phone_verified, whatsapp_opt_in")
          .eq("id", session.user.id)
          .maybeSingle(),
        fetch(`/api/stock-alerts?variantId=${encodeURIComponent(variantId)}`, {
          signal,
        }),
      ])

      if (signal.aborted) return

      setWhatsappEnabled(
        Boolean(
          profileRes.data?.phone_verified && profileRes.data?.whatsapp_opt_in
        )
      )

      try {
        const json = await alertRes.json()
        if (!signal.aborted && alertRes.ok && !json.error) {
          setSubscribed(Boolean(json.data?.subscribed))
        }
      } catch {
        // Respuesta inválida o petición cancelada.
      }
    } catch (error) {
      if (isAbortError(error) || signal.aborted) return
    }
  }, [outOfStock, supabase, variantId])

  const subscribe = useCallback(async () => {
    setBusy(true)
    setErrorMessage(null)

    try {
      const res = await fetch("/api/stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setErrorMessage(
          json?.error?.message ?? "No se pudo activar el aviso"
        )
        return
      }

      setSubscribed(true)
    } catch {
      setErrorMessage("Error de red al activar el aviso")
    } finally {
      setBusy(false)
    }
  }, [variantId])

  const handleSubscribeClick = async () => {
    if (busy) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const slug = productSlug ?? productId
      try {
        sessionStorage.setItem(
          PENDING_STORAGE_KEY,
          JSON.stringify({ variantId, productSlug: slug } satisfies PendingStockAlert)
        )
      } catch {
        // noop
      }
      router.push(`/login?redirect=${encodeURIComponent(`/tienda/${slug}`)}`)
      return
    }

    await subscribe()
  }

  const handleCancel = async () => {
    if (busy) return
    setBusy(true)
    setErrorMessage(null)

    try {
      const res = await fetch("/api/stock-alerts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setErrorMessage(
          json?.error?.message ?? "No se pudo cancelar el aviso"
        )
        return
      }

      setSubscribed(false)
    } catch {
      setErrorMessage("Error de red al cancelar el aviso")
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!outOfStock) {
      setSubscribed(false)
      setErrorMessage(null)
      return
    }

    const controller = new AbortController()
    setSubscribed(false)
    setErrorMessage(null)
    void refreshSubscription(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [outOfStock, refreshSubscription])

  useEffect(() => {
    if (!outOfStock) return

    let pending: PendingStockAlert | null = null
    try {
      const raw = sessionStorage.getItem(PENDING_STORAGE_KEY)
      if (raw) pending = JSON.parse(raw) as PendingStockAlert
    } catch {
      pending = null
    }

    if (!pending || pending.variantId !== variantId) return

    let isMounted = true
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!isMounted || !session?.user) return

      try {
        sessionStorage.removeItem(PENDING_STORAGE_KEY)
      } catch {
        // noop
      }

      await subscribe()
    })()
    return () => { isMounted = false }
  }, [outOfStock, subscribe, supabase, variantId])

  if (!outOfStock) return null

  const subscribedLabel = whatsappEnabled
    ? "Te avisaremos por correo y WhatsApp"
    : "Te avisaremos por correo"

  if (subscribed) {
    return (
      <div className="space-y-2">
        <button type="button" disabled className={buttonClassName}>
          {subscribedLabel}
        </button>
        <button
          type="button"
          onClick={() => void handleCancel()}
          disabled={busy}
          className="w-full text-center text-xs font-semibold text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline disabled:opacity-60"
        >
          {busy ? "Cancelando..." : "Cancelar aviso"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleSubscribeClick()}
        disabled={busy}
        className={buttonClassName}
      >
        {busy ? "Guardando..." : label}
      </button>
      {errorMessage ? (
        <p className="text-center text-xs text-red-500">{errorMessage}</p>
      ) : isAuthenticated === false ? (
        <p className="text-center text-[11px] text-neutral-500">
          Inicia sesión para recibir el aviso por correo.
        </p>
      ) : null}
    </div>
  )
}
