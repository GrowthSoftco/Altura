"use client"

import { Download, Save } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCOP } from "@/lib/utils"
import { CalculoPrecios } from "@/types"

interface ResumenCardProps {
  calculos: CalculoPrecios
  porcentaje: number
  totalPax: number
  onGuardar: () => void
  onGenerarPDF: () => void
  isLoading?: boolean
}

export function ResumenCard({
  calculos,
  porcentaje,
  onGuardar,
  onGenerarPDF,
  isLoading,
}: ResumenCardProps) {
  const { valorNetoIndividual, valorNetoTotal, gananciaTotal, valorConPorcentaje, planPagos } =
    calculos

  return (
    <Card className="sticky top-6 border-[#222222] bg-[#1C1C1C] overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 border-b border-[#222222]">
        <p className="text-xs font-semibold text-[#F2F2F2] tracking-tight">
          Resumen de Cotización
        </p>
      </CardHeader>

      <CardContent className="space-y-2.5 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#737373]">Valor neto / pax</span>
          <span className="font-medium text-[#F2F2F2] tabular-nums">{formatCOP(valorNetoIndividual)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#737373]">Valor neto total</span>
          <span className="font-medium text-[#F2F2F2] tabular-nums">{formatCOP(valorNetoTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#4F6EF7]">
          <span>Ganancia ({porcentaje}%)</span>
          <span className="font-medium tabular-nums">+{formatCOP(gananciaTotal)}</span>
        </div>

        <Separator className="bg-[#222222]" />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-[#F2F2F2] text-sm">Total</span>
          <span className="text-lg font-bold text-[#4F6EF7] tabular-nums">
            {formatCOP(valorConPorcentaje)}
          </span>
        </div>

        <Separator className="bg-[#222222]" />

        <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider">Plan de Pagos</p>
        {(
          [
            { label: "Pago 1 (50%)", cuota: planPagos.pago1 },
            { label: "Pago 2 (30%)", cuota: planPagos.pago2 },
            { label: "Pago 3 (20%)", cuota: planPagos.pago3 },
          ] as const
        ).map(({ label, cuota }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-[#737373]">{label}</span>
            <span className="text-[#F2F2F2] tabular-nums">{formatCOP(cuota.valorTotal)}</span>
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-4 pt-0">
        <Button
          className="w-full bg-[#4F6EF7] hover:bg-[#6B85F9] text-white font-semibold shadow-md shadow-[#4F6EF7]/15"
          onClick={onGenerarPDF}
          disabled={isLoading}
          type="button"
        >
          <Download className="mr-2 h-4 w-4" />
          Generar PDF
        </Button>
        <Button
          className="w-full bg-[#1C1C1C] hover:bg-[#242424] text-[#F2F2F2] border border-[#262626] font-medium"
          variant="outline"
          onClick={onGuardar}
          disabled={isLoading}
          type="button"
        >
          <Save className="mr-2 h-4 w-4" />
          Guardar cotización
        </Button>
      </CardFooter>
    </Card>
  )
}
