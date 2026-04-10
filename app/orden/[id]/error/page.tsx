import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import RetryPaymentButton from "./RetryPaymentButton"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function OrdenErrorPage({ params, searchParams }: Props) {
  const { id } = await params
  const { status } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const isFailure = status === "failure"

  return (
    <main className="min-h-screen bg-[#f8f6f1] px-6 py-10 text-[#0a0a0a]">
      <div className="mx-auto max-w-[720px]">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
        >
          <ChevronLeft className="h-3 w-3" /> Volver al inicio
        </Link>
        {/* Banner de error */}
        <div className="rounded-[28px] border border-[#e7b8b8] bg-[#fff2f2] p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a2f2f]">
            {isFailure ? "Pago fallido" : "Pago no completado"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0a0a0a]">
            {isFailure
              ? "No se pudo procesar tu pago"
              : "Tu pago no fue completado"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            {isFailure
              ? "MercadoPago no pudo procesar tu pago. Esto puede deberse a fondos insuficientes, datos incorrectos o una limitación de tu banco. Tu orden sigue guardada."
              : "Saliste del proceso de pago antes de completarlo. Tu orden sigue guardada y puedes intentar pagar de nuevo."}
          </p>

          <div className="mt-6 rounded-2xl border border-[#e7b8b8] bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
              ID de orden
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-[#0a0a0a]">
              {id}
            </p>
          </div>
        </div>

        {/* Opciones */}
        <div className="mt-6 rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
            ¿Qué deseas hacer?
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#0a0a0a]">
            Opciones disponibles
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Puedes reintentar el pago con la misma orden o volver al carrito
            para revisar tus productos.
          </p>

          <div className="mt-6 space-y-4">
            {/* Reintentar: intenta pagar la misma orden si sigue pendiente */}
            <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
              <p className="text-sm font-semibold text-[#0a0a0a]">
                Reintentar con otra forma de pago
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Intenta pagar la misma orden usando otro método de pago o
                tarjeta.
              </p>
              <div className="mt-4">
                <RetryPaymentButton orderId={id} />
              </div>
            </div>

            {/* Volver al carrito */}
            <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
              <p className="text-sm font-semibold text-[#0a0a0a]">
                Crear una nueva orden
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Regresa al carrito para revisar tus productos y crear una orden
                nueva.
              </p>
              <div className="mt-4">
                <Link
                  href="/carrito"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  Volver al carrito
                </Link>
              </div>
            </div>

            {/* Soporte */}
            <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
              <p className="text-sm font-semibold text-[#0a0a0a]">
                ¿Necesitas ayuda?
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Contáctanos por WhatsApp y con gusto te ayudamos a completar tu
                compra.
              </p>
              <div className="mt-4">
                <a
                  href="https://wa.me/528332183399"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
