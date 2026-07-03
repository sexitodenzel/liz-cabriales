import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  EnabledServiceOption,
  ServiceFilterRow,
  ServiceOptionRow,
  ServiceOptionType,
  ServiceRow,
  ServiceWithOptions,
} from "@/lib/supabase/appointments"
import type {
  AdminServiceCreateInput,
  AdminServiceOptionCreateInput,
  AdminServiceOptionUpdateInput,
  AdminServiceUpdateInput,
} from "@/lib/validations/services"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

const SERVICE_COLUMNS_BASE =
  "id, name, description, price, duration_min, is_active"
const SERVICE_COLUMNS_FULL = `${SERVICE_COLUMNS_BASE}, show_options`
const SERVICE_COLUMNS_FILTER = `${SERVICE_COLUMNS_FULL}, filter_id`
const SERVICE_SELECT_WITH_JOIN = `${SERVICE_COLUMNS_FILTER}, service_filters ( id, name, slug )`

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function slugifyFilterName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

function isMissingColumnError(
  error: { message?: string; code?: string },
  column: string
): boolean {
  if (error.code === "42703") return true
  const msg = (error.message ?? "").toLowerCase()
  return (
    msg.includes(column.toLowerCase()) &&
    (msg.includes("does not exist") || msg.includes("column"))
  )
}

function isMissingTableError(
  error: { message?: string; code?: string },
  table: string
): boolean {
  if (error.code === "42P01") return true
  const msg = (error.message ?? "").toLowerCase()
  return (
    msg.includes(table.toLowerCase()) &&
    (msg.includes("does not exist") || msg.includes("relation"))
  )
}

type QueryServiceOpts = {
  activeOnly?: boolean
  ids?: string[]
}

export async function queryServiceRows(
  client: SupabaseClient,
  opts: QueryServiceOpts = {}
): Promise<Result<Record<string, unknown>[]>> {
  return queryServiceRecords(client, opts)
}

function mapServiceRow(r: Record<string, unknown>): ServiceRow {
  const filterJoin = unwrapJoin(
    r.service_filters as { name?: string; slug?: string } | null
  )

  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    price: Number(r.price),
    duration_min: Number(r.duration_min),
    is_active: Boolean(r.is_active),
    show_options: Boolean(r.show_options ?? false),
    filter_id: (r.filter_id as string | null) ?? null,
    filter_slug: filterJoin?.slug ?? null,
    filter_name: filterJoin?.name ?? null,
  }
}

function mapFilterRow(r: Record<string, unknown>): ServiceFilterRow {
  return {
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    sort_order: Number(r.sort_order ?? 0),
    is_active: Boolean(r.is_active),
  }
}

async function queryServiceRecords(
  client: SupabaseClient,
  opts: QueryServiceOpts = {}
): Promise<Result<Record<string, unknown>[]>> {
  const run = (select: string) => {
    let query = client.from("services").select(select)
    if (opts.ids?.length) query = query.in("id", opts.ids)
    if (opts.activeOnly) query = query.eq("is_active", true)
    return query.order("name", { ascending: true })
  }

  let result = await run(SERVICE_SELECT_WITH_JOIN)
  if (
    result.error &&
    (isMissingColumnError(result.error, "filter_id") ||
      isMissingTableError(result.error, "service_filters"))
  ) {
    result = await run(SERVICE_COLUMNS_FULL)
  }
  if (result.error && isMissingColumnError(result.error, "show_options")) {
    result = await run(SERVICE_COLUMNS_BASE)
  }

  if (result.error) {
    return {
      data: null,
      error: { message: result.error.message, code: result.error.code },
    }
  }

  return { data: (result.data ?? []) as unknown as Record<string, unknown>[], error: null }
}

function mapOptionRow(r: Record<string, unknown>): ServiceOptionRow {
  return {
    id: r.id as string,
    label: r.label as string,
    option_type: r.option_type as ServiceOptionType,
    price_delta: Number(r.price_delta),
    duration_delta: Number(r.duration_delta),
    is_active: Boolean(r.is_active),
    sort_order: Number(r.sort_order ?? 0),
  }
}

export async function getAdminServices(): Promise<Result<ServiceRow[]>> {
  const result = await queryServiceRows(supabaseAdmin)
  if (!result.data) return result

  return { data: result.data.map(mapServiceRow), error: null }
}

export async function createService(
  input: AdminServiceCreateInput
): Promise<Result<ServiceRow>> {
  const { data, error } = await supabaseAdmin
    .from("services")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      duration_min: input.duration_min,
      is_active: true,
      show_options: input.show_options ?? false,
      filter_id: input.filter_id ?? null,
    })
    .select(SERVICE_SELECT_WITH_JOIN)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear el servicio",
        code: error?.code,
      },
    }
  }

  return { data: mapServiceRow(data), error: null }
}

export async function updateService(
  id: string,
  input: AdminServiceUpdateInput
): Promise<Result<ServiceRow>> {
  const updates: Record<string, unknown> = {}

  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null
  }
  if (input.price !== undefined) updates.price = input.price
  if (input.duration_min !== undefined) updates.duration_min = input.duration_min
  if (input.is_active !== undefined) updates.is_active = input.is_active
  if (input.show_options !== undefined) updates.show_options = input.show_options
  if (input.filter_id !== undefined) updates.filter_id = input.filter_id
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("services")
    .update(updates)
    .eq("id", id)
    .select(SERVICE_SELECT_WITH_JOIN)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar el servicio",
        code: error?.code,
      },
    }
  }

  return { data: mapServiceRow(data), error: null }
}

export async function deleteService(id: string): Promise<Result<null>> {
  const { count, error: countError } = await supabaseAdmin
    .from("appointment_services")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id)

  if (countError) {
    return {
      data: null,
      error: { message: countError.message, code: countError.code },
    }
  }

  if ((count ?? 0) > 0) {
    return {
      data: null,
      error: {
        message:
          "Este servicio tiene citas registradas. Desactívalo en lugar de eliminarlo.",
        code: "HAS_APPOINTMENTS",
      },
    }
  }

  const { error } = await supabaseAdmin.from("services").delete().eq("id", id)
  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}

export async function getAdminServiceOptions(): Promise<
  Result<ServiceOptionRow[]>
> {
  const { data, error } = await supabaseAdmin
    .from("service_options")
    .select(
      "id, label, option_type, price_delta, duration_delta, is_active, sort_order"
    )
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: (data ?? []).map(mapOptionRow), error: null }
}

export async function createServiceOption(
  input: AdminServiceOptionCreateInput
): Promise<Result<ServiceOptionRow>> {
  const { data, error } = await supabaseAdmin
    .from("service_options")
    .insert({
      label: input.label.trim(),
      option_type: input.option_type,
      price_delta: input.price_delta ?? 0,
      duration_delta: input.duration_delta ?? 0,
      sort_order: input.sort_order ?? 0,
      is_active: true,
    })
    .select(
      "id, label, option_type, price_delta, duration_delta, is_active, sort_order"
    )
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear la opción",
        code: error?.code,
      },
    }
  }

  return { data: mapOptionRow(data), error: null }
}

export async function updateServiceOption(
  id: string,
  input: AdminServiceOptionUpdateInput
): Promise<Result<ServiceOptionRow>> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.label !== undefined) updates.label = input.label.trim()
  if (input.option_type !== undefined) updates.option_type = input.option_type
  if (input.price_delta !== undefined) updates.price_delta = input.price_delta
  if (input.duration_delta !== undefined) {
    updates.duration_delta = input.duration_delta
  }
  if (input.is_active !== undefined) updates.is_active = input.is_active
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order

  const { data, error } = await supabaseAdmin
    .from("service_options")
    .update(updates)
    .eq("id", id)
    .select(
      "id, label, option_type, price_delta, duration_delta, is_active, sort_order"
    )
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar la opción",
        code: error?.code,
      },
    }
  }

  return { data: mapOptionRow(data), error: null }
}

export async function deleteServiceOption(id: string): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("service_options")
    .delete()
    .eq("id", id)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}

export type ServiceOptionLinkRow = {
  option_id: string
  is_enabled: boolean
  option: ServiceOptionRow | null
}

export async function getServiceOptionLinks(
  serviceId: string
): Promise<Result<ServiceOptionLinkRow[]>> {
  const { data, error } = await supabaseAdmin
    .from("service_option_links")
    .select(
      `option_id, is_enabled,
       service_options ( id, label, option_type, price_delta, duration_delta, is_active, sort_order )`
    )
    .eq("service_id", serviceId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows: ServiceOptionLinkRow[] = (data ?? []).map((row) => {
    const raw = row as {
      option_id: string
      is_enabled: boolean
      service_options:
        | Record<string, unknown>
        | Record<string, unknown>[]
        | null
    }
    const optRaw = Array.isArray(raw.service_options)
      ? raw.service_options[0]
      : raw.service_options

    return {
      option_id: raw.option_id,
      is_enabled: Boolean(raw.is_enabled),
      option: optRaw ? mapOptionRow(optRaw) : null,
    }
  })

  return { data: rows, error: null }
}

export async function addOptionToService(
  serviceId: string,
  input: {
    label: string
    price_delta?: number
    duration_delta?: number
    option_type?: ServiceOptionType
  }
): Promise<Result<ServiceOptionRow>> {
  const created = await createServiceOption({
    label: input.label.trim(),
    option_type: input.option_type ?? "nail_type",
    price_delta: input.price_delta ?? 0,
    duration_delta: input.duration_delta ?? 0,
  })
  if (!created.data) return created

  const { error: linkError } = await supabaseAdmin
    .from("service_option_links")
    .upsert({
      service_id: serviceId,
      option_id: created.data.id,
      is_enabled: true,
    })

  if (linkError) {
    await deleteServiceOption(created.data.id)
    return {
      data: null,
      error: { message: linkError.message, code: linkError.code },
    }
  }

  await updateService(serviceId, { show_options: true })

  return created
}

export async function removeOptionFromService(
  serviceId: string,
  optionId: string
): Promise<Result<null>> {
  const { error: unlinkError } = await supabaseAdmin
    .from("service_option_links")
    .delete()
    .eq("service_id", serviceId)
    .eq("option_id", optionId)

  if (unlinkError) {
    return {
      data: null,
      error: { message: unlinkError.message, code: unlinkError.code },
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("service_options")
    .delete()
    .eq("id", optionId)

  if (deleteError) {
    return {
      data: null,
      error: { message: deleteError.message, code: deleteError.code },
    }
  }

  return { data: null, error: null }
}

export async function setServiceOptionLinks(
  serviceId: string,
  links: Array<{ option_id: string; is_enabled: boolean }>
): Promise<Result<null>> {
  const { error: deleteError } = await supabaseAdmin
    .from("service_option_links")
    .delete()
    .eq("service_id", serviceId)

  if (deleteError) {
    return {
      data: null,
      error: { message: deleteError.message, code: deleteError.code },
    }
  }

  if (links.length === 0) {
    return { data: null, error: null }
  }

  const { error: insertError } = await supabaseAdmin
    .from("service_option_links")
    .insert(
      links.map((link) => ({
        service_id: serviceId,
        option_id: link.option_id,
        is_enabled: link.is_enabled,
      }))
    )

  if (insertError) {
    return {
      data: null,
      error: { message: insertError.message, code: insertError.code },
    }
  }

  return { data: null, error: null }
}

async function attachOptionsToServices(
  services: ServiceRow[]
): Promise<ServiceWithOptions[]> {
  if (services.length === 0) return []

  const serviceIds = services.map((s) => s.id)

  const { data: linkRows, error } = await supabaseAdmin
    .from("service_option_links")
    .select(
      `service_id, is_enabled,
       service_options ( id, label, option_type, price_delta, duration_delta, is_active, sort_order )`
    )
    .in("service_id", serviceIds)
    .eq("is_enabled", true)

  if (error) {
    if (isMissingTableError(error, "service_option_links")) {
      return services.map((service) => ({ ...service, options: [] }))
    }
    return services.map((service) => ({ ...service, options: [] }))
  }

  const optionsByService = new Map<string, EnabledServiceOption[]>()

  for (const row of linkRows ?? []) {
    const raw = row as {
      service_id: string
      is_enabled: boolean
      service_options:
        | Record<string, unknown>
        | Record<string, unknown>[]
        | null
    }
    const optRaw = Array.isArray(raw.service_options)
      ? raw.service_options[0]
      : raw.service_options
    if (!optRaw || !raw.is_enabled) continue

    const opt = mapOptionRow(optRaw)
    if (!opt.is_active) continue

    const list = optionsByService.get(raw.service_id) ?? []
    list.push({
      id: opt.id,
      label: opt.label,
      option_type: opt.option_type,
      price_delta: opt.price_delta,
      duration_delta: opt.duration_delta,
    })
    optionsByService.set(raw.service_id, list)
  }

  return services.map((service) => ({
    ...service,
    options: (optionsByService.get(service.id) ?? []).sort((a, b) => {
      if (a.option_type !== b.option_type) {
        return a.option_type === "nail_type" ? -1 : 1
      }
      return a.label.localeCompare(b.label, "es")
    }),
  }))
}

export async function getPublicServicesWithOptions(): Promise<
  Result<ServiceWithOptions[]>
> {
  const result = await queryServiceRecords(supabaseAdmin, { activeOnly: true })
  if (!result.data) return result

  const services = result.data.map(mapServiceRow)
  const withOptions = await attachOptionsToServices(services)
  return { data: withOptions, error: null }
}

export async function getServiceFilters(
  activeOnly = false
): Promise<Result<ServiceFilterRow[]>> {
  let query = supabaseAdmin
    .from("service_filters")
    .select("id, name, slug, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (activeOnly) query = query.eq("is_active", true)

  const { data, error } = await query

  if (error) {
    if (isMissingTableError(error, "service_filters")) {
      return {
        data: [
          { id: "manos", name: "Manos", slug: "manos", sort_order: 1, is_active: true },
          { id: "pies", name: "Pies", slug: "pies", sort_order: 2, is_active: true },
        ],
        error: null,
      }
    }
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: (data ?? []).map(mapFilterRow), error: null }
}

export async function getPublicServiceFilters(): Promise<
  Result<ServiceFilterRow[]>
> {
  return getServiceFilters(true)
}

export async function createServiceFilter(
  name: string
): Promise<Result<ServiceFilterRow>> {
  const trimmed = name.trim()
  if (!trimmed) {
    return {
      data: null,
      error: { message: "El nombre es obligatorio", code: "VALIDATION_ERROR" },
    }
  }

  const baseSlug = slugifyFilterName(trimmed) || "filtro"
  let slug = baseSlug
  let attempt = 1

  while (attempt < 20) {
    const { data, error } = await supabaseAdmin
      .from("service_filters")
      .insert({ name: trimmed, slug, is_active: true })
      .select("id, name, slug, sort_order, is_active")
      .single()

    if (!error && data) {
      return { data: mapFilterRow(data), error: null }
    }

    if (error?.code === "23505") {
      slug = `${baseSlug}-${attempt}`
      attempt += 1
      continue
    }

    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear el filtro",
        code: error?.code,
      },
    }
  }

  return {
    data: null,
    error: { message: "No se pudo generar un slug único", code: "VALIDATION_ERROR" },
  }
}

export async function deleteServiceFilter(id: string): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("service_filters")
    .delete()
    .eq("id", id)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}

export type ResolvedServiceOption = EnabledServiceOption & {
  service_id: string
}

export async function resolveSelectedServiceOptions(
  selections: Array<{ service_id: string; option_ids: string[] }>
): Promise<Result<ResolvedServiceOption[]>> {
  if (selections.length === 0) return { data: [], error: null }

  const serviceIds = [...new Set(selections.map((s) => s.service_id))]
  const optionIds = [
    ...new Set(selections.flatMap((s) => s.option_ids)),
  ]

  if (optionIds.length === 0) return { data: [], error: null }

  const { data: linkRows, error } = await supabaseAdmin
    .from("service_option_links")
    .select(
      `service_id, is_enabled,
       service_options ( id, label, option_type, price_delta, duration_delta, is_active )`
    )
    .in("service_id", serviceIds)
    .in("option_id", optionIds)
    .eq("is_enabled", true)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const allowed = new Map<string, EnabledServiceOption>()
  for (const row of linkRows ?? []) {
    const raw = row as {
      service_id: string
      is_enabled: boolean
      service_options:
        | Record<string, unknown>
        | Record<string, unknown>[]
        | null
    }
    const optRaw = Array.isArray(raw.service_options)
      ? raw.service_options[0]
      : raw.service_options
    if (!optRaw || !raw.is_enabled) continue

    const opt = mapOptionRow(optRaw)
    if (!opt.is_active) continue

    allowed.set(`${raw.service_id}:${opt.id}`, {
      id: opt.id,
      label: opt.label,
      option_type: opt.option_type,
      price_delta: opt.price_delta,
      duration_delta: opt.duration_delta,
    })
  }

  const resolved: ResolvedServiceOption[] = []

  for (const selection of selections) {
    for (const optionId of selection.option_ids) {
      const key = `${selection.service_id}:${optionId}`
      const option = allowed.get(key)
      if (!option) {
        return {
          data: null,
          error: {
            message: "Una o más opciones seleccionadas no están disponibles",
            code: "INVALID_SERVICE_OPTION",
          },
        }
      }
      resolved.push({ ...option, service_id: selection.service_id })
    }
  }

  return { data: resolved, error: null }
}

export async function insertAppointmentServiceOptions(
  appointmentId: string,
  options: ResolvedServiceOption[]
): Promise<Result<null>> {
  if (options.length === 0) return { data: null, error: null }

  const { error } = await supabaseAdmin.from("appointment_service_options").insert(
    options.map((opt) => ({
      appointment_id: appointmentId,
      service_id: opt.service_id,
      option_id: opt.id,
      option_label: opt.label,
      option_type: opt.option_type,
      price_delta: opt.price_delta,
      duration_delta: opt.duration_delta,
    }))
  )

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}
