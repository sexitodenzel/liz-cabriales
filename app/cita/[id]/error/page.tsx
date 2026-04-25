import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

import RetryAppointmentPaymentButton from "./RetryAppointmentPaymentButton"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function CitaErrorPage({
  params,
  searchParams,
}: Props) {
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
        <div className="rounded-[28px] border border-[#e7b8b8] bg-[#fff2f2] p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a2f2f]">
            {isFailure ? "Pago fallido" : "Pago no completado"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            {isFailure
              ? "No se pudo procesar tu pago"
              : "Tu pago no fue completado"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            {isFailure
              ? "MercadoPago no pudo procesar tu pago. Tu cita sigue reservada en estado pendiente."
              : "Saliste del proceso de pago antes de completarlo. Tu cita sigue reservada en estado pendiente."}
          </p>
          <div className="mt-6 rounded-2xl border border-[#e7b8b8] bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
              ID de cita
            </p>
            <p className="mt-2 break-all text-sm font-semibold">{id}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">¿Qué deseas hacer?</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
              <p className="text-sm font-semibold">
                Reintentar con otra forma de pago
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Intenta pagar la misma cita usando otro método.
              </p>
              <div className="mt-4">
                <RetryAppointmentPaymentButton appointmentId={id} />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
              <p className="text-sm font-semibold">Volver a mis citas</p>
              <p className="mt-1 text-sm text-neutral-600">
                Consulta el estado de tu cita o inicia otra reserva.
              </p>
              <div className="mt-4">
                <Link
                  href={`/cita/${id}`}
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  Ver mi cita
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
