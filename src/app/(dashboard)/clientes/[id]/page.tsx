"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Phone, Mail, CreditCard, FilePlus, Trash2, Eye, Copy, Loader2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EstadoBadge } from "@/components/cotizaciones/estado-badge"
import { ClienteForm } from "@/components/clientes/cliente-form"
import { ConfirmDialog, type ConfirmState } from "@/components/ui/confirm-dialog"
import { formatCOP } from "@/lib/utils"
import { EstadoCotizacion, ClienteBase } from "@/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CotizacionRow {
  id: string
  codigo: string
  origen: string
  destino: string
  fechaCreacion: string
  valorConPorcentaje: string
  estado: EstadoCotizacion
}

interface ClienteDetalle extends ClienteBase {
  cotizaciones: CotizacionRow[]
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cliente, setCliente]   = useState<ClienteDetalle | null>(null)
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm]   = useState<ConfirmState | null>(null)
  const [isAdmin, setIsAdmin]   = useState(false)
  const [busyId, setBusyId]     = useState<string | null>(null)

  const fetchCliente = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${id}`)
      if (!res.ok) { router.push("/clientes"); return }
      setCliente(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchCliente()
    fetch("/api/auth/me").then(r => r.json()).then(d => setIsAdmin(d?.rol === "ADMIN"))
  }, [id])

  const duplicarCotizacion = async (cotId: string) => {
    setBusyId(cotId)
    try {
      const res = await fetch(`/api/cotizaciones/${cotId}/duplicate`, { method: "POST" })
      if (!res.ok) throw new Error()
      const nueva = await res.json()
      toast.success(`Duplicada: ${nueva.codigo}`)
      fetchCliente()
    } catch { toast.error("Error al duplicar") }
    finally { setBusyId(null) }
  }

  const handleDelete = () => setConfirm({
    title: `Eliminar a ${cliente?.nombre}`,
    description: "Se eliminarán también todas sus cotizaciones. Esta acción no se puede deshacer.",
    confirmLabel: "Eliminar", danger: true,
    action: async () => {
      setDeleting(true)
      try {
        await fetch(`/api/clientes/${id}`, { method: "DELETE" })
        toast.success("Cliente eliminado")
        router.push("/clientes")
      } catch { toast.error("Error al eliminar"); setDeleting(false); setConfirm(null) }
    },
  })

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#737373]">Cargando...</p></div>
  if (!cliente) return null

  return (
    <div className="space-y-5 max-w-3xl">
      <ConfirmDialog state={confirm} loading={deleting} onClose={() => setConfirm(null)} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-[#737373] hover:text-[#F2F2F2]")}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-9 w-9 rounded-full bg-[#1A2035] flex items-center justify-center text-[#00B4C5] font-bold text-base shrink-0">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#F2F2F2] tracking-tight">{cliente.nombre}</h1>
            <p className="text-xs text-[#737373]">
              Cliente desde {format(new Date(cliente.createdAt), "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/cotizaciones/nueva?clienteId=${id}`}
            className={cn(buttonVariants({ size: "sm" }), "bg-white hover:bg-gray-100 text-[#00B4C5] font-medium h-8 text-xs gap-1.5")}>
            <FilePlus className="h-3.5 w-3.5" /> Nueva cotización
          </Link>
          <ClienteForm
            trigger={
              <Button variant="outline" size="sm"
                className="border-[#262626] bg-[#1C1C1C] text-[#737373] hover:text-[#F2F2F2] hover:bg-[#242424] h-8 text-xs">
                Editar
              </Button>
            }
            cliente={{ ...cliente, correo: cliente.correo ?? null, documento: cliente.documento ?? null }}
            onSuccess={() => fetchCliente()}
          />
          {isAdmin && (
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting}
            className="text-[#737373] hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0">
            <Trash2 className="h-4 w-4" />
          </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#1C1C1C] border-[#222222]">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">Contacto</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm px-4 pb-4">
            <div className="flex items-center gap-2 text-[#C0C0C0]">
              <Phone className="h-3.5 w-3.5 text-[#737373] shrink-0" />{cliente.telefono}
            </div>
            {cliente.correo && <div className="flex items-center gap-2 text-[#C0C0C0]">
              <Mail className="h-3.5 w-3.5 text-[#737373] shrink-0" />{cliente.correo}
            </div>}
            {cliente.documento && <div className="flex items-center gap-2 text-[#C0C0C0]">
              <CreditCard className="h-3.5 w-3.5 text-[#737373] shrink-0" />{cliente.documento}
            </div>}
          </CardContent>
        </Card>
        <Card className="bg-[#1C1C1C] border-[#222222]">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">Resumen</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm px-4 pb-4">
            <div className="flex justify-between">
              <span className="text-[#737373]">Total cotizaciones</span>
              <span className="text-[#F2F2F2] font-medium">{cliente.cotizaciones.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Viajes realizados</span>
              <span className="text-emerald-400 font-medium">
                {cliente.cotizaciones.filter((c: CotizacionRow) => c.estado === "VIAJE_REALIZADO").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs text-[#4A4A4A] font-medium uppercase tracking-wider">Historial de Cotizaciones</p>
        {cliente.cotizaciones.length === 0 && (
          <p className="text-[#4A4A4A] text-sm py-8 text-center">No hay cotizaciones para este cliente</p>
        )}
        {cliente.cotizaciones.map(cot => (
          <div key={cot.id} className="flex items-center justify-between rounded-xl border border-[#222222] bg-[#1C1C1C] p-4 hover:border-[#2E2E2E] hover:bg-[#202020] transition-all">
            <div>
              <p className="font-mono text-xs text-[#00B4C5] font-medium">{cot.codigo}</p>
              <p className="text-sm text-[#F2F2F2] mt-0.5">{cot.origen} → {cot.destino}</p>
              <p className="text-xs text-[#737373] mt-0.5">{format(new Date(cot.fechaCreacion), "dd MMM yyyy", { locale: es })}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right space-y-1.5 mr-2">
                <p className="text-sm font-semibold text-[#00B4C5] tabular-nums">{formatCOP(Number(cot.valorConPorcentaje))}</p>
                <EstadoBadge estado={cot.estado} />
              </div>
              <Link href={`/cotizaciones/${cot.id}`} title="Ver" className="h-8 w-8 flex items-center justify-center rounded-lg text-[#4A4A4A] hover:text-[#F2F2F2] hover:bg-[#2A2A2A] transition-colors">
                <Eye className="h-4 w-4" />
              </Link>
              <button type="button" title="Duplicar" disabled={busyId === cot.id} onClick={() => duplicarCotizacion(cot.id)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-[#4A4A4A] hover:text-[#00B4C5] hover:bg-[#2A2A2A] transition-colors disabled:opacity-40">
                {busyId === cot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
