import { ServicioItem, CalculoPrecios, PlanPagosConfig, CuotaPago } from "@/types"
import { formatCOP } from "@/lib/utils"
export { formatCOP }

export function calcularDuracion(salida: Date, regreso: Date) {
  const noches = Math.ceil((regreso.getTime() - salida.getTime()) / (1000 * 60 * 60 * 24))
  const dias   = noches + 1  // el día de llegada también cuenta
  return { dias, noches, label: `${dias} días / ${noches} noches` }
}

function generarPorcentajesDefault(n: number): number[] {
  if (n === 1) return [100]
  if (n === 2) return [50, 50]
  if (n === 3) return [50, 30, 20]
  if (n === 4) return [40, 30, 20, 10]
  const base = Math.floor(100 / n)
  const resto = 100 - base * (n - 1)
  return [resto, ...Array(n - 1).fill(base)]
}

export function calcularPrecios(
  servicios: ServicioItem[],
  adultos: number,
  menores: number,
  porcentaje: number,
  planConfig?: {
    aplicar: boolean
    numeroCuotas: number
    porcentajes?: number[]
    incremento?: number
    modalidad?: "mensual" | "quincenal"
    fechaInicial?: string
    fechas?: (string | undefined)[]
  },
  cobrarIva?: boolean,
): CalculoPrecios {
  const totalPax = Math.max(adultos + menores, 1)

  const costoPorPersona = servicios
    .filter(s => s.activo && s.esPorPersona !== false)
    .reduce((sum, s) => sum + s.valorNeto, 0)

  const costoGrupo = servicios
    .filter(s => s.activo && s.esPorPersona === false)
    .reduce((sum, s) => sum + s.valorNeto, 0)

  const costoNetoTotal    = costoPorPersona * totalPax + costoGrupo
  const utilidad          = costoNetoTotal * (porcentaje / 100)
  const valorConUtilidad  = costoNetoTotal + utilidad

  const ivaTotal   = cobrarIva ? Math.ceil(valorConUtilidad * 0.19) : 0
  const valorFinal = valorConUtilidad + ivaTotal
  const valorPorPersona = totalPax > 0 ? Math.ceil(valorFinal / totalPax) : 0

  const aplicar      = planConfig?.aplicar ?? true
  const numCuotas    = planConfig?.numeroCuotas ?? 3
  const porcentajes  = planConfig?.porcentajes ?? generarPorcentajesDefault(numCuotas)
  const incremento   = planConfig?.incremento ?? 0
  const fechasCuotas = planConfig?.fechas

  // Compute cuota amounts
  let montos: number[]
  if (incremento > 0 && numCuotas > 1) {
    const factor = 1 + incremento / 100
    const factorSum = Array.from({ length: numCuotas }, (_, i) => Math.pow(factor, i))
      .reduce((a, b) => a + b, 0)
    const base = valorFinal / factorSum
    montos = Array.from({ length: numCuotas }, (_, i) => Math.ceil(base * Math.pow(factor, i)))
    // Adjust last to avoid rounding drift
    const sumExcLast = montos.slice(0, -1).reduce((a, b) => a + b, 0)
    montos[numCuotas - 1] = Math.max(0, valorFinal - sumExcLast)
  } else {
    // Each cuota = round(valorFinal × pct%). Intentionally allows sum > 100%
    // when the user sets a surcharge (e.g. 55% + 50% = 105%).
    montos = porcentajes.map(pct => Math.round(valorFinal * (pct / 100)))
  }

  const cuotas: CuotaPago[] = montos.map((monto, i) => ({
    numero: i + 1,
    porcentaje: Math.round((monto / (valorFinal || 1)) * 100),
    valorTotal: monto,
    ...(fechasCuotas?.[i] ? { fecha: fechasCuotas[i] } : {}),
  }))

  const planPagos: PlanPagosConfig = {
    aplicar,
    numeroCuotas: numCuotas,
    modalidad:    planConfig?.modalidad,
    fechaInicial: planConfig?.fechaInicial,
    incremento:   incremento || undefined,
    cuotas,
  }

  return { costoNetoTotal, valorConUtilidad, ivaTotal, valorFinal, valorPorPersona, planPagos }
}

export async function generarCodigoCotizacion(prisma: {
  cotizacion: {
    findFirst: (args: {
      where: { codigo: { startsWith: string } }
      orderBy: { codigo: "desc" }
      select: { codigo: true }
    }) => Promise<{ codigo: string } | null>
  }
}): Promise<string> {
  const year   = new Date().getFullYear()
  const prefix = `COT-${year}-`
  const last   = await prisma.cotizacion.findFirst({
    where:   { codigo: { startsWith: prefix } },
    orderBy: { codigo: "desc" },
    select:  { codigo: true },
  })
  const nextNum = last
    ? (parseInt(last.codigo.replace(prefix, ""), 10) || 0) + 1
    : 1
  return `${prefix}${String(nextNum).padStart(3, "0")}`
}

export const SERVICIOS_DEFAULT: ServicioItem[] = [
  { id: "todo_incluido",  nombre: "Todo incluido",                activo: false, valorNeto: 0, obs: "", esPorPersona: false },
  { id: "tkt_ida_reg",    nombre: "Tiquetes ida y regreso",       activo: false, valorNeto: 0, obs: "", esPorPersona: true  },
  { id: "tkt_ida",        nombre: "Tiquete ida",                  activo: true,  valorNeto: 0, obs: "", esPorPersona: true  },
  { id: "tkt_regreso",    nombre: "Tiquete regreso",              activo: true,  valorNeto: 0, obs: "", esPorPersona: true  },
  { id: "hotel",          nombre: "Hotel",                        activo: true,  valorNeto: 0, obs: "", esPorPersona: false, noches: 1 },
  { id: "trasl_apt_htl",  nombre: "Traslado aeropuerto → hotel",  activo: false, valorNeto: 0, obs: "", esPorPersona: false },
  { id: "trasl_htl_apt",  nombre: "Traslado hotel → aeropuerto",  activo: false, valorNeto: 0, obs: "", esPorPersona: false },
  { id: "asistencia",     nombre: "Asistencia médica",            activo: false, valorNeto: 0, obs: "", esPorPersona: true  },
  { id: "tour1",          nombre: "Tour 1",                       activo: false, valorNeto: 0, obs: "", esPorPersona: true  },
  { id: "tour2",          nombre: "Tour 2",                       activo: false, valorNeto: 0, obs: "", esPorPersona: true  },
  { id: "tour3",          nombre: "Tour 3",                       activo: false, valorNeto: 0, obs: "", esPorPersona: true  },
  { id: "equipaje",       nombre: "Equipaje adicional",           activo: false, valorNeto: 0, obs: "", esPorPersona: true  },
  { id: "tarj_turis",     nombre: "Tarjeta turismo",              activo: false, valorNeto: 0, obs: "", esPorPersona: true  },
]
