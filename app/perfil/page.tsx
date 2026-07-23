import Image from "next/image"
import Link from "next/link"

import AccountQuickStats from "./AccountQuickStats"
import AccountShell from "./AccountShell"
import {
  buildPrimaryAddress,
  formatMoney,
  nailArtStatusClass,
  nailArtStatusLabel,
  orderStatusBadgeClassName,
  orderStatusClass,
  orderStatusLabel,
} from "./account-utils"
import { listAppointmentsForUser } from "@/lib/supabase/appointments"
import { getUserRegistrations } from "@/lib/supabase/courses"
import { listNailArtPostsForUser } from "@/lib/supabase/nail-art"
import { nailArtImageApiPath } from "@/lib/nail-art-image"
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

  const [ordersRes, savedAddressesRes, regsRes, apptsRes, nailArtPosts] = await Promise.all([
    getUserOrdersSummaries(user.id),
    getUserSavedAddressesFromOrders(user.id),
    getUserRegistrations(user.id),
    listAppointmentsForUser(user.id),
    listNailArtPostsForUser(user.id),
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
        <h3 className="text-xl font-medium text-neutral-900">Mis publicaciones</h3>
        {nailArtPosts.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            Aún no has subido inspiraciones. Comparte tu diseño en{" "}
            <Link href="/nail-art" className="font-medium text-[var(--gold)] underline">
              Nail Art
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {nailArtPosts.map((post) => {
              const isPublic = post.status === "approved" && post.is_active
              const body = (
                <>
                  <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-neutral-100">
                    <Image
                      src={nailArtImageApiPath(post.id)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 45vw, 180px"
                    />
                  </span>
                  <span className="mt-2 block truncate text-sm font-medium text-neutral-900">
                    {post.title}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                    <span className={nailArtStatusClass(post.status)}>
                      {nailArtStatusLabel(post.status)}
                    </span>
                    <span className="text-neutral-500">
                      {new Date(post.created_at).toLocaleDateString("es-MX", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </span>
                </>
              )

              return (
                <li key={post.id}>
                  {isPublic ? (
                    <Link
                      href={`/nail-art/${post.slug}`}
                      className="block transition-opacity hover:opacity-90"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="block">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

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
        <h3 className="text-xl font-medium text-neutral-900">Datos principales</h3>
        <div className="mt-4 border-t border-neutral-300 pt-4 text-sm text-neutral-800">
          <p>{displayName}</p>
          <p className="mt-1">{email}</p>
          {memberSince && <p className="mt-1 text-neutral-600">Miembro desde {memberSince}</p>}
          {primaryAddress ? (
            <p className="mt-1 whitespace-pre-line">{primaryAddress}</p>
          ) : (
            <p className="mt-1 text-neutral-600">
              Aún no tienes una dirección guardada. Se guardará al completar tu primer pedido con envío.
            </p>
          )}
        </div>
      </div>
    </AccountShell>
  )
}
