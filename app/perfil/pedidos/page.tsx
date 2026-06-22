import Link from "next/link"

import AccountShell from "../AccountShell"
import PerfilPedidosClient from "../PerfilPedidosClient"
import { getUserOrdersWithItems } from "@/lib/supabase/orders"
import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"

export const dynamic = "force-dynamic"

export default async function PerfilPedidosPage() {
  const user = await getAuthUser()
  if (!user) return null

  const profile = await getUserProfile(user.id)
  const isAdmin = profile?.role === "admin" || profile?.role === "receptionist"
  const ordersRes = await getUserOrdersWithItems(user.id)
  const orders = ordersRes.data ?? []

  return (
    <AccountShell active="pedidos" title="Pedidos" breadcrumbLabel="Pedidos" isAdmin={isAdmin}>
      {orders.length === 0 ? (
        <p className="text-sm text-neutral-600">
          Aún no tienes pedidos. Explora la{" "}
          <Link href="/tienda" className="font-medium text-[var(--gold)] underline">
            tienda
          </Link>
          .
        </p>
      ) : (
        <PerfilPedidosClient orders={orders} />
      )}
    </AccountShell>
  )
}
