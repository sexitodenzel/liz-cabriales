/**
 * Apartado mínimo requerido para reservar lugar en un curso según el precio.
 *
 * Reglas de negocio (Fase 3):
 *  - price <  500     → $200 (talleres 1 día)
 *  - 500  ≤ price < 1000  → $400 (especializados)
 *  - 1000 ≤ price < 2000  → $500 (diplomados)
 *  - price ≥ 2000        → $1000 (masters)
 *
 * El monto retornado nunca excede el precio total del curso.
 */
export function getMinDeposit(price: number): number {
  const p = Number(price)
  if (!Number.isFinite(p) || p <= 0) return 0

  let deposit: number
  if (p < 500) deposit = 200
  else if (p < 1000) deposit = 400
  else if (p < 2000) deposit = 500
  else deposit = 1000

  return Math.min(deposit, p)
}
