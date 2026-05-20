"use client"

import { Download, Save, ToggleLeft, ToggleRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCOP } from "@/lib/utils"
import { CalculoPrecios } from "@/types"

interface ResumenCardProps {
  calculos: CalculoPrecios
  porcentaje: number
  adultos: number
  menores: number
  cobrarIva: boolean
  onToggleIva: (v: boolean) => void
  mostrarPlanPagos: boolean
  onTogglePlanPagos: (v: boolean) => void
  onGuardar: () => void
  onGenerarPDF: () => void
  isLoading?: boolean
}

export function ResumenCard({
  calculos, porcentaje, adultos, menores,
  cobrarIva, onToggleIva,
  mostrarPlanPagos, onTogglePlanPagos,
  onGuardar, onGenerarPDF, isLoading
}: ResumenCardProps) {
  const totalPax = adultos + menores

  return (
    <Card className="sticky top-6 border-[#222222] bg-[#1C1C1C] overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 border-b border-[#222222]">
        <p className="text-xs font-semibold text-[#F2F2F2]">Resumen</p>
      </CardHeader>

      <CardContent className="space-y-2.5 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#737373]">Pasajeros</span>
          <span className="text-[#F2F2F2] tabular-nums">{totalPax} pax</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#737373]">Utilidad ({porcentaje}%)</span>
          <span className="text-[#00B4C5] tabular-nums">
            {formatCOP(calculos.valorConUtilidad - calculos.costoNetoTotal)}
          </span>
        </div>

        <Separator className="bg-[#222222]" />

        {/* Subtotal antes de IVA */}
        <div className="flex justify-between text-sm">
          <span className="text-[#737373]">Subtotal</span>
          <span className="text-[#F2F2F2] tabular-nums">{formatCOP(calculos.valorConUtilidad)}</span>
        </div>

        {/* IVA row — solo visible si está activo */}
        {cobrarIva && (
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">IVA (19%)</span>
            <span className="text-amber-400 tabular-nums">+{formatCOP(calculos.ivaTotal)}</span>
          </div>
        )}

        <Separator className="bg-[#222222]" />

        <div className="flex justify-between font-semibold">
          <span className="text-[#F2F2F2] text-sm">Valor / persona</span>
          <span className="text-[#00B4C5] tabular-nums">{formatCOP(calculos.valorPorPersona)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-[#F2F2F2]">Total</span>
          <span className="text-[#00B4C5] text-lg tabular-nums">{formatCOP(calculos.valorFinal)}</span>
        </div>

        {mostrarPlanPagos && calculos.planPagos.aplicar && calculos.planPagos.cuotas.length > 0 && (
          <>
            <Separator className="bg-[#222222]" />
            <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider">Plan de pagos</p>
            {calculos.planPagos.cuotas.map(c => (
              <div key={c.numero} className="flex justify-between text-sm">
                <span className="text-[#737373]">Cuota {c.numero} ({c.porcentaje}%)</span>
                <span className="text-[#F2F2F2] tabular-nums">{formatCOP(c.valorTotal)}</span>
              </div>
            ))}
          </>
        )}

        <Separator className="bg-[#222222]" />

        {/* Toggle IVA */}
        <button
          type="button"
          onClick={() => onToggleIva(!cobrarIva)}
          className="flex items-center gap-2 text-xs transition-colors w-full cursor-pointer"
        >
          {cobrarIva
            ? <ToggleRight className="h-4 w-4 text-amber-400 shrink-0" />
            : <ToggleLeft  className="h-4 w-4 text-[#4A4A4A] shrink-0" />}
          <span className={cobrarIva ? "text-amber-400 font-medium" : "text-[#737373]"}>
            {cobrarIva ? "IVA incluido (19%)" : "No cobrar IVA"}
          </span>
        </button>

        {/* Toggle plan de pagos */}
        <button
          type="button"
          onClick={() => onTogglePlanPagos(!mostrarPlanPagos)}
          className="flex items-center gap-2 text-xs text-[#737373] hover:text-[#F2F2F2] transition-colors w-full cursor-pointer"
        >
          {mostrarPlanPagos
            ? <ToggleRight className="h-4 w-4 text-[#00B4C5]" />
            : <ToggleLeft className="h-4 w-4" />}
          {mostrarPlanPagos ? "Ocultar plan de pagos en PDF" : "Mostrar plan de pagos en PDF"}
        </button>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-4 pt-0">
        <Button
          className="w-full bg-white hover:bg-gray-100 text-[#1A1A1A] font-semibold shadow-md shadow-black/10"
          onClick={onGenerarPDF} disabled={isLoading} type="button"
        >
          <Download className="mr-2 h-4 w-4" /> Generar PDF
        </Button>
        <Button
          className="w-full bg-[#1C1C1C] hover:bg-[#242424] text-[#F2F2F2] border border-[#262626] font-medium"
          variant="outline" onClick={onGuardar} disabled={isLoading} type="button"
        >
          <Save className="mr-2 h-4 w-4" /> Guardar cotización
        </Button>
      </CardFooter>
    </Card>
  )
}
