"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Search, UserPlus, Phone, Mail, CreditCard, FilePlus, Eye, Copy, Trash2, Loader2, Users, ArrowLeft,
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClienteForm } from "@/components/clientes/cliente-form"
import { ConfirmDialog, type ConfirmState } from "@/components/ui/confirm-dialog"
import { EstadoBadge } from "@/components/cotizaciones/estado-badge"
import { formatCOP } from "@/lib/utils"
import { EstadoCotizacion, ClienteBase } from "@/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Paleta de colores para avatares; se asigna de forma estable según el nombre/id
const AVATAR_COLORS = [
  "bg-[#00B4C5]/15 text-[#22d3ee]",
  "bg-blue-500/15 text-blue-400",
  "bg-violet-500/15 text-violet-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
  "bg-rose-500/15 text-rose-400",
  "bg-indigo-500/15 text-indigo-400",
  "bg-teal-500/15 text-teal-400",
  "bg-orange-500/15 text-orange-400",
  "bg-pink-500/15 text-pink-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-fuchsia-500/15 text-fuchsia-400",
  "bg-lime-500/15 text-lime-400",
  "bg-sky-500/15 text-sky-400",
]
function avatarColor(key: string) {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

interface ClienteRow {
  id: string
  nombre: string
  telefono: string
  correo: string | null
  createdAt: string
  _count?: { cotizaciones: number }
}

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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<ClienteDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const [isAdmin, setIsAdmin] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isMobile = useIsMobile()

  const fetchClientes = useCallback(async (q = "") => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      const data: ClienteRow[] = await res.json()
      setClientes(data)
    } finally { setLoading(false) }
  }, [])

  // Selección: respeta ?c=ID (al volver desde una cotización); en escritorio
  // auto-selecciona el primero; en móvil arranca en la lista.
  useEffect(() => {
    setSelectedId(prev => {
      if (clientes.length === 0) return null
      if (prev && clientes.some(c => c.id === prev)) return prev
      const fromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("c") : null
      if (fromUrl && clientes.some(c => c.id === fromUrl)) return fromUrl
      return isMobile ? null : clientes[0].id
    })
  }, [clientes, isMobile])

  const fetchDetalle = useCallback(async (id: string) => {
    setLoadingDetalle(true)
    try {
      const res = await fetch(`/api/clientes/${id}`)
      if (res.ok) setDetalle(await res.json())
      else setDetalle(null)
    } finally { setLoadingDetalle(false) }
  }, [])

  useEffect(() => {
    fetchClientes()
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => setIsAdmin(d?.rol === "ADMIN"))
  }, [fetchClientes])

  useEffect(() => {
    const t = setTimeout(() => fetchClientes(query), 300)
    return () => clearTimeout(t)
  }, [query, fetchClientes])

  useEffect(() => {
    if (selectedId) fetchDetalle(selectedId)
    else setDetalle(null)
  }, [selectedId, fetchDetalle])

  const duplicarCotizacion = async (cotId: string) => {
    setBusyId(cotId)
    try {
      const res = await fetch(`/api/cotizaciones/${cotId}/duplicate`, { method: "POST" })
      if (!res.ok) throw new Error()
      const nueva = await res.json()
      toast.success(`Duplicada: ${nueva.codigo}`)
      if (selectedId) fetchDetalle(selectedId)
    } catch { toast.error("Error al duplicar") }
    finally { setBusyId(null) }
  }

  const eliminarCotizacion = (cot: CotizacionRow) => setConfirm({
    title: `Eliminar cotización ${cot.codigo}`,
    description: "Esta acción no se puede deshacer.",
    confirmLabel: "Eliminar", danger: true,
    action: async () => {
      setBusyId(cot.id)
      try {
        const r = await fetch(`/api/cotizaciones/${cot.id}`, { method: "DELETE" })
        if (!r.ok) { toast.error("Error al eliminar"); return }
        toast.success("Cotización eliminada")
        setDetalle(prev => prev ? { ...prev, cotizaciones: prev.cotizaciones.filter(c => c.id !== cot.id) } : prev)
        setConfirm(null)
      } catch { toast.error("Error al eliminar") }
      finally { setBusyId(null) }
    },
  })

  const eliminarCliente = () => detalle && setConfirm({
    title: `Eliminar a ${detalle.nombre}`,
    description: "Se eliminarán también todas sus cotizaciones. Esta acción no se puede deshacer.",
    confirmLabel: "Eliminar", danger: true,
    action: async () => {
      setDeleting(true)
      try {
        const r = await fetch(`/api/clientes/${detalle.id}`, { method: "DELETE" })
        if (!r.ok) { toast.error("Error al eliminar"); return }
        toast.success("Cliente eliminado")
        setConfirm(null)
        setDetalle(null)
        setSelectedId(null)
        fetchClientes(query)
      } catch { toast.error("Error al eliminar") }
      finally { setDeleting(false) }
    },
  })

  return (
    <div className="flex flex-col md:h-[calc(100svh-6.5rem)] max-w-7xl mx-auto">
      <ConfirmDialog state={confirm} loading={deleting || !!busyId} onClose={() => setConfirm(null)} />

      {/* Heading */}
      <div className="flex items-center justify-between shrink-0 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">Clientes</h1>
          <p className="text-sm text-[#737373] mt-0.5">{clientes.length} cliente(s)</p>
        </div>
        <ClienteForm
          trigger={
            <Button className="bg-white hover:bg-gray-100 text-[#0A0A0A] font-semibold text-sm h-9 px-4 rounded-full shadow-sm">
              <UserPlus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          }
          onSuccess={() => fetchClientes(query)}
        />
      </div>

      {/* Master-detail */}
      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 md:flex-1 md:min-h-0">

        {/* ── LISTA ── */}
        <div className={cn(
          "flex-col rounded-2xl border border-[#222222] bg-[#171717] overflow-hidden md:h-auto h-[70vh] md:flex",
          selectedId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-3 border-b border-[#1F1F1F] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
              <Input
                className="pl-9 bg-[#141414] border-[#2A2A2A] text-[#F2F2F2] focus:border-[#00B4C5] h-9 rounded-lg"
                placeholder="Buscar cliente..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <p className="text-center text-[#737373] py-10 text-sm">Cargando...</p>}
            {!loading && clientes.length === 0 && (
              <p className="text-center text-[#4A4A4A] py-10 text-sm px-4">
                {query ? `Sin resultados para "${query}"` : "No hay clientes aún"}
              </p>
            )}
            {clientes.map(c => {
              const active = c.id === selectedId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-[#202020]" : "hover:bg-[#1C1C1C]"
                  )}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                    avatarColor(c.id)
                  )}>
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium truncate", active ? "text-[#F2F2F2]" : "text-[#D5D5D5]")}>{c.nombre}</p>
                    <p className="text-xs text-[#5E5E5E] truncate">{c.telefono}</p>
                  </div>
                  {!!c._count?.cotizaciones && (
                    <span className="shrink-0 text-[10px] font-medium text-[#737373] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-2 py-0.5">
                      {c._count.cotizaciones}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── DETALLE ── */}
        <div className={cn(
          "rounded-2xl border border-[#222222] bg-[#171717] overflow-y-auto",
          selectedId ? "block" : "hidden md:block"
        )}>
          {/* Volver (solo móvil) */}
          {selectedId && (
            <button type="button" onClick={() => setSelectedId(null)}
              className="md:hidden flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#F2F2F2] px-5 pt-4 -mb-1">
              <ArrowLeft className="h-4 w-4" /> Volver a la lista
            </button>
          )}
          {!selectedId && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-8">
              <div className="h-12 w-12 rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
                <Users className="h-5 w-5 text-[#4A4A4A]" />
              </div>
              <p className="text-sm text-[#5E5E5E]">Selecciona un cliente para ver su detalle</p>
            </div>
          )}

          {selectedId && loadingDetalle && !detalle && (
            <div className="h-full flex items-center justify-center"><p className="text-[#737373] text-sm">Cargando...</p></div>
          )}

          {detalle && (
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn("h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0", avatarColor(detalle.id))}>
                    {detalle.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#F2F2F2] tracking-tight">{detalle.nombre}</h2>
                    <p className="text-xs text-[#737373]">
                      Cliente desde {format(new Date(detalle.createdAt), "MMMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Link href={`/cotizaciones/nueva?clienteId=${detalle.id}`}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white text-[#0A0A0A] text-xs font-semibold hover:bg-gray-100 transition-colors">
                    <FilePlus className="h-3.5 w-3.5" /> Nueva cotización
                  </Link>
                  <ClienteForm
                    trigger={
                      <Button variant="outline" size="sm"
                        className="border-[#2A2A2A] bg-[#141414] text-[#737373] hover:text-[#F2F2F2] hover:bg-[#1C1C1C] h-8 text-xs rounded-lg">
                        Editar
                      </Button>
                    }
                    cliente={{ ...detalle, correo: detalle.correo ?? null, documento: detalle.documento ?? null }}
                    onSuccess={() => { fetchDetalle(detalle.id); fetchClientes(query) }}
                  />
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={eliminarCliente} disabled={deleting}
                      className="text-[#737373] hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Info + resumen */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#222222] bg-[#1A1A1A] p-4 space-y-2">
                  <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">Contacto</p>
                  <div className="flex items-center gap-2 text-sm text-[#C0C0C0]">
                    <Phone className="h-3.5 w-3.5 text-[#737373] shrink-0" />{detalle.telefono}
                  </div>
                  {detalle.correo && <div className="flex items-center gap-2 text-sm text-[#C0C0C0]">
                    <Mail className="h-3.5 w-3.5 text-[#737373] shrink-0" />{detalle.correo}
                  </div>}
                  {detalle.documento && <div className="flex items-center gap-2 text-sm text-[#C0C0C0]">
                    <CreditCard className="h-3.5 w-3.5 text-[#737373] shrink-0" />{detalle.documento}
                  </div>}
                </div>
                <div className="rounded-xl border border-[#222222] bg-[#1A1A1A] p-4 space-y-2">
                  <p className="text-[11px] text-[#4A4A4A] font-medium uppercase tracking-wider">Resumen</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#737373]">Total cotizaciones</span>
                    <span className="text-[#F2F2F2] font-medium">{detalle.cotizaciones.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#737373]">Viajes realizados</span>
                    <span className="text-emerald-400 font-medium">
                      {detalle.cotizaciones.filter(c => c.estado === "VIAJE_REALIZADO").length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cotizaciones */}
              <div className="space-y-2.5">
                <p className="text-xs text-[#4A4A4A] font-medium uppercase tracking-wider">Historial de Cotizaciones</p>
                {detalle.cotizaciones.length === 0 && (
                  <p className="text-[#4A4A4A] text-sm py-8 text-center">No hay cotizaciones para este cliente</p>
                )}
                {detalle.cotizaciones.map(cot => (
                  <div key={cot.id} className="flex items-center justify-between rounded-xl border border-[#222222] bg-[#1A1A1A] p-4 hover:border-[#2E2E2E] transition-all">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-[#00B4C5] font-medium">{cot.codigo}</p>
                      <p className="text-sm text-[#F2F2F2] mt-0.5 truncate">{cot.origen} → {cot.destino}</p>
                      <p className="text-xs text-[#737373] mt-0.5">{format(new Date(cot.fechaCreacion), "dd MMM yyyy", { locale: es })}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right space-y-1.5 mr-2">
                        <p className="text-sm font-semibold text-[#00B4C5] tabular-nums">{formatCOP(Number(cot.valorConPorcentaje))}</p>
                        <EstadoBadge estado={cot.estado} />
                      </div>
                      <Link href={`/cotizaciones/${cot.id}?from=${encodeURIComponent(`/clientes?c=${detalle.id}`)}`} title="Ver" className="h-8 w-8 flex items-center justify-center rounded-lg text-[#4A4A4A] hover:text-[#F2F2F2] hover:bg-[#2A2A2A] transition-colors">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button type="button" title="Duplicar" disabled={busyId === cot.id} onClick={() => duplicarCotizacion(cot.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-[#4A4A4A] hover:text-[#00B4C5] hover:bg-[#2A2A2A] transition-colors disabled:opacity-40">
                        {busyId === cot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      </button>
                      {isAdmin && (
                        <button type="button" title="Eliminar cotización" disabled={busyId === cot.id} onClick={() => eliminarCotizacion(cot)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-[#4A4A4A] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
