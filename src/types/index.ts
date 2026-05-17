export interface ServicioItem {
  id: string
  nombre: string
  activo: boolean
  valorNeto: number
  obs: string
  esPorPersona: boolean   // false = precio de grupo (hotel, traslados)
  noches?: number
}

export interface CuotaPago {
  numero: number
  porcentaje: number
  valorTotal: number
}

export interface PlanPagosConfig {
  aplicar: boolean
  numeroCuotas: number
  cuotas: CuotaPago[]
}

export interface Tramo {
  id: string
  origen: string
  destino: string
  fechaSalida?: string
  fechaRegreso?: string
  aerolineaIda?: string
  aerolineaRegreso?: string
  plataforma?: string
  horaSalidaIda?: string
  horaLlegadaIda?: string
  horaSalidaRegreso?: string
  horaLlegadaRegreso?: string
  tiempoVuelo?: string
  escalas?: string
  tiempoEscala?: string
}

export interface CalculoPrecios {
  costoNetoTotal: number
  valorConUtilidad: number   // subtotal antes de IVA
  valorPorPersona: number
  ivaTotal: number           // 19% de valorConUtilidad (0 si no aplica)
  valorFinal: number         // valorConUtilidad + ivaTotal
  planPagos: PlanPagosConfig
}

export type EstadoCotizacion =
  | "COTIZADA" | "NEGOCIACION" | "APROBADA"
  | "PAGANDO"  | "COMPLETADA"  | "CANCELADA"

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
  aerolinea: string | null          // legacy
  aerolineaIda: string | null
  aerolineaRegreso: string | null
  plataforma: string | null
  horaSalidaIda: string | null
  horaLlegadaIda: string | null
  horaSalidaRegreso: string | null
  horaLlegadaRegreso: string | null
  tiempoVuelo: string | null
  escalas: string | null
  tiempoEscala: string | null
  numeroVuelo: string | null
  adultos: number
  menores: number
  edadesMenores: number[]
  servicios: ServicioItem[]
  itinerario: unknown
  hotelNombre: string | null
  hotelNoches: number | null
  hotelTipo: string | null
  tramos: Tramo[] | null
  porcentajeGanancia: number
  costoNetoTotal: number
  valorConUtilidad: number
  valorPorPersona: number
  // keep legacy fields for compat
  valorNetoIndividual: number
  valorNetoTotal: number
  gananciaTotal: number
  valorConPorcentaje: number
  planPagos: PlanPagosConfig
  mostrarPlanPagos: boolean
  numeroCuotas: number
  cobrarIva: boolean
  asistenciaMedica: boolean
  observaciones: string | null
  notasInternas: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CotizacionCompleta extends CotizacionBase {
  cliente: ClienteBase
}
