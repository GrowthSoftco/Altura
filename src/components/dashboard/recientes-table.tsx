"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Eye, Copy, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EstadoBadge } from "@/components/cotizaciones/estado-badge"
import { formatCOP } from "@/lib/utils"
import { CotizacionCompleta } from "@/types"

export function RecientesTable({ cotizaciones }: { cotizaciones: CotizacionCompleta[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  const duplicar = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/cotizaciones/${id}/duplicate`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      const nueva = await res.json()
      toast.success(`Cotización duplicada: ${nueva.codigo}`)
      router.refresh()
    } catch (e) {
      toast.error(`Error al duplicar: ${e instanceof Error ? e.message.slice(0, 100) : "desconocido"}`)
    } finally {
      setBusyId(null)
    }
  }

  const eliminar = async (id: string, codigo: string) => {
    if (!window.confirm(`¿Eliminar la cotización ${codigo}? Esta acción no se puede deshacer.`)) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/cotizaciones/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success(`Cotización ${codigo} eliminada`)
      router.refresh()
    } catch (e) {
      toast.error(`Error al eliminar: ${e instanceof Error ? e.message.slice(0, 100) : "desconocido"}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="rounded-xl border border-[#222222] overflow-hidden bg-[#1C1C1C]">
      <Table>
        <TableHeader>
          <TableRow className="border-[#222222] hover:bg-transparent">
            <TableHead className="text-[#4A4A4A] text-[11px] uppercase tracking-wider font-medium h-10">Código</TableHead>
            <TableHead className="text-[#4A4A4A] text-[11px] uppercase tracking-wider font-medium h-10">Cliente</TableHead>
            <TableHead className="text-[#4A4A4A] text-[11px] uppercase tracking-wider font-medium h-10">Destino</TableHead>
            <TableHead className="text-[#4A4A4A] text-[11px] uppercase tracking-wider font-medium h-10">Fecha</TableHead>
            <TableHead className="text-[#4A4A4A] text-[11px] uppercase tracking-wider font-medium h-10">Valor</TableHead>
            <TableHead className="text-[#4A4A4A] text-[11px] uppercase tracking-wider font-medium h-10">Estado</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cotizaciones.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-[#4A4A4A] text-sm py-12">
                No hay cotizaciones aún
              </TableCell>
            </TableRow>
          )}
          {cotizaciones.map((cot) => (
            <TableRow
              key={cot.id}
              className="border-[#1E1E1E] hover:bg-[#202020] transition-colors"
            >
              <TableCell className="font-mono text-xs text-[#737373] font-medium py-3">
                {cot.codigo}
              </TableCell>
              <TableCell className="text-[#F2F2F2] text-sm py-3">
                {cot.cliente.nombre}
              </TableCell>
              <TableCell className="text-[#737373] text-sm py-3">
                {cot.origen} → {cot.destino}
              </TableCell>
              <TableCell className="text-[#737373] text-xs py-3 tabular-nums">
                {format(new Date(cot.fechaCreacion), "dd MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell className="text-[#F2F2F2] text-sm font-medium py-3 tabular-nums">
                {formatCOP(Number(cot.valorConPorcentaje))}
              </TableCell>
              <TableCell className="py-3">
                <EstadoBadge estado={cot.estado} />
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center justify-end gap-0.5">
                  <Link
                    href={`/cotizaciones/${cot.id}`}
                    title="Ver"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-7 w-7 text-[#4A4A4A] hover:text-[#F2F2F2] hover:bg-[#2A2A2A]"
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    title="Duplicar"
                    disabled={busyId === cot.id}
                    onClick={() => duplicar(cot.id)}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-7 w-7 text-[#4A4A4A] hover:text-[#00B4C5] hover:bg-[#2A2A2A] disabled:opacity-50"
                    )}
                  >
                    {busyId === cot.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    disabled={busyId === cot.id}
                    onClick={() => eliminar(cot.id, cot.codigo)}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-7 w-7 text-[#4A4A4A] hover:text-red-400 hover:bg-[#2A2A2A] disabled:opacity-50"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
