"use client"

import { useEffect, useId, useState } from "react"

import type { OrderForDisplay } from "@/lib/supabase/orders"

const MAX_MESSAGE_LENGTH = 1000
const MIN_MESSAGE_LENGTH = 5

type Status = "idle" | "submitting" | "success" | "error"

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}

function OrderQuestionModal({
  order,
  open,
  onClose,
}: {
  order: OrderForDisplay
  open: boolean
  onClose: () => void
}) {
  const titleId = useId()
  const productSelectId = useId()
  const messageId = useId()

  const [productId, setProductId] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "submitting") return

    const trimmed = message.trim()
    if (trimmed.length < MIN_MESSAGE_LENGTH) {
      setErrorMessage("Cuéntale a Liz un poco más sobre tu duda.")
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/orders/${order.id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId || null,
          message: trimmed,
        }),
      })

      const json = (await res.json().catch(() => null)) as
        | { data: { sent: boolean } | null; error: { message: string } | null }
        | null

      if (!res.ok || !json?.data?.sent) {
        const msg =
          json?.error?.message ??
          "No pudimos enviar tu mensaje. Intenta de nuevo."
        setErrorMessage(msg)
        setStatus("error")
        return
      }

      setStatus("success")
    } catch {
      setErrorMessage("No pudimos enviar tu mensaje. Intenta de nuevo.")
      setStatus("error")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/45 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[81] flex w-full max-w-[520px] flex-col rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-[#0a0a0a]"
        >
          <CloseIcon />
        </button>

        <div className="px-6 pt-7 pb-3 sm:px-8 sm:pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
            ¿Dudas sobre tu pedido?
          </p>
          <h2
            id={titleId}
            className="mt-2 text-xl font-semibold text-[#0a0a0a] sm:text-2xl"
          >
            Escríbele directo a Liz
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Tu mensaje llega a su correo junto con el número de pedido. Te
            responderá personalmente.
          </p>
        </div>

        {status === "success" ? (
          <div className="px-6 pb-7 sm:px-8 sm:pb-8">
            <div className="rounded-2xl border border-[#b8d9b8] bg-[#f0faf0] px-5 py-6 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2d7a2d]">
                Mensaje enviado
              </p>
              <p className="mt-2 text-sm text-neutral-700">
                Liz te responderá por correo en cuanto pueda. Revisa tu bandeja
                (y spam por si acaso).
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f1f1f]"
            >
              Listo
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 px-6 pb-6 sm:px-8 sm:pb-8"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={productSelectId}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600"
              >
                Producto (opcional)
              </label>
              <select
                id={productSelectId}
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-[#0a0a0a] focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
              >
                <option value="">General — no es sobre un producto</option>
                {order.items.map((item) => (
                  <option key={item.id} value={item.product_id}>
                    {item.product_name}
                    {item.variant_name &&
                    item.variant_name !== item.product_name
                      ? ` — ${item.variant_name}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={messageId}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600"
              >
                Tu mensaje
              </label>
              <textarea
                id={messageId}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Hola Liz, tengo una duda sobre…"
                className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-[#0a0a0a] placeholder:text-neutral-400 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
              />
              <p className="text-right text-[11px] text-neutral-400">
                {message.trim().length}/{MAX_MESSAGE_LENGTH}
              </p>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-lg border border-[#f5c6c6] bg-[#fff5f5] px-3 py-2 text-sm text-[#b91c1c]"
              >
                {errorMessage}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={status === "submitting"}
                className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex items-center justify-center rounded-full bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "submitting" ? "Enviando…" : "Enviar mensaje"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function OrderQuestionTrigger({
  order,
  className,
  label = "¿Dudas sobre tu pedido? Escríbele a Liz",
}: {
  order: OrderForDisplay
  className?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)

  const defaultClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:bg-[#fbf7ee]"

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? defaultClassName}
      >
        {label}
      </button>

      <OrderQuestionModal
        order={order}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

export default OrderQuestionModal
