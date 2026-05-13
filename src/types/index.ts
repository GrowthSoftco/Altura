export interface ServicioItem {
  id: string
  nombre: string
  activo: boolean
  valorNeto: number
  obs: string
  noches?: number
}

export interface PagoCuota {
  porcentaje: number
  valorIndividual: number
  valorTotal: number
}

export interface PlanPagos {
  pago1: PagoCuota
  pago2: PagoCuota
  pago3: PagoCuota
}

export interface ItinerarioVuelo {
  aerolinea?: string
  numeroVuelo?: string
  salida?: string
  llegada?: string
  duracion?: string
  escalas?: string
}

export interface Itinerario {
  ida?: ItinerarioVuelo
  regreso?: ItinerarioVuelo
}

export interface CalculoPrecios {
  valorNetoIndividual: number
  valorNetoTotal: number
  gananciaTotal: number
  valorConPorcentaje: number
  planPagos: PlanPagos
}

export type EstadoCotizacion =
  | "COTIZADA"
  | "NEGOCIACION"
  | "APROBADA"
  | "PAGANDO"
  | "COMPLETADA"
  | "CANCELADA"

export type TipoViaje = "NACIONAL" | "INTERNACIONAL"

export interface ClienteBase {
  id: string
  nombre: string
  telefono: string
  correo: string | null
  documento: string | null
  fechaRegistro: Date
  createdAt: Date
  updatedAt: Date
}

export interface CotizacionBase {
  id: string
  codigo: string
  estado: EstadoCotizacion
  fechaCreacion: Date
  clienteId: string
  tipo: TipoViaje
  origen: string
  destino: string
  fechaSalida: Date
  fechaRegreso: Date
  aerolinea: string | null
  numeroVuelo: string | null
  adultos: number
  menores: number
  edadesMenores: number[]
  servicios: ServicioItem[]
  itinerario: Itinerario | null
  porcentajeGanancia: number
  valorNetoIndividual: number
  valorNetoTotal: number
  gananciaTotal: number
  valorConPorcentaje: number
  planPagos: PlanPagos
  asistenciaMedica: boolean
  observaciones: string | null
  notasInternas: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CotizacionCompleta extends CotizacionBase {
  cliente: ClienteBase
}
