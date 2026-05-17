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
  mostrarPlanPagos: boolean
  onTogglePlanPagos: (v: boolean) => void
  onGuardar: () => void
  onGenerarPDF: () => void
  isLoading?: boolean
}

export function ResumenCard({
  calculos, porcentaje, adultos, menores,
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
          <span className="text-[#737373]">Utilidad aplicada</span>
          <span className="text-[#4F6EF7] tabular-nums">{porcentaje}%</span>
        </div>

        <Separator className="bg-[#222222]" />

        <div className="flex justify-between font-semibold">
          <span className="text-[#F2F2F2] text-sm">Valor / persona</span>
          <span className="text-[#4F6EF7] tabular-nums">{formatCOP(calculos.valorPorPersona)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-[#F2F2F2]">Total</span>
          <span className="text-[#4F6EF7] text-lg tabular-nums">{formatCOP(calculos.valorConUtilidad)}</span>
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

        <button
          type="button"
          onClick={() => onTogglePlanPagos(!mostrarPlanPagos)}
          className="flex items-center gap-2 text-xs text-[#737373] hover:text-[#F2F2F2] transition-colors w-full"
        >
          {mostrarPlanPagos
            ? <ToggleRight className="h-4 w-4 text-[#4F6EF7]" />
            : <ToggleLeft className="h-4 w-4" />}
          {mostrarPlanPagos ? "Ocultar plan de pagos en PDF" : "Mostrar plan de pagos en PDF"}
        </button>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-4 pt-0">
        <Button
          className="w-full bg-[#4F6EF7] hover:bg-[#6B85F9] text-white font-semibold shadow-md shadow-[#4F6EF7]/15"
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
