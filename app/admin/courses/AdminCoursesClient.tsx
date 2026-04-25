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
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-sm font-semibold text-[#C9A84C] hover:text-white"
          >
            ← Panel
          </Link>
          <h1 className="text-lg font-semibold">Gestión de cursos</h1>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#b8962f]"
        >
          + Nuevo curso
        </Link>
      </header>

      <main className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/70">
            Aún no hay cursos. Crea el primero con “Nuevo curso”.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/60">
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
                      className="border-b border-white/5 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">
                          {c.title}
                        </div>
                        <div className="text-xs text-white/60">
                          {c.instructor?.name ?? "Sin instructor"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {formatDate(c.start_date)}
                        {c.end_date && c.end_date !== c.start_date && (
                          <span className="text-white/50">
                            {" "}– {formatDate(c.end_date)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {LEVEL_LABEL[c.level]}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {formatPrice(c.price)}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {c.confirmed_count}/{c.capacity}
                      </td>
                      <td className="px-4 py-3">
                        {c.is_published ? (
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                            Publicado
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70">
                            Borrador
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/courses/${c.id}/registrations`}
                            className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/10"
                          >
                            Inscritos
                          </Link>
                          <Link
                            href={`/admin/courses/${c.id}/edit`}
                            className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/10"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => togglePublish(c)}
                            disabled={busy}
                            className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                          >
                            {c.is_published ? "Despublicar" : "Publicar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            disabled={busy}
                            className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
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
