import Link from "next/link"
import { redirect } from "next/navigation"

import CheckoutClient from "./CheckoutClient"

import { getActiveCartSnapshot } from "@/lib/supabase/cart"
import { createClient } from "@/lib/supabase/server"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const cartResult = await getActiveCartSnapshot(user.id)

  if (!cartResult.data) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-[#0a0a0a]">
        <div className="mx-auto max-w-[720px] rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Finalizar compra
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            No pudimos cargar tu pedido
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            {cartResult.error.message}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/carrito"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
            >
              Volver al carrito
            </Link>
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (cartResult.data.items.length === 0) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-[#0a0a0a]">
        <div className="mx-auto max-w-[720px] rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Finalizar compra
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            Tu carrito esta vacio
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            Agrega productos antes de continuar con tu compra.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/carrito"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
            >
              Ver carrito
            </Link>
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
            >
              Ir a la tienda
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return <CheckoutClient initialCart={cartResult.data} />
}
