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
  fecha?: string   // ISO date "yyyy-MM-dd"
}

export interface PlanPagosConfig {
  aplicar: boolean
  numeroCuotas: number
  modalidad?: "mensual" | "quincenal"
  fechaInicial?: string
  incremento?: number   // 0-40 %
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
  // Hotel por tramo (opcional — independiente del vuelo)
  hotelNombre?: string
  hotelCheckIn?: string       // fecha check-in (yyyy-MM-dd)
  hotelCheckOut?: string      // fecha check-out (yyyy-MM-dd)
  hotelHoraCheckIn?: string   // hora check-in (HH:mm)
  hotelHoraCheckOut?: string  // hora check-out (HH:mm)
  hotelNoches?: number
  hotelTipo?: string
}

export interface Hospedaje {
  nombre?: string         // nombre del hospedaje / hotel
  habitacion?: string     // tipo o nombre de la habitación
  direccion?: string      // dirección / ubicación
  ciudad?: string         // ciudad
  checkIn?: string        // fecha check-in (yyyy-MM-dd)
  horaCheckIn?: string    // hora check-in (HH:mm)
  checkOut?: string       // fecha check-out (yyyy-MM-dd)
  horaCheckOut?: string   // hora check-out (HH:mm)
  notas?: string          // notas / detalles adicionales
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
  | "BORRADOR" | "ENVIADA" | "PENDIENTE" | "EN_AJUSTE"
  | "APROBADA" | "RESERVADA" | "REVISADA"
  | "PAGANDO" | "PAGADA" | "VIAJE_REALIZADO"
  | "RECHAZADA" | "VENCIDA" | "CANCELADA"

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
  hospedaje: Hospedaje | null
  creadoPorId: string | null
  compartidoCon: string[]
  creadoPor?: { nombre: string | null; usuario: string } | null
  porcentajeGanancia: number
  utilidadModo: string | null
  utilidadFija: number | null
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
