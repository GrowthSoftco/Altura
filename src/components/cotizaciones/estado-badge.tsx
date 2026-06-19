import { cn } from "@/lib/utils"
import { EstadoCotizacion } from "@/types"

const estadoVariants: Record<EstadoCotizacion, string> = {
  BORRADOR:        "bg-[#1E1E1E] text-[#A0A0A0] border border-[#3A3A3A]",
  ENVIADA:         "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  PENDIENTE:       "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  EN_AJUSTE:       "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  APROBADA:        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  RESERVADA:       "bg-[#00B4C5]/10 text-[#00B4C5] border border-[#00B4C5]/20",
  PAGANDO:         "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  PAGADA:          "bg-green-600/15 text-green-500 border border-green-600/25",
  VIAJE_REALIZADO: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  RECHAZADA:       "bg-red-500/10 text-red-400 border border-red-500/20",
  VENCIDA:         "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  CANCELADA:       "bg-red-900/30 text-red-300 border border-red-900/40",
}

export const estadoLabels: Record<EstadoCotizacion, string> = {
  BORRADOR:        "Borrador",
  ENVIADA:         "Enviada",
  PENDIENTE:       "Pendiente de respuesta",
  EN_AJUSTE:       "En ajuste",
  APROBADA:        "Aprobada",
  RESERVADA:       "Reservada",
  PAGANDO:         "Pagando",
  PAGADA:          "Pagada",
  VIAJE_REALIZADO: "Viaje realizado",
  RECHAZADA:       "Rechazada",
  VENCIDA:         "Vencida",
  CANCELADA:       "Cancelada",
}

export function EstadoBadge({ estado }: { estado: EstadoCotizacion }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        estadoVariants[estado]
      )}
    >
      {estadoLabels[estado]}
    </span>
  )
}
