"use client"

import { useEffect, useMemo, useState } from "react"
import Breadcrumb from "@/components/shared/Breadcrumb"
import {
  formatLoginMethod,
  type LoginEvent,
} from "@/lib/supabase/login-events-shared"

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const date = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
  const time = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d)
  return { date, time }
}

function roleLabel(role: string | null): string {
  if (role === "admin") return "Administrador"
  if (role === "receptionist") return "Recepcionista"
  if (role === "client") return "Cliente"
  return role ?? "—"
}

export default function AccesosClient() {
  const [events, setEvents] = useState<LoginEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/admin/login-events")
        const json = (await res.json()) as {
          data: LoginEvent[] | null
          error: { message: string } | null
        }
        if (!res.ok || !json.data) {
          throw new Error(json.error?.message ?? "No se pudo cargar el historial.")
        }
        if (!cancelled) setEvents(json.data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return events
    return events.filter((e) => {
      const hay = [
        e.full_name,
        e.email,
        e.role,
        e.method,
        e.ip,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [events, query])

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="px-6 pt-5 pb-10">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <Breadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Admin", href: "/admin" },
              { label: "Accesos" },
            ]}
          />

          <div className="flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Seguridad
              </p>
              <h1
                className="mt-2 text-3xl font-medium tracking-tight text-neutral-900"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Accesos recientes
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Inicios de sesión de administradores (últimos 3 meses). Se
                eliminan automáticamente los registros más antiguos.
              </p>
            </div>
            <label className="block w-full max-w-xs">
              <span className="sr-only">Buscar</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nombre, correo, IP…"
                className="w-full border border-neutral-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-[#c6a75e]"
              />
            </label>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-500">Cargando historial…</p>
          ) : error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No hay inicios de sesión registrados en este periodo.
            </p>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 bg-white">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-neutral-200 bg-[#fafafa] text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Hora</th>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Correo</th>
                    <th className="px-4 py-3 font-semibold">Rol</th>
                    <th className="px-4 py-3 font-semibold">Método</th>
                    <th className="px-4 py-3 font-semibold">IP</th>
                    <th className="px-4 py-3 font-semibold">Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => {
                    const { date, time } = formatDateTime(event.created_at)
                    return (
                      <tr
                        key={event.id}
                        className="border-b border-neutral-100 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-800">
                          {date}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-800">
                          {time}
                        </td>
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          {event.full_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {event.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {roleLabel(event.role)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {formatLoginMethod(event.method)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-neutral-600">
                          {event.ip === "::1" || event.ip === "0:0:0:0:0:0:0:1"
                            ? "127.0.0.1"
                            : event.ip || "—"}
                        </td>
                        <td
                          className="max-w-[220px] truncate px-4 py-3 text-[12px] text-neutral-500"
                          title={event.user_agent ?? undefined}
                        >
                          {event.user_agent || "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filtered.length > 0 ? (
            <p className="text-[12px] text-neutral-500">
              Mostrando {filtered.length} registro
              {filtered.length === 1 ? "" : "s"}
              {query.trim() ? " (filtrados)" : ""}. Máx. 500 más recientes.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  )
}
