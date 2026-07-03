"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Pencil, Trash2 } from "lucide-react"

import type {
  ServiceFilterRow,
  ServiceOptionRow,
  ServiceRow,
} from "@/lib/supabase/appointments"
import { toast } from "@/app/components/ui/motion/toast-provider"

type Props = {
  services: ServiceRow[]
  filters: ServiceFilterRow[]
  onServicesChange: (services: ServiceRow[]) => void
  onFiltersChange: (filters: ServiceFilterRow[]) => void
  onBookingRefresh?: () => void | Promise<void>
}

type ServiceForm = {
  name: string
  description: string
  price: string
  duration_min: string
  show_options: boolean
  filter_id: string
}

const EMPTY_SERVICE: ServiceForm = {
  name: "",
  description: "",
  price: "",
  duration_min: "60",
  show_options: false,
  filter_id: "",
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

export default function ServicesPanel({
  services,
  filters,
  onServicesChange,
  onFiltersChange,
  onBookingRefresh,
}: Props) {
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    null
  )
  const [newFilterName, setNewFilterName] = useState("")
  const [addingFilter, setAddingFilter] = useState(false)
  const [confirmDeleteFilterId, setConfirmDeleteFilterId] = useState<
    string | null
  >(null)
  const [deletingFilterId, setDeletingFilterId] = useState<string | null>(null)
  const [serviceOptions, setServiceOptions] = useState<
    Record<string, ServiceOptionRow[]>
  >({})
  const [draftLabels, setDraftLabels] = useState<Record<string, string>>({})
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({})
  const [loadingOptions, setLoadingOptions] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<ServiceRow | null>(null)
  const [serviceForm, setServiceForm] = useState<ServiceForm>(EMPTY_SERVICE)
  const [savingService, setSavingService] = useState(false)

  const activeCount = services.filter((s) => s.is_active).length

  async function loadServiceOptions(serviceId: string) {
    setLoadingOptions(serviceId)
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/options`)
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudieron cargar las opciones")
        return
      }

      const rows: ServiceOptionRow[] = (json.data.links ?? [])
        .filter(
          (link: { is_enabled: boolean; option: ServiceOptionRow | null }) =>
            link.is_enabled && link.option
        )
        .map(
          (link: { option: ServiceOptionRow }) => link.option
        )

      setServiceOptions((prev) => ({ ...prev, [serviceId]: rows }))
    } catch {
      toast.error("Error de red al cargar opciones")
    } finally {
      setLoadingOptions(null)
    }
  }

  useEffect(() => {
    if (expandedServiceId) {
      void loadServiceOptions(expandedServiceId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedServiceId])

  async function refreshFiltersFromApi() {
    try {
      const res = await fetch("/api/admin/service-filters")
      const json = await res.json()
      if (res.ok && json.data?.filters) {
        onFiltersChange(json.data.filters as ServiceFilterRow[])
      }
    } catch {
      // noop
    }
  }

  async function openCreateService() {
    await refreshFiltersFromApi()
    setEditingService(null)
    setServiceForm(EMPTY_SERVICE)
    setShowServiceModal(true)
  }

  async function openEditService(service: ServiceRow) {
    await refreshFiltersFromApi()
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description ?? "",
      price: String(service.price),
      duration_min: String(service.duration_min),
      show_options: service.show_options,
      filter_id: service.filter_id ?? "",
    })
    setShowServiceModal(true)
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault()
    const name = serviceForm.name.trim()
    const price = Number(serviceForm.price)
    const duration_min = Number(serviceForm.duration_min)

    if (!name) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Precio inválido")
      return
    }
    if (!Number.isFinite(duration_min) || duration_min < 15) {
      toast.error("Duración inválida")
      return
    }

    setSavingService(true)
    try {
      const payload = {
        name,
        description: serviceForm.description.trim() || null,
        price,
        duration_min,
        show_options: serviceForm.show_options,
        filter_id: serviceForm.filter_id || null,
      }

      const res = editingService
        ? await fetch(`/api/admin/services/${editingService.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo guardar el servicio")
        return
      }

      const saved = json.data.service as ServiceRow
      if (editingService) {
        onServicesChange(
          services
            .map((s) => (s.id === saved.id ? saved : s))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        toast.success("Servicio actualizado")
      } else {
        onServicesChange(
          [...services, saved].sort((a, b) => a.name.localeCompare(b.name))
        )
        toast.success("Servicio agregado")
      }

      onBookingRefresh?.()
      setShowServiceModal(false)
    } catch {
      toast.error("Error de red al guardar servicio")
    } finally {
      setSavingService(false)
    }
  }

  async function handleToggleServiceActive(service: ServiceRow) {
    setBusyId(service.id)
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar")
        return
      }
      const updated = json.data.service as ServiceRow
      onServicesChange(services.map((s) => (s.id === updated.id ? updated : s)))
      onBookingRefresh?.()
      toast.success(
        updated.is_active ? "Servicio activado" : "Servicio desactivado"
      )
    } catch {
      toast.error("Error de red")
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteService(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar")
        return
      }
      onServicesChange(services.filter((s) => s.id !== id))
      setConfirmDeleteId(null)
      if (expandedServiceId === id) setExpandedServiceId(null)
      onBookingRefresh?.()
      toast.success("Servicio eliminado")
    } catch {
      toast.error("Error de red al eliminar")
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleShowOptions(service: ServiceRow) {
    setBusyId(service.id)
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_options: !service.show_options }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar")
        return
      }
      const updated = json.data.service as ServiceRow
      onServicesChange(services.map((s) => (s.id === updated.id ? updated : s)))
      onBookingRefresh?.()
    } catch {
      toast.error("Error de red")
    } finally {
      setBusyId(null)
    }
  }

  async function handleAddOption(serviceId: string) {
    const label = (draftLabels[serviceId] ?? "").trim()
    if (!label) {
      toast.error("Escribe el complemento antes de agregar")
      return
    }

    const priceRaw = (draftPrices[serviceId] ?? "").trim()
    const price_delta = priceRaw === "" ? 0 : Number(priceRaw)
    if (!Number.isFinite(price_delta) || price_delta < 0) {
      toast.error("Precio del complemento inválido")
      return
    }

    setBusyId(serviceId)
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, price_delta }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo agregar la opción")
        return
      }

      const created = json.data.option as ServiceOptionRow
      setServiceOptions((prev) => ({
        ...prev,
        [serviceId]: [...(prev[serviceId] ?? []), created],
      }))
      setDraftLabels((prev) => ({ ...prev, [serviceId]: "" }))
      setDraftPrices((prev) => ({ ...prev, [serviceId]: "" }))

      onServicesChange(
        services.map((s) =>
          s.id === serviceId ? { ...s, show_options: true } : s
        )
      )
      onBookingRefresh?.()
      toast.success("Opción agregada")
    } catch {
      toast.error("Error de red al agregar opción")
    } finally {
      setBusyId(null)
    }
  }

  async function handleUpdateOptionPrice(
    serviceId: string,
    optionId: string,
    priceRaw: string
  ) {
    const price_delta = priceRaw.trim() === "" ? 0 : Number(priceRaw)
    if (!Number.isFinite(price_delta) || price_delta < 0) {
      toast.error("Precio inválido")
      return
    }

    setBusyId(optionId)
    try {
      const res = await fetch(`/api/admin/service-options/${optionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_delta }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar el precio")
        return
      }

      const updated = json.data.option as ServiceOptionRow
      setServiceOptions((prev) => ({
        ...prev,
        [serviceId]: (prev[serviceId] ?? []).map((o) =>
          o.id === optionId ? updated : o
        ),
      }))
      onBookingRefresh?.()
      toast.success("Precio actualizado")
    } catch {
      toast.error("Error de red al actualizar precio")
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemoveOption(serviceId: string, optionId: string) {
    setBusyId(optionId)
    try {
      const res = await fetch(
        `/api/admin/services/${serviceId}/options?option_id=${optionId}`,
        { method: "DELETE" }
      )
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar")
        return
      }

      setServiceOptions((prev) => ({
        ...prev,
        [serviceId]: (prev[serviceId] ?? []).filter((o) => o.id !== optionId),
      }))
      onBookingRefresh?.()
      toast.success("Opción eliminada")
    } catch {
      toast.error("Error de red al eliminar")
    } finally {
      setBusyId(null)
    }
  }

  async function handleAddFilter() {
    const name = newFilterName.trim()
    if (!name) {
      toast.error("Escribe el nombre del filtro")
      return
    }

    setAddingFilter(true)
    try {
      const res = await fetch("/api/admin/service-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo crear el filtro")
        return
      }

      const created = json.data.filter as ServiceFilterRow
      onFiltersChange(
        [...filters, created].sort(
          (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
        )
      )
      if (showServiceModal) {
        setServiceForm((f) => ({ ...f, filter_id: created.id }))
      }
      setNewFilterName("")
      await onBookingRefresh?.()
      toast.success("Filtro agregado")
    } catch {
      toast.error("Error de red al agregar filtro")
    } finally {
      setAddingFilter(false)
    }
  }

  async function handleDeleteFilter(id: string) {
    setDeletingFilterId(id)
    try {
      const res = await fetch(`/api/admin/service-filters/${id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar el filtro")
        return
      }

      onFiltersChange(filters.filter((f) => f.id !== id))
      setConfirmDeleteFilterId(null)
      if (serviceForm.filter_id === id) {
        setServiceForm((f) => ({ ...f, filter_id: "" }))
      }
      await onBookingRefresh?.()
      toast.success("Filtro eliminado")
    } catch {
      toast.error("Error de red al eliminar filtro")
    } finally {
      setDeletingFilterId(null)
    }
  }

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Filtros en /servicios
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Manos, Pies u otros que agregues. Cada servicio elige en cuál aparece.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((filter) => {
              const confirming = confirmDeleteFilterId === filter.id
              const deleting = deletingFilterId === filter.id
              return (
                <span
                  key={filter.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a84c]/40 bg-[#fdfaf3] py-1 pl-3 pr-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#111]"
                >
                  {filter.name}
                  {confirming ? (
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteFilter(filter.id)}
                        disabled={deleting}
                        className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {deleting ? "…" : "Sí"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteFilterId(null)}
                        disabled={deleting}
                        className="rounded-full border border-neutral-300 px-2 py-0.5 text-[10px] text-neutral-600 hover:border-neutral-400"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteFilterId(filter.id)}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar filtro ${filter.name}`}
                      title="Eliminar filtro"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void handleAddFilter()
                }
              }}
              placeholder="Ej. Faciales, Depilación"
              className="min-w-[200px] flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
            />
            <button
              type="button"
              onClick={handleAddFilter}
              disabled={addingFilter}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#111] hover:border-[#c9a84c] disabled:opacity-50"
            >
              Añadir más filtros
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Servicios
            </p>
            <p className="mt-1 font-[family-name:var(--font-playfair),serif] text-2xl font-medium text-[#111]">
              {services.length}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {activeCount} activo{activeCount === 1 ? "" : "s"} en /servicios
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateService}
            className="rounded-lg bg-[#111] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c9a84c] hover:text-[#111]"
          >
            Agregar servicio
          </button>
        </div>

        {services.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-neutral-500">
            Aún no hay servicios. Agrégalos para que aparezcan al reservar citas.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {services.map((service) => {
              const expanded = expandedServiceId === service.id
              const opts = serviceOptions[service.id] ?? []

              return (
                <li key={service.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${
                          service.is_active ? "text-[#111]" : "text-neutral-400"
                        }`}
                      >
                        {service.name}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatPrice(service.price)} · {service.duration_min} min
                        {service.filter_name ? ` · ${service.filter_name}` : ""}
                        {service.show_options
                          ? ` · ${opts.length} opción${opts.length === 1 ? "" : "es"}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedServiceId(expanded ? null : service.id)
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-600 hover:border-[#c9a84c]"
                      >
                        Opciones
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditService(service)}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-600 hover:border-[#c9a84c]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleServiceActive(service)}
                        disabled={busyId === service.id}
                        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-600 hover:border-[#c9a84c] disabled:opacity-40"
                      >
                        {service.is_active ? "Desactivar" : "Activar"}
                      </button>
                      {confirmDeleteId === service.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(service.id)}
                            disabled={busyId === service.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-medium text-neutral-600"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(service.id)}
                          disabled={busyId === service.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-600 hover:border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 rounded-lg border border-neutral-100 bg-neutral-50/80 p-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111]">
                        <input
                          type="checkbox"
                          checked={service.show_options}
                          onChange={() => handleToggleShowOptions(service)}
                          disabled={busyId === service.id}
                        />
                        Mostrar lista de complementos al reservar en /servicios
                      </label>

                      {loadingOptions === service.id ? (
                        <p className="mt-3 text-xs text-neutral-500">
                          Cargando opciones…
                        </p>
                      ) : (
                        <>
                          {opts.length > 0 && (
                            <ul className="mt-4 space-y-2 border-l-2 border-[#c9a84c]/40 pl-4">
                              {opts.map((opt) => (
                                <li
                                  key={opt.id}
                                  className="flex flex-wrap items-center justify-between gap-2 py-1"
                                >
                                  <span className="min-w-0 flex-1 text-sm italic text-[#111]">
                                    {opt.label}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <label className="sr-only" htmlFor={`opt-price-${opt.id}`}>
                                      Precio de {opt.label}
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-medium text-[#c9a84c]">
                                        +
                                      </span>
                                      <input
                                        id={`opt-price-${opt.id}`}
                                        type="number"
                                        min={0}
                                        step={1}
                                        defaultValue={opt.price_delta}
                                        key={`${opt.id}-${opt.price_delta}`}
                                        onBlur={(e) => {
                                          const next = e.target.value
                                          if (Number(next) === opt.price_delta) return
                                          void handleUpdateOptionPrice(
                                            service.id,
                                            opt.id,
                                            next
                                          )
                                        }}
                                        disabled={busyId === opt.id}
                                        className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-right text-sm outline-none focus:border-[#c9a84c] disabled:opacity-50"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveOption(service.id, opt.id)
                                      }
                                      disabled={busyId === opt.id}
                                      className="text-[11px] font-semibold uppercase tracking-[0.08em] text-red-600 hover:text-red-700 disabled:opacity-40"
                                    >
                                      Quitar
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="mt-4 flex flex-wrap items-end gap-2">
                            <input
                              type="text"
                              value={draftLabels[service.id] ?? ""}
                              onChange={(e) =>
                                setDraftLabels((prev) => ({
                                  ...prev,
                                  [service.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  void handleAddOption(service.id)
                                }
                              }}
                              placeholder="Nombre del complemento"
                              className="min-w-[180px] flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
                            />
                            <div>
                              <label
                                htmlFor={`draft-price-${service.id}`}
                                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500"
                              >
                                Precio (+)
                              </label>
                              <input
                                id={`draft-price-${service.id}`}
                                type="number"
                                min={0}
                                step={1}
                                value={draftPrices[service.id] ?? ""}
                                onChange={(e) =>
                                  setDraftPrices((prev) => ({
                                    ...prev,
                                    [service.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    void handleAddOption(service.id)
                                  }
                                }}
                                placeholder="0"
                                className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-right text-sm outline-none focus:border-[#c9a84c]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddOption(service.id)}
                              disabled={busyId === service.id}
                              className="rounded-lg bg-[#111] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#c9a84c] hover:text-[#111] disabled:opacity-50"
                            >
                              Agregar
                            </button>
                          </div>
                          <p className="mt-2 text-[11px] text-neutral-500">
                            Cada complemento aparece en /servicios con su precio
                            (+$) y se suma al total del servicio al seleccionarlo.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-[#111]">
              {editingService ? "Editar servicio" : "Agregar servicio"}
            </h2>
            <form onSubmit={handleSaveService} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Nombre
                </label>
                <input
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Descripción
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Precio (MXN)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={serviceForm.duration_min}
                    onChange={(e) =>
                      setServiceForm((f) => ({
                        ...f,
                        duration_min: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Filtro en /servicios
                </label>
                <select
                  value={serviceForm.filter_id}
                  onChange={(e) =>
                    setServiceForm((f) => ({
                      ...f,
                      filter_id: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
                >
                  <option value="">Sin filtro</option>
                  {filters.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9a84c] hover:text-[#111] disabled:opacity-50"
                >
                  {savingService ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
