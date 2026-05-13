"use client"

import { ServicioItem } from "@/types"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

interface ServiciosTableProps {
  servicios: ServicioItem[]
  onChange: (servicios: ServicioItem[]) => void
}

export function ServiciosTable({ servicios, onChange }: ServiciosTableProps) {
  const updateServicio = (id: string, changes: Partial<ServicioItem>) => {
    onChange(servicios.map((s) => (s.id === id ? { ...s, ...changes } : s)))
  }

  const formatInputValue = (valor: number) =>
    valor === 0 ? "" : String(valor)

  const parseInputValue = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "")
    return cleaned === "" ? 0 : parseInt(cleaned, 10)
  }

  return (
    <div className="rounded-xl border border-[#222222] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_160px_1fr] bg-[#181818] px-3 py-2.5 text-[10px] font-medium text-[#4A4A4A] tracking-[0.15em] uppercase">
        <div />
        <div>Servicio</div>
        <div>Valor neto / PAX</div>
        <div>Observaciones</div>
      </div>

      {/* Rows */}
      {servicios.map((servicio, idx) => (
        <div
          key={servicio.id}
          className={cn(
            "grid grid-cols-[40px_1fr_160px_1fr] items-center gap-2 px-3 py-2.5 transition-all border-t border-[#1E1E1E]",
            idx === 0 && "border-t-0",
            servicio.activo
              ? "bg-[#1C1C1C] border-l-2 border-l-[#4F6EF7]"
              : "bg-[#181818] border-l-2 border-l-transparent opacity-50"
          )}
        >
          <Switch
            checked={servicio.activo}
            onCheckedChange={(checked) =>
              updateServicio(servicio.id, { activo: checked })
            }
            className="data-[state=checked]:bg-[#4F6EF7]"
          />
          <span className="text-sm text-[#F2F2F2]">{servicio.nombre}</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#737373]">
              $
            </span>
            <Input
              className="pl-6 h-8 text-sm bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#4F6EF7]"
              placeholder="0"
              value={formatInputValue(servicio.valorNeto)}
              disabled={!servicio.activo}
              onChange={(e) =>
                updateServicio(servicio.id, {
                  valorNeto: parseInputValue(e.target.value),
                })
              }
            />
          </div>
          <Input
            className="h-8 text-sm bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#4F6EF7]"
            placeholder="Detalles..."
            value={servicio.obs}
            disabled={!servicio.activo}
            onChange={(e) =>
              updateServicio(servicio.id, { obs: e.target.value })
            }
          />
        </div>
      ))}
    </div>
  )
}
