import Link from "next/link"

import AccountQuickStats from "./AccountQuickStats"
import AccountShell from "./AccountShell"
import {
  buildPrimaryAddress,
  formatMoney,
  orderStatusBadgeClassName,
  orderStatusClass,
  orderStatusLabel,
} from "./account-utils"
import { listAppointmentsForUser } from "@/lib/supabase/appointments"
import { getUserRegistrations } from "@/lib/supabase/courses"
import { getUserOrdersSummaries, getUserSavedAddressesFromOrders } from "@/lib/supabase/orders"
import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const user = await getAuthUser()
  if (!user) return null

  const profile = await getUserProfile(user.id)
  const isAdmin = profile?.role === "admin" || profile?.role === "receptionist"
  const firstName = profile?.first_name?.trim() || "Cliente"
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Cliente"
  const email = profile?.email ?? user.email ?? ""
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("es-MX", { dateStyle: "long" })
    : null

  const [ordersRes, savedAddressesRes, regsRes, apptsRes] = await Promise.all([
    getUserOrdersSummaries(user.id),
    getUserSavedAddressesFromOrders(user.id),
    getUserRegistrations(user.id),
    listAppointmentsForUser(user.id),
  ])

  const orders = ordersRes.data ?? []
  const savedAddresses = savedAddressesRes.data ?? []
  const registrations = regsRes.data ?? []
  const appointments = apptsRes.data ?? []
  const primaryAddress = buildPrimaryAddress(profile) ?? savedAddresses[0]?.address ?? null

  return (
    <AccountShell active="resumen" title="Resumen de cuenta" isAdmin={isAdmin}>
      <p className="text-sm text-neutral-700">Bienvenida de vuelta, {firstName}.</p>

      <AccountQuickStats
        ordersCount={orders.length}
        coursesCount={registrations.length}
        servicesCount={appointments.length}
      />

      <div className="mt-10">
        <h3 className="text-xl font-medium text-neutral-900">Pedidos recientes</h3>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            Aún no tienes pedidos. Explora la{" "}
            <Link href="/tienda" className="font-medium text-[var(--gold)] underline">
              tienda
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-300">
            {orders.slice(0, 3).map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
              >
                <div>
                  <p className="text-sm text-neutral-600">
                    {new Date(o.created_at).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-1 text-base font-semibold text-neutral-900">{formatMoney(o.total)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`${orderStatusBadgeClassName} ${orderStatusClass(o.status)}`}
                  >
                    {orderStatusLabel(o.status)}
                  </span>
                  <Link
                    href={`/orden/${o.id}`}
                    className={`${orderStatusBadgeClassName} text-neutral-900 transition-colors hover:text-[var(--gold)]`}
                  >
                    Ver orden
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        {orders.length > 0 && (
          <Link
            href="/perfil/pedidos"
            className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.18em] text-neutral-700 underline underline-offset-4 transition-colors hover:text-black"
          >
            Ver todos los pedidos
          </Link>
        )}
      </div>

      <div className="mt-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h3 className="text-xl font-medium text-neutral-900">Datos principales</h3>
            <div className="mt-4 border-t border-neutral-300 pt-4 text-sm text-neutral-800">
              <p>{displayName}</p>
              <p className="mt-1">{email}</p>
              {memberSince && <p className="mt-1 text-neutral-600">Miembro desde {memberSince}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-medium text-neutral-900">Dirección principal</h3>
            <div className="mt-4 border-t border-neutral-300 pt-4 text-sm text-neutral-800">
              {primaryAddress ? (
                <p className="whitespace-pre-line">{primaryAddress}</p>
              ) : (
                <p className="text-neutral-600">
                  Aún no tienes una dirección principal. Se guardará al completar tu primer pedido con envío.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  )
}
