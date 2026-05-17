import { cn } from "@/lib/utils"
import { EstadoCotizacion } from "@/types"

const estadoVariants: Record<EstadoCotizacion, string> = {
  COTIZADA:    "bg-[#1E1E1E] text-[#737373] border border-[#2A2A2A]",
  NEGOCIACION: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  APROBADA:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  PAGANDO:     "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  COMPLETADA:  "bg-[#00B4C5]/10 text-[#00B4C5] border border-[#00B4C5]/20",
  CANCELADA:   "bg-red-500/10 text-red-400 border border-red-500/20",
}

const estadoLabels: Record<EstadoCotizacion, string> = {
  COTIZADA:    "Cotizada",
  NEGOCIACION: "Negociación",
  APROBADA:    "Aprobada",
  PAGANDO:     "Pagando",
  COMPLETADA:  "Completada",
  CANCELADA:   "Cancelada",
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
