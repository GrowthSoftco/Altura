"use client"

import { ServicioItem } from "@/types"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

interface ServiciosTableProps {
  servicios: ServicioItem[]
  onChange: (servicios: ServicioItem[]) => void
}

export function ServiciosTable({ servicios, onChange }: ServiciosTableProps) {
  const update = (id: string, changes: Partial<ServicioItem>) =>
    onChange(servicios.map(s => s.id === id ? { ...s, ...changes } : s))

  const addCustom = () => {
    const id = `custom_${Date.now()}`
    onChange([...servicios, { id, nombre: "", activo: true, valorNeto: 0, obs: "", esPorPersona: true }])
  }

  const remove = (id: string) => onChange(servicios.filter(s => s.id !== id))

  const fmt = (v: number) => v === 0 ? "" : String(v)
  const parse = (raw: string) => { const c = raw.replace(/[^0-9]/g, ""); return c === "" ? 0 : parseInt(c, 10) }

  const isCustom = (id: string) => id.startsWith("custom_")

  return (
    <div className="rounded-xl border border-[#222222] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_140px_80px_1fr_32px] bg-[#181818] px-3 py-2.5 text-[10px] font-medium text-[#4A4A4A] tracking-[0.15em] uppercase">
        <div />
        <div>Servicio</div>
        <div>Valor neto</div>
        <div>Aplica</div>
        <div>Observaciones</div>
        <div />
      </div>

      {servicios.map((s, idx) => (
        <div
          key={s.id}
          className={cn(
            "grid grid-cols-[40px_1fr_140px_80px_1fr_32px] items-center gap-2 px-3 py-2.5 border-t border-[#1E1E1E]",
            idx === 0 && "border-t-0",
            s.activo ? "bg-[#1C1C1C] border-l-2 border-l-[#4F6EF7]" : "bg-[#181818] border-l-2 border-l-transparent opacity-50"
          )}
        >
          <Switch
            checked={s.activo}
            onCheckedChange={v => update(s.id, { activo: v })}
            className="data-[state=checked]:bg-[#4F6EF7]"
          />
          {isCustom(s.id) ? (
            <Input
              className="h-7 text-sm bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#4F6EF7]"
              placeholder="Nombre del servicio..."
              value={s.nombre}
              onChange={e => update(s.id, { nombre: e.target.value })}
            />
          ) : (
            <span className="text-sm text-[#F2F2F2] truncate">{s.nombre}</span>
          )}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#737373]">$</span>
            <Input
              className="pl-5 h-7 text-sm bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#4F6EF7]"
              placeholder="0"
              value={fmt(s.valorNeto)}
              disabled={!s.activo}
              onChange={e => update(s.id, { valorNeto: parse(e.target.value) })}
            />
          </div>
          <button
            type="button"
            onClick={() => update(s.id, { esPorPersona: !s.esPorPersona })}
            className={cn(
              "text-[10px] font-medium rounded px-1.5 py-0.5 border transition-colors cursor-pointer",
              s.esPorPersona
                ? "bg-[#4F6EF7]/10 text-[#4F6EF7] border-[#4F6EF7]/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            )}
          >
            {s.esPorPersona ? "×pax" : "grupo"}
          </button>
          <Input
            className="h-7 text-sm bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#4F6EF7]"
            placeholder="Detalles..."
            value={s.obs}
            disabled={!s.activo}
            onChange={e => update(s.id, { obs: e.target.value })}
          />
          {isCustom(s.id) ? (
            <button type="button" onClick={() => remove(s.id)} className="text-[#737373] hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : <div />}
        </div>
      ))}

      {/* Add custom */}
      <div className="border-t border-[#1E1E1E] bg-[#181818] px-3 py-2">
        <button
          type="button"
          onClick={addCustom}
          className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#4F6EF7] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir servicio personalizado
        </button>
      </div>
    </div>
  )
}
