import { ServicioItem, CalculoPrecios, PlanPagosConfig, CuotaPago } from "@/types"
import { formatCOP } from "@/lib/utils"
export { formatCOP }

export function calcularDuracion(salida: Date, regreso: Date) {
  const dias = Math.ceil((regreso.getTime() - salida.getTime()) / (1000 * 60 * 60 * 24))
  return { dias, noches: dias - 1, label: `${dias} días / ${dias - 1} noches` }
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
  planConfig?: { aplicar: boolean; numeroCuotas: number; porcentajes?: number[] },
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

  const aplicar     = planConfig?.aplicar ?? true
  const numCuotas   = planConfig?.numeroCuotas ?? 3
  const porcentajes = planConfig?.porcentajes ?? generarPorcentajesDefault(numCuotas)

  const cuotas: CuotaPago[] = porcentajes.map((pct, i) => ({
    numero: i + 1,
    porcentaje: pct,
    valorTotal: Math.ceil(valorFinal * (pct / 100)),
  }))

  const planPagos: PlanPagosConfig = { aplicar, numeroCuotas: numCuotas, cuotas }

  return { costoNetoTotal, valorConUtilidad, ivaTotal, valorFinal, valorPorPersona, planPagos }
}

export async function generarCodigoCotizacion(prisma: {
  cotizacion: { count: () => Promise<number> }
}): Promise<string> {
  const count = await prisma.cotizacion.count()
  return `COT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`
}

export const SERVICIOS_DEFAULT: ServicioItem[] = [
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
