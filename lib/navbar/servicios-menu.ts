import type { ServiceFilterRow, ServiceRow } from "@/lib/supabase/appointments"
import type { TiendaCategory } from "@/app/components/navbar/menuData"

export type ServiciosMenuGroup = {
  id: string
  name: string
  slug: string
  services: Array<{ id: string; name: string }>
}

export function buildServiciosMenuGroups(
  filters: ServiceFilterRow[],
  services: ServiceRow[]
): ServiciosMenuGroup[] {
  const servicesByFilter = new Map<string, Array<{ id: string; name: string }>>()

  for (const service of services) {
    if (!service.is_active || !service.filter_id) continue
    const list = servicesByFilter.get(service.filter_id) ?? []
    list.push({ id: service.id, name: service.name })
    servicesByFilter.set(service.filter_id, list)
  }

  const groups: ServiciosMenuGroup[] = []

  for (const filter of filters) {
    if (!filter.is_active) continue
    const filterServices = servicesByFilter.get(filter.id) ?? []
    groups.push({
      id: filter.id,
      name: filter.name,
      slug: filter.slug,
      services: filterServices.sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      ),
    })
  }

  return groups
}

/** Columna fija del megamenú — siempre visible junto a los filtros del admin. */
export const AGENDAR_MENU_CATEGORY: TiendaCategory = {
  label: "Agendar",
  slug: "agendar",
  href: "/servicios",
  subcategories: [
    { label: "Ver disponibilidad", href: "/servicios" },
    { label: "Agenda tu cita", href: "/servicios" },
    { label: "Elegir profesional", href: "/servicios" },
    { label: "Consultar horarios", href: "/servicios" },
  ],
}

export function serviciosMenuToCategories(groups: ServiciosMenuGroup[]): TiendaCategory[] {
  const filterCategories = groups.map((group) => ({
    label: group.name,
    slug: group.slug,
    href: `/servicios?categoria=${encodeURIComponent(group.slug)}`,
    subcategories: group.services.map((service) => ({
      label: service.name,
      href: `/servicios?servicio=${encodeURIComponent(service.id)}`,
    })),
  }))

  return [...filterCategories, AGENDAR_MENU_CATEGORY]
}
