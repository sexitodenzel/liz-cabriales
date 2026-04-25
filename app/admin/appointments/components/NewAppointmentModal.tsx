"use client"

import { useEffect, useMemo, useState } from "react"

import type {
  ProfessionalRow,
  ServiceRow,
} from "@/lib/supabase/appointments"

type Props = {
  professionals: ProfessionalRow[]
  services: ServiceRow[]
  defaultDate: string
  onClose: () => void
  onCreated: () => void
}

type UserSearchResult = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

type Slot = {
  start_time: string
  end_time: string
  professional_id: string
}

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

export default function NewAppointmentModal({
  professionals,
  services,
  defaultDate,
  onClose,
  onCreated,
}: Props) {
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [professionalId, setProfessionalId] = useState<string>("")
  const [date, setDate] = useState<string>(defaultDate)
  const [startTime, setStartTime] = useState<string>("")
  const [userQuery, setUserQuery] = useState("")
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  )
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Crear cliente desde admin (sub-flujo inline) ────────────────────────
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientFirstName, setNewClientFirstName] = useState("")
  const [newClientLastName, setNewClientLastName] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [creatingClient, setCreatingClient] = useState(false)
  const [createClientError, setCreateClientError] = useState<string | null>(
    null
  )

  const duration = useMemo(
    () =>
      services
        .filter((s) => serviceIds.includes(s.id))
        .reduce((sum, s) => sum + s.duration_min, 0),
    [services, serviceIds]
  )

  useEffect(() => {
    const handler = setTimeout(async () => {
      const q = userQuery.trim()
      if (q.length < 2) {
        setUserResults([])
        return
      }
      try {
        const res = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(q)}`
        )
        const json = await res.json()
        if (res.ok && !json.error) {
          setUserResults(json.data.users ?? [])
        }
      } catch {
        // noop
      }
    }, 250)
    return () => clearTimeout(handler)
  }, [userQuery])

  useEffect(() => {
    const fetchSlots = async () => {
      if (!date || !professionalId || duration === 0) {
        setSlots([])
        return
      }
      setLoadingSlots(true)
      try {
        const qs = new URLSearchParams({
          date,
          professional_id: professionalId,
          duration_min: String(duration),
        })
        const res = await fetch(
          `/api/appointments/availability?${qs.toString()}`
        )
        const json = await res.json()
        if (res.ok && !json.error) {
          setSlots(json.data.slots ?? [])
        } else {
          setSlots([])
        }
      } catch {
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [date, professionalId, duration])

  const toggleService = (id: string) => {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleCreateClient = async () => {
    setCreateClientError(null)
    if (
      !newClientFirstName.trim() ||
      !newClientLastName.trim() ||
      !newClientEmail.trim()
    ) {
      setCreateClientError("Completa nombre, apellido y email")
      return
    }
    setCreatingClient(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newClientFirstName.trim(),
          last_name: newClientLastName.trim(),
          email: newClientEmail.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setCreateClientError(
          json?.error?.message ?? "No se pudo crear el cliente"
        )
        return
      }
      const created: UserSearchResult = {
        id: json.data.user_id,
        first_name: json.data.first_name,
        last_name: json.data.last_name,
        email: json.data.email,
      }
      setSelectedUser(created)
      setUserQuery(
        [created.first_name, created.last_name].filter(Boolean).join(" ") ||
          created.email ||
          created.id
      )
      setUserResults([])
      setShowNewClientForm(false)
      setNewClientFirstName("")
      setNewClientLastName("")
      setNewClientEmail("")
    } catch {
      setCreateClientError("Error de red al crear el cliente")
    } finally {
      setCreatingClient(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (serviceIds.length === 0) {
      setError("Selecciona al menos un servicio")
      return
    }
    if (!professionalId) {
      setError("Selecciona un profesional")
      return
    }
    if (!startTime) {
      setError("Selecciona una hora de inicio")
      return
    }
    if (!selectedUser) {
      setError("Selecciona un usuario existente")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_ids: serviceIds,
          professional_id: professionalId,
          date,
          start_time: startTime,
          user_id: selectedUser.id,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "No se pudo crear la cita")
        return
      }
      onCreated()
    } catch {
      setError("Error de red al crear la cita")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Nueva cita manual</h2>
            <p className="text-xs text-neutral-500">
              La cita se registrará como pagada (sin cobro en la plataforma).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              Buscar usuario (email / nombre)
            </label>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => {
                setUserQuery(e.target.value)
                setSelectedUser(null)
              }}
              placeholder="Escribe al menos 2 caracteres"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
            />
            {userResults.length > 0 && !selectedUser && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
                {userResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(u)
                      setUserQuery(
                        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                          u.email ||
                          u.id
                      )
                      setUserResults([])
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  >
                    <div className="font-medium">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                        "Sin nombre"}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {u.email ?? "Sin email"}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <p className="mt-1 text-xs text-emerald-700">
                Usuario seleccionado: {selectedUser.email ?? selectedUser.id}
              </p>
            )}

            <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-neutral-700">
                  ¿Cliente sin cuenta?
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm((v) => !v)}
                  className="text-xs font-semibold text-[#8a6f1a] hover:underline"
                >
                  {showNewClientForm ? "Cerrar" : "Crear cliente nuevo"}
                </button>
              </div>
              {showNewClientForm && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={newClientFirstName}
                      onChange={(e) => setNewClientFirstName(e.target.value)}
                      placeholder="Nombre"
                      className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                    <input
                      type="text"
                      value={newClientLastName}
                      onChange={(e) => setNewClientLastName(e.target.value)}
                      placeholder="Apellido"
                      className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                  </div>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                  />
                  {createClientError && (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {createClientError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateClient}
                    disabled={creatingClient}
                    className="rounded-md bg-[#0a0a0a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingClient ? "Creando…" : "Guardar cliente"}
                  </button>
                  <p className="text-[11px] text-neutral-500">
                    Se enviará un correo al cliente para que establezca su
                    contraseña con &quot;Olvidé mi contraseña&quot;.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600">
              Servicios
            </label>
            <div className="mt-1 grid max-h-52 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-neutral-200 p-2 sm:grid-cols-2">
              {services.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-neutral-50"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
                    <span>
                      {s.name}{" "}
                      <span className="text-xs text-neutral-500">
                        ({s.duration_min} min)
                      </span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold">${s.price}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-600">
                Profesional
              </label>
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              >
                <option value="">Selecciona…</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600">
              Hora de inicio (duración total {duration} min)
            </label>
            {loadingSlots ? (
              <p className="mt-1 text-sm text-neutral-500">Cargando…</p>
            ) : slots.length === 0 ? (
              <p className="mt-1 text-sm text-neutral-500">
                Sin horarios disponibles.
              </p>
            ) : (
              <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
                  const active = startTime === slot.start_time
                  return (
                    <button
                      key={slot.start_time}
                      type="button"
                      onClick={() => setStartTime(slot.start_time)}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        active
                          ? "border-[#C9A84C] bg-[#fdf8ea] font-semibold"
                          : "border-neutral-200 bg-white hover:border-[#C9A84C]/60"
                      }`}
                    >
                      {formatTimeLabel(slot.start_time)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Guardando…" : "Crear cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
