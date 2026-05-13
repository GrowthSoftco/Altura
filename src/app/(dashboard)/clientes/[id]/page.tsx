export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Phone, Mail, CreditCard } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EstadoBadge } from "@/components/cotizaciones/estado-badge"
import { ClienteForm } from "@/components/clientes/cliente-form"
import { formatCOP } from "@/lib/utils"
import { EstadoCotizacion } from "@/types"

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      cotizaciones: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!cliente) notFound()

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/clientes"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-[#737373] hover:text-[#F2F2F2]")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-9 w-9 rounded-full bg-[#1E2A4A] flex items-center justify-center text-[#4F6EF7] font-bold text-base shrink-0">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#F2F2F2] tracking-tight">
              {cliente.nombre}
            </h1>
            <p className="text-xs text-[#737373]">
              Cliente desde {format(new Date(cliente.createdAt), "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <ClienteForm
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="border-[#262626] bg-[#1C1C1C] text-[#737373] hover:text-[#F2F2F2] hover:bg-[#242424] h-8 text-xs"
            >
              Editar
            </Button>
          }
          cliente={{
            ...cliente,
            correo:    cliente.correo    ?? null,
            documento: cliente.documento ?? null,
          }}
        />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#1C1C1C] border-[#222222]">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">
              Contacto
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm px-4 pb-4">
            <div className="flex items-center gap-2 text-[#C0C0C0]">
              <Phone className="h-3.5 w-3.5 text-[#737373] shrink-0" />
              {cliente.telefono}
            </div>
            {cliente.correo && (
              <div className="flex items-center gap-2 text-[#C0C0C0]">
                <Mail className="h-3.5 w-3.5 text-[#737373] shrink-0" />
                {cliente.correo}
              </div>
            )}
            {cliente.documento && (
              <div className="flex items-center gap-2 text-[#C0C0C0]">
                <CreditCard className="h-3.5 w-3.5 text-[#737373] shrink-0" />
                {cliente.documento}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1C1C1C] border-[#222222]">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">
              Resumen
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm px-4 pb-4">
            <div className="flex justify-between">
              <span className="text-[#737373]">Total cotizaciones</span>
              <span className="text-[#F2F2F2] font-medium tabular-nums">{cliente.cotizaciones.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Completadas</span>
              <span className="text-emerald-400 font-medium tabular-nums">
                {cliente.cotizaciones.filter((c: { estado: string }) => c.estado === "COMPLETADA").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial */}
      <div className="space-y-2.5">
        <p className="text-xs text-[#4A4A4A] font-medium uppercase tracking-wider">
          Historial de Cotizaciones
        </p>
        {cliente.cotizaciones.length === 0 && (
          <p className="text-[#4A4A4A] text-sm py-8 text-center">
            No hay cotizaciones para este cliente
          </p>
        )}
        {cliente.cotizaciones.map((cot) => (
          <Link
            key={cot.id}
            href={`/cotizaciones/${cot.id}`}
            className="flex items-center justify-between rounded-xl border border-[#222222] bg-[#1C1C1C] p-4 hover:border-[#2E2E2E] hover:bg-[#202020] transition-all"
          >
            <div>
              <p className="font-mono text-xs text-[#4F6EF7] font-medium">{cot.codigo}</p>
              <p className="text-sm text-[#F2F2F2] mt-0.5">
                {cot.origen} → {cot.destino}
              </p>
              <p className="text-xs text-[#737373] mt-0.5">
                {format(new Date(cot.fechaCreacion), "dd MMM yyyy", { locale: es })}
              </p>
            </div>
            <div className="text-right space-y-1.5">
              <p className="text-sm font-semibold text-[#4F6EF7] tabular-nums">
                {formatCOP(Number(cot.valorConPorcentaje))}
              </p>
              <EstadoBadge estado={cot.estado as EstadoCotizacion} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
