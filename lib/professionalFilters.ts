import type { ProfessionalRow } from "@/lib/supabase/appointments"

export function professionalMatchesServiceFilters(
  professional: ProfessionalRow,
  requiredFilterIds: Set<string>
): boolean {
  if (requiredFilterIds.size === 0) return true
  if (professional.filter_ids.length === 0) return true
  for (const filterId of requiredFilterIds) {
    if (!professional.filter_ids.includes(filterId)) return false
  }
  return true
}
