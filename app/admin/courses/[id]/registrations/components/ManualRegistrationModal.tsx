"use client"

import { useEffect, useState } from "react"

type UserSearchResult = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

type Props = {
  courseId: string
  onClose: () => void
  onCreated: () => void
}

export default function ManualRegistrationModal({
  courseId,
  onClose,
  onCreated,
}: Props) {
  const [userQuery, setUserQuery] = useState("")
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  )
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [attendees, setAttendees] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
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
    return () => clearTimeout(timer)
  }, [userQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedUser && !clientName.trim()) {
      setError(
        "Selecciona un usuario existente o proporciona el nombre del cliente"
      )
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        attendees,
      }
      if (selectedUser) body.user_id = selectedUser.id
      if (clientName.trim()) body.client_name = clientName.trim()
      if (clientEmail.trim()) body.client_email = clientEmail.trim()

      const res = await fetch(
        `/api/admin/courses/${courseId}/registrations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(
          json?.error?.message ?? "No se pudo registrar al alumno"
        )
        return
      }
      onCreated()
    } catch {
      setError("Error de red al registrar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-[#0a0a0a] shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Agregar alumno manual</h2>
            <p className="text-xs text-neutral-500">
              La inscripción se registrará como pagada (sin cobro en la
              plataforma).
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
                      setClientName(
                        [u.first_name, u.last_name]
                          .filter(Boolean)
                          .join(" ") ?? ""
                      )
                      setClientEmail(u.email ?? "")
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
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              O captura los datos del cliente
            </p>
            <p className="mt-1 text-[11px] leading-4 text-neutral-500">
              Se registrarán como referencia. La base de datos requiere un
              usuario vinculado para completar la inscripción.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Nombre
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600">
              Asistentes
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={attendees}
              onChange={(e) =>
                setAttendees(Math.max(1, Number(e.target.value) || 1))
              }
              className="mt-1 w-28 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
            />
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
              {submitting ? "Guardando…" : "Registrar alumno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
