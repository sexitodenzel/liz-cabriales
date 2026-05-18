"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import type { CourseWithStats } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"

type Props = {
  initialCourses: CourseWithStats[]
}

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  open: "Abierto",
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function AdminCoursesClient({ initialCourses }: Props) {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithStats[]>(initialCourses)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const togglePublish = async (course: CourseWithStats) => {
    setBusyId(course.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !course.is_published }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "No se pudo actualizar el curso")
        return
      }
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id
            ? { ...c, is_published: !course.is_published }
            : c
        )
      )
    } catch {
      setError("Error de red al actualizar")
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (course: CourseWithStats) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas despublicar el curso "${course.title}"? Dejará de ser visible para los alumnos.`
    )
    if (!confirmed) return

    setBusyId(course.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "No se pudo eliminar el curso")
        return
      }
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, is_published: false } : c
        )
      )
      router.refresh()
    } catch {
      setError("Error de red al eliminar")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <header className="border-b border-[#ececec] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-sm font-semibold text-[#c9a84c] hover:text-[#a8893a]"
          >
            ← Panel
          </Link>
          <h1 className="text-lg font-semibold">Gestión de cursos</h1>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a8893a] transition-colors"
        >
          + Nuevo curso
        </Link>
      </header>

      <main className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="rounded-xl border border-[#ececec] bg-[#fafafa] p-10 text-center text-sm text-[#6b6b6b]">
            Aún no hay cursos. Crea el primero desde Nuevo curso.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#ececec] bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#ececec] text-left text-xs uppercase tracking-wider text-[#6b6b6b] bg-[#fafafa]">
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Inscritos</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const busy = busyId === c.id
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-[#ececec] last:border-b-0 hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1a1a1a]">
                          {c.title}
                        </div>
                        <div className="text-xs text-[#6b6b6b]">
                          {c.instructor?.name ?? "Sin instructor"}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                              c.allow_online_registration
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-[#ececec] bg-[#fafafa] text-[#6b6b6b]"
                            }`}
                          >
                            {c.allow_online_registration
                              ? "Pago en línea"
                              : "Solo WhatsApp"}
                          </span>
                          {!c.show_price_public && (
                            <span className="rounded-full border border-[#ececec] bg-[#fafafa] px-2 py-0.5 text-[11px] font-semibold text-[#6b6b6b]">
                              Precio oculto
                            </span>
                          )}
                          {!c.show_capacity_public && (
                            <span className="rounded-full border border-[#ececec] bg-[#fafafa] px-2 py-0.5 text-[11px] font-semibold text-[#6b6b6b]">
                              Cupo oculto
                            </span>
                          )}
                          {(c.public_registered_count != null ||
                            c.public_capacity != null) && (
                            <span className="rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-2 py-0.5 text-[11px] font-semibold text-[#a8893a]">
                              Disponibilidad manual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#3a3a3a]">
                        {formatDate(c.start_date)}
                        {c.end_date && c.end_date !== c.start_date && (
                          <span className="text-[#6b6b6b]">
                            {" "}– {formatDate(c.end_date)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#3a3a3a]">
                        {LEVEL_LABEL[c.level]}
                      </td>
                      <td className="px-4 py-3 text-[#3a3a3a]">
                        {formatPrice(c.price)}
                      </td>
                      <td className="px-4 py-3 text-[#3a3a3a]">
                        {c.confirmed_count}/{c.capacity}
                        {(c.public_registered_count != null ||
                          c.public_capacity != null) && (
                          <div className="text-xs text-[#6b6b6b]">
                            Público: {c.public_confirmed_count}/
                            {c.public_display_capacity}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.is_published ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            Publicado
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#fafafa] px-2.5 py-0.5 text-xs font-semibold text-[#6b6b6b] border border-[#ececec]">
                            Borrador
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/courses/${c.id}/registrations`}
                            className="rounded-md border border-[#ececec] px-2.5 py-1 text-xs text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a] transition-colors"
                          >
                            Inscritos
                          </Link>
                          <Link
                            href={`/admin/courses/${c.id}/edit`}
                            className="rounded-md border border-[#ececec] px-2.5 py-1 text-xs text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a] transition-colors"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => togglePublish(c)}
                            disabled={busy}
                            className="rounded-md border border-[#ececec] px-2.5 py-1 text-xs text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a] transition-colors disabled:opacity-50"
                          >
                            {c.is_published ? "Despublicar" : "Publicar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            disabled={busy}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
