import { CotizacionCompleta } from "@/types"

/**
 * Convierte los campos Decimal de Prisma a number para poder pasar la cotización
 * de un Server Component a un Client Component (los Decimal no son serializables).
 */
export function serializeCotizacion<T extends Record<string, unknown>>(
  cot: T
): CotizacionCompleta {
  return {
    ...cot,
    porcentajeGanancia:  Number(cot.porcentajeGanancia ?? 0),
    utilidadModo:        (cot.utilidadModo as string | null) ?? null,
    utilidadFija:        (cot.utilidadFija as number | null) ?? null,
    valorNetoIndividual: Number(cot.valorNetoIndividual ?? 0),
    valorNetoTotal:      Number(cot.valorNetoTotal ?? 0),
    gananciaTotal:       Number(cot.gananciaTotal ?? 0),
    valorConPorcentaje:  Number(cot.valorConPorcentaje ?? 0),
  } as unknown as CotizacionCompleta
}

export function serializeCotizaciones<T extends Record<string, unknown>>(
  cots: T[]
): CotizacionCompleta[] {
  return cots.map(serializeCotizacion)
}
