export const ABRASIVITY_LEVELS = [
  { value: "extra-suave", label: "Extra suave", tape: "Amarilla", color: "#FACC15" },
  { value: "suave", label: "Suave", tape: "Roja", color: "#EF4444" },
  { value: "media", label: "Media", tape: "Azul", color: "#3B82F6" },
  { value: "fuerte", label: "Fuerte", tape: "Verde", color: "#22C55E" },
] as const

export type AbrasivityValue = (typeof ABRASIVITY_LEVELS)[number]["value"]

export const ABRASIVITY_VALUES: readonly AbrasivityValue[] =
  ABRASIVITY_LEVELS.map((level) => level.value)

const ABRASIVITY_BY_VALUE: Record<AbrasivityValue, (typeof ABRASIVITY_LEVELS)[number]> =
  Object.fromEntries(ABRASIVITY_LEVELS.map((level) => [level.value, level])) as Record<
    AbrasivityValue,
    (typeof ABRASIVITY_LEVELS)[number]
  >

export function getAbrasivityLevel(
  value: string | null | undefined
): (typeof ABRASIVITY_LEVELS)[number] | null {
  if (!value) return null
  return ABRASIVITY_BY_VALUE[value as AbrasivityValue] ?? null
}

export function isAbrasivityValue(value: unknown): value is AbrasivityValue {
  return typeof value === "string" && value in ABRASIVITY_BY_VALUE
}
