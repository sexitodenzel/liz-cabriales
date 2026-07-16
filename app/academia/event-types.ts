/**
 * Tipos de evento de la academia (columna courses.event_type). Fuente única de
 * verdad para el label legible y el color de cada tipo, compartida por el form
 * de admin, el chip de las cards y la vista de calendario.
 *
 * 'curso' es el default y no se muestra como chip especial en las cards.
 */

import type { CourseEventType } from "@/types"

export type { CourseEventType }

export const COURSE_EVENT_TYPES: CourseEventType[] = [
  "curso",
  "taller_master_internacional",
  "taller_master_nacional",
  "masterclass",
  "seminario_tecnico",
]

export const EVENT_TYPE_LABEL: Record<CourseEventType, string> = {
  curso: "Curso",
  taller_master_internacional: "Taller Máster Internacional",
  taller_master_nacional: "Taller Máster Nacional",
  masterclass: "Masterclass",
  seminario_tecnico: "Seminario Técnico",
}

/**
 * Paleta por tipo para el calendario y los chips. Neutros fríos + acentos
 * suaves (rosa, malva, sage) — sin beige/dorado, para que el calendario no
 * se sienta amarillento.
 */
export const EVENT_TYPE_COLOR: Record<
  CourseEventType,
  { dot: string; chip: string }
> = {
  curso: {
    dot: "#3a3a3a",
    chip: "border-[#e4e4e4] bg-[#f5f5f5] text-[#2a2a2a]",
  },
  taller_master_internacional: {
    dot: "#9a6b78",
    chip: "border-[#e8d5db] bg-[#f7eef1] text-[#6b4550]",
  },
  taller_master_nacional: {
    dot: "#7a6b8a",
    chip: "border-[#ddd4e6] bg-[#f3eff7] text-[#4f4460]",
  },
  masterclass: {
    dot: "#5f7a68",
    chip: "border-[#d4e0d8] bg-[#eef4f0] text-[#3d5246]",
  },
  seminario_tecnico: {
    dot: "#5a6a7a",
    chip: "border-[#d5dde4] bg-[#eef2f5] text-[#3d4a56]",
  },
}

export function normalizeEventType(value: string | null | undefined): CourseEventType {
  return COURSE_EVENT_TYPES.includes(value as CourseEventType)
    ? (value as CourseEventType)
    : "curso"
}
