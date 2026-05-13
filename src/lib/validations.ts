import { z } from "zod"

export const ClienteSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  telefono: z.string().min(7, "Teléfono requerido"),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  documento: z.string().optional(),
})

export type ClienteFormData = z.infer<typeof ClienteSchema>

const ServicioItemSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  valorNeto: z.number().min(0),
  obs: z.string(),
  noches: z.number().optional(),
})

export const CotizacionSchema = z.object({
  clienteId: z.string().optional(),
  clienteNuevo: ClienteSchema.optional(),
  tipo: z.enum(["NACIONAL", "INTERNACIONAL"]),
  origen: z.string().min(2, "Origen requerido"),
  destino: z.string().min(2, "Destino requerido"),
  fechaSalida: z.date({ error: "Fecha de salida requerida" }),
  fechaRegreso: z.date({ error: "Fecha de regreso requerida" }),
  aerolinea: z.string().optional(),
  numeroVuelo: z.string().optional(),
  adultos: z.number().min(1, "Mínimo 1 adulto"),
  menores: z.number().min(0),
  edadesMenores: z.array(z.number()).optional(),
  servicios: z.array(ServicioItemSchema),
  porcentajeGanancia: z.number().min(0).max(100),
  asistenciaMedica: z.boolean(),
  observaciones: z.string().optional(),
  notasInternas: z.string().optional(),
})

export type CotizacionFormData = z.infer<typeof CotizacionSchema>
