"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Download, ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"
import { pdf } from "@react-pdf/renderer"
import { saveAs } from "file-saver"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { EstadoBadge } from "@/components/cotizaciones/estado-badge"
import { CotizacionPDF } from "@/components/cotizaciones/cotizacion-pdf"
import { formatCOP, calcularDuracion } from "@/lib/calculos"
import { CotizacionCompleta, EstadoCotizacion } from "@/types"

const ESTADOS: EstadoCotizacion[] = [
  "COTIZADA", "NEGOCIACION", "APROBADA", "PAGANDO", "COMPLETADA", "CANCELADA",
]

export default function CotizacionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [cot, setCot]       = useState<CotizacionCompleta | null>(null)
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/cotizaciones/${id}`)
      .then((r) => r.json())
      .then(setCot)
      .finally(() => setLoad(false))
  }, [id])

  const handleEstado = async (estado: EstadoCotizacion) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cotizaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })
      const updated = await res.json()
      setCot(updated)
      toast.success("Estado actualizado")
    } catch {
      toast.error("Error al actualizar")
    } finally {
      setSaving(false)
    }
  }

  const handlePDF = async () => {
    if (!cot) return
    try {
      const blob = await pdf(<CotizacionPDF cotizacion={cot} />).toBlob()
      saveAs(blob, `Cotizacion_${cot.cliente.nombre}_${cot.codigo}.pdf`)
    } catch (e) {
      toast.error("Error al generar PDF")
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#808080]">Cargando...</p>
      </div>
    )
  }

  if (!cot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-[#808080]">Cotización no encontrada</p>
        <Link href="/cotizaciones" className={cn(buttonVariants({ variant: "outline" }))}>
          Volver
        </Link>
      </div>
    )
  }

  const duracion = calcularDuracion(
    new Date(cot.fechaSalida),
    new Date(cot.fechaRegreso)
  )

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/cotizaciones"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-[#737373] hover:text-[#F2F2F2]")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[#F2F2F2] tracking-tight font-mono">
              {cot.codigo}
            </h1>
            <p className="text-xs text-[#737373]">
              {format(new Date(cot.fechaCreacion), "dd MMMM yyyy", { locale: es })}
            </p>
          </div>
          <EstadoBadge estado={cot.estado} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/cotizaciones/${id}/editar`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-[#262626] bg-[#1C1C1C] text-[#737373] hover:text-[#F2F2F2] hover:bg-[#242424] h-9 gap-1.5")}
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Link>
          <Select
            value={cot.estado}
            onValueChange={(v) => handleEstado(v as EstadoCotizacion)}
            disabled={saving}
          >
            <SelectTrigger className="w-40 bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2]">
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e} className="focus:bg-[#242424]">
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handlePDF}
            className="bg-white hover:bg-gray-100 text-[#272F46] font-semibold h-9 px-4 shadow-md shadow-[#272F46]/10"
          >
            <Download className="mr-2 h-4 w-4" /> Descargar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Cliente */}
        <Card className="bg-[#1C1C1C] border-[#222222]">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">
              Cliente
            </p>
          </CardHeader>
          <CardContent className="space-y-1 text-sm px-4 pb-4">
            <p className="font-medium text-[#F2F2F2]">{cot.cliente.nombre}</p>
            <p className="text-[#737373]">{cot.cliente.telefono}</p>
            {cot.cliente.correo && (
              <p className="text-[#737373]">{cot.cliente.correo}</p>
            )}
          </CardContent>
        </Card>

        {/* Viaje */}
        <Card className="bg-[#1C1C1C] border-[#222222]">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">
              Viaje
            </p>
          </CardHeader>
          <CardContent className="space-y-1 text-sm px-4 pb-4">
            <p className="font-medium text-[#F2F2F2]">
              {cot.origen} → {cot.destino}
            </p>
            <p className="text-[#737373]">
              {format(new Date(cot.fechaSalida), "dd/MM/yyyy")} –{" "}
              {format(new Date(cot.fechaRegreso), "dd/MM/yyyy")}
            </p>
            <p className="text-[#737373]">{duracion.label}</p>
            <p className="text-[#737373]">
              {cot.adultos} adulto(s){cot.menores > 0 ? `, ${cot.menores} menor(es)` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Servicios */}
      <Card className="bg-[#1C1C1C] border-[#222222]">
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">
            Servicios incluidos
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {cot.servicios
              .filter((s) => s.activo)
              .map((s) => (
                <div key={s.id} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  <div>
                    <p className="text-[#F2F2F2]">{s.nombre}</p>
                    {s.obs && <p className="text-[#737373] text-xs">{s.obs}</p>}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Valores */}
      <Card className="bg-[#1C1C1C] border-[#222222]">
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">
            Resumen Financiero
          </p>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">Valor neto / pax</span>
            <span className="text-[#F2F2F2] tabular-nums">{formatCOP(Number(cot.valorNetoIndividual))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">Valor neto total</span>
            <span className="text-[#F2F2F2] tabular-nums">{formatCOP(Number(cot.valorNetoTotal))}</span>
          </div>
          <div className="flex justify-between text-sm text-[#272F46]">
            <span>Ganancia ({Number(cot.porcentajeGanancia)}%)</span>
            <span className="tabular-nums">+{formatCOP(Number(cot.gananciaTotal))}</span>
          </div>
          <Separator className="bg-[#222222]" />
          <div className="flex justify-between font-semibold">
            <span className="text-[#F2F2F2]">Total</span>
            <span className="text-[#272F46] text-base tabular-nums">
              {formatCOP(Number(cot.valorConPorcentaje))}
            </span>
          </div>
          <Separator className="bg-[#222222]" />
          <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider pt-1">Plan de pagos</p>
          {(() => {
            const plan = cot.planPagos as unknown as Record<string, unknown>
            // New format: { cuotas: [...] }
            if (plan && Array.isArray(plan.cuotas)) {
              return (plan.cuotas as Array<{ numero: number; porcentaje: number; valorTotal: number }>).map(c => (
                <div key={c.numero} className="flex justify-between text-sm">
                  <span className="text-[#737373]">Cuota {c.numero} ({c.porcentaje}%)</span>
                  <span className="text-[#F2F2F2] tabular-nums">{formatCOP(c.valorTotal)}</span>
                </div>
              ))
            }
            // Legacy format: { pago1, pago2, pago3 }
            return (["pago1", "pago2", "pago3"] as const).map((key, i) => {
              const p = plan[key] as { porcentaje: number; valorTotal: number } | undefined
              if (!p) return null
              return (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-[#737373]">Pago {i + 1} ({p.porcentaje}%)</span>
                  <span className="text-[#F2F2F2] tabular-nums">{formatCOP(p.valorTotal)}</span>
                </div>
              )
            })
          })()}
        </CardContent>
      </Card>

      {cot.observaciones && (
        <Card className="bg-[#1C1C1C] border-[#222222]">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">
              Observaciones
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-[#C0C0C0]">{cot.observaciones}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
