import Link from "next/link"
import { Star } from "lucide-react"

import AccountShell from "../AccountShell"
import DireccionesAddressRow from "./DireccionesAddressRow"
import { buildAddressList } from "../account-utils"
import { getUserSavedAddressesFromOrders } from "@/lib/supabase/orders"
import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"

export const dynamic = "force-dynamic"

export default async function PerfilDireccionesPage() {
  const user = await getAuthUser()
  if (!user) return null

  const [profile, savedAddressesRes] = await Promise.all([
    getUserProfile(user.id),
    getUserSavedAddressesFromOrders(user.id),
  ])
  const isAdmin = profile?.role === "admin" || profile?.role === "receptionist"
  const savedAddresses = savedAddressesRes.data ?? []
  const addresses = buildAddressList(profile, savedAddresses)

  return (
    <AccountShell
      active="direcciones"
      title="Direcciones"
      breadcrumbLabel="Direcciones"
      isAdmin={isAdmin}
      headerAction={
        <Link
          href="/checkout"
          className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-900 underline underline-offset-4 transition-colors hover:text-black"
        >
          Agregar dirección
        </Link>
      }
    >
      {addresses.length === 0 ? (
        <p className="text-sm text-neutral-600">
          Aún no tienes direcciones guardadas. Se guardarán al completar un pedido con envío.
        </p>
      ) : (
        <DireccionesAddressRow addresses={addresses} />
      )}
    </AccountShell>
  )
}
