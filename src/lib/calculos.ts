import { ServicioItem, CalculoPrecios, PlanPagos } from "@/types"
import { formatCOP } from "@/lib/utils"

export { formatCOP }

export function calcularDuracion(salida: Date, regreso: Date) {
  const dias = Math.ceil(
    (regreso.getTime() - salida.getTime()) / (1000 * 60 * 60 * 24)
  )
  return { dias, noches: dias - 1, label: `${dias} días / ${dias - 1} noches` }
}

export function calcularPrecios(
  servicios: ServicioItem[],
  adultos: number,
  menores: number,
  porcentaje: number
): CalculoPrecios {
  const totalPax = adultos + menores
  const valorNetoIndividual = servicios
    .filter((s) => s.activo)
    .reduce((sum, s) => sum + s.valorNeto, 0)
  const valorNetoTotal = valorNetoIndividual * totalPax
  const gananciaTotal = valorNetoTotal * (porcentaje / 100)
  const valorConPorcentaje = valorNetoTotal + gananciaTotal

  const planPagos: PlanPagos = {
    pago1: {
      porcentaje: 50,
      valorIndividual: totalPax > 0 ? (valorConPorcentaje * 0.5) / totalPax : 0,
      valorTotal: valorConPorcentaje * 0.5,
    },
    pago2: {
      porcentaje: 30,
      valorIndividual: totalPax > 0 ? (valorConPorcentaje * 0.3) / totalPax : 0,
      valorTotal: valorConPorcentaje * 0.3,
    },
    pago3: {
      porcentaje: 20,
      valorIndividual: totalPax > 0 ? (valorConPorcentaje * 0.2) / totalPax : 0,
      valorTotal: valorConPorcentaje * 0.2,
    },
  }

  return {
    valorNetoIndividual,
    valorNetoTotal,
    gananciaTotal,
    valorConPorcentaje,
    planPagos,
  }
}

export async function generarCodigoCotizacion(prisma: {
  cotizacion: { count: () => Promise<number> }
}): Promise<string> {
  const count = await prisma.cotizacion.count()
  return `COT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`
}

export const SERVICIOS_DEFAULT: ServicioItem[] = [
  { id: "tkt_ida",     nombre: "Tiquete ida",          activo: true,  valorNeto: 0, obs: "" },
  { id: "tkt_regreso", nombre: "Tiquete regreso",       activo: true,  valorNeto: 0, obs: "" },
  { id: "hotel",       nombre: "Hotel",                 activo: true,  valorNeto: 0, obs: "", noches: 1 },
  { id: "asistencia",  nombre: "Asistencia médica",     activo: false, valorNeto: 0, obs: "" },
  { id: "tour1",       nombre: "Tour 1",                activo: false, valorNeto: 0, obs: "" },
  { id: "tour2",       nombre: "Tour 2",                activo: false, valorNeto: 0, obs: "" },
  { id: "tour3",       nombre: "Tour 3",                activo: false, valorNeto: 0, obs: "" },
  { id: "traslado",    nombre: "Traslado aeropuerto",   activo: false, valorNeto: 0, obs: "" },
  { id: "equipaje",    nombre: "Equipaje adicional",    activo: false, valorNeto: 0, obs: "" },
  { id: "tarj_turis",  nombre: "Tarjeta turismo",       activo: false, valorNeto: 0, obs: "" },
]
