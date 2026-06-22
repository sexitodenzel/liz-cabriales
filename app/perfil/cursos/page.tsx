import Link from "next/link"

import AccountShell from "../AccountShell"
import { formatMoney, registrationStatusLabel } from "../account-utils"
import { getUserRegistrations } from "@/lib/supabase/courses"
import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"

export const dynamic = "force-dynamic"

export default async function PerfilCursosPage() {
  const user = await getAuthUser()
  if (!user) return null

  const profile = await getUserProfile(user.id)
  const isAdmin = profile?.role === "admin" || profile?.role === "receptionist"
  const regsRes = await getUserRegistrations(user.id)
  const registrations = regsRes.data ?? []

  return (
    <AccountShell active="cursos" title="Cursos" breadcrumbLabel="Cursos" isAdmin={isAdmin}>
      {registrations.length === 0 ? (
        <p className="text-sm text-neutral-600">
          No tienes inscripciones. Consulta los{" "}
          <Link href="/academia" className="font-medium text-[var(--gold)] underline">
            cursos disponibles
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-neutral-300">
          {registrations.map((r) => {
            const title = r.course?.title ?? "Curso"
            const paid =
              r.payment_amount != null
                ? r.payment_amount
                : r.course
                  ? r.course.price * r.attendees
                  : null
            return (
              <li key={r.id} className="py-4 first:pt-0">
                <p className="font-semibold text-neutral-900">{title}</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Inscripción:{" "}
                  {new Date(r.created_at).toLocaleDateString("es-MX", { dateStyle: "medium" })}
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  Monto: {paid != null ? formatMoney(paid) : "—"}{" "}
                  <span
                    className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      r.status === "paid"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : r.status === "pending"
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-neutral-200 bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    {registrationStatusLabel(r.status)}
                  </span>
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </AccountShell>
  )
}
