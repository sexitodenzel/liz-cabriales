import type { OrderStatus, RegistrationStatus } from "@/types"
import type { AuthUserProfile } from "@/lib/supabase/auth-server"
import type { getUserProfile } from "@/lib/supabase/auth-server"
import type { UserSavedAddress } from "@/lib/supabase/orders"

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function orderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    awaiting_shipping_payment: "Esperando pago de envío",
    shipping_paid: "Envío pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }
  return map[status] ?? status
}

export function orderStatusClass(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "text-amber-700"
    case "paid":
      return "text-neutral-700"
    case "awaiting_shipping_payment":
      return "text-orange-700"
    case "shipping_paid":
      return "text-violet-700"
    case "shipped":
      return "text-violet-700"
    case "delivered":
      return "text-emerald-700"
    case "cancelled":
      return "text-[var(--gold)]"
    default:
      return "text-neutral-600"
  }
}

export const orderStatusBadgeClassName =
  "text-[11px] font-medium tracking-wide"

export function registrationStatusLabel(status: RegistrationStatus): string {
  const map = {
    pending: "Pendiente de pago",
    paid: "Pagada",
    cancelled: "Cancelada",
  } as const
  return map[status] ?? status
}

export function buildPrimaryAddress(profile: Awaited<ReturnType<typeof getUserProfile>>) {
  if (!profile) return null
  const parts = [
    profile.address?.trim(),
    profile.colonia?.trim(),
    profile.cp?.trim(),
    profile.municipio?.trim(),
    profile.city?.trim(),
    profile.state?.trim(),
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(", ") : null
}

export type AddressCardEntry = {
  id: string
  name: string
  postalCode: string | null
  country: string
  isPrimary: boolean
}

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}

type ParsedShippingFields = {
  name: string | null
  street: string | null
  postalCode: string | null
  city: string | null
  state: string | null
}

function parseFormattedShippingAddress(raw: string): ParsedShippingFields {
  const fields: ParsedShippingFields = {
    name: null,
    street: null,
    postalCode: null,
    city: null,
    state: null,
  }

  for (const line of raw.split("\n")) {
    const colon = line.indexOf(":")
    if (colon === -1) continue

    const label = normalizeLabel(line.slice(0, colon))
    const value = line.slice(colon + 1).trim()
    if (!value) continue

    if (label === "nombre") fields.name = value
    else if (label === "calle/num") fields.street = value
    else if (label === "cp") fields.postalCode = value
  }

  return fields
}

export function buildAddressList(
  profile: AuthUserProfile | null,
  savedAddresses: UserSavedAddress[]
): AddressCardEntry[] {
  const fallbackName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Cliente"

  const entries: AddressCardEntry[] = []

  if (profile?.address?.trim()) {
    entries.push({
      id: "profile-primary",
      name: fallbackName,
      postalCode: profile.cp ?? null,
      country: "México",
      isPrimary: true,
    })
  }

  for (const saved of savedAddresses) {
    const parsed = parseFormattedShippingAddress(saved.address)

    entries.push({
      id: `order-${saved.orderId}`,
      name: parsed.name ?? fallbackName,
      postalCode: parsed.postalCode,
      country: "México",
      isPrimary: false,
    })
  }

  if (entries.length > 0 && !entries.some((entry) => entry.isPrimary)) {
    entries[0].isPrimary = true
  }

  return entries
}
