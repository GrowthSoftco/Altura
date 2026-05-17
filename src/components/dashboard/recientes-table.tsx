"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Eye } from "lucide-react"
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
            <TableHead className="w-10" />
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
              <TableCell className="font-mono text-xs text-[#272F46] font-medium py-3">
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
                <Link
                  href={`/cotizaciones/${cot.id}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-7 w-7 text-[#4A4A4A] hover:text-[#F2F2F2] hover:bg-[#2A2A2A]"
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
