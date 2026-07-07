"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  FileText, FilePlus, Copy, Trash2, UserPlus, UserMinus,
  LogIn, KeyRound, Edit, Users, Settings, Activity,
} from "lucide-react"

interface Entrada {
  id: string
  tipo: string
  descripcion: string
  creadoEn: string
  usuario?: { nombre: string | null; usuario: string } | null
  meta?: Record<string, unknown> | null
}

const ICONOS: Record<string, React.ReactNode> = {
  COTIZACION_CREADA:    <FilePlus className="h-4 w-4 text-emerald-400" />,
  COTIZACION_EDITADA:   <Edit className="h-4 w-4 text-blue-400" />,
  COTIZACION_ELIMINADA: <Trash2 className="h-4 w-4 text-red-400" />,
  COTIZACION_DUPLICADA: <Copy className="h-4 w-4 text-[#00B4C5]" />,
  CLIENTE_CREADO:       <UserPlus className="h-4 w-4 text-emerald-400" />,
  CLIENTE_EDITADO:      <Edit className="h-4 w-4 text-blue-400" />,
  CLIENTE_ELIMINADO:    <UserMinus className="h-4 w-4 text-red-400" />,
  USUARIO_CREADO:       <UserPlus className="h-4 w-4 text-purple-400" />,
  USUARIO_ELIMINADO:    <UserMinus className="h-4 w-4 text-red-400" />,
  USUARIO_EDITADO:      <Users className="h-4 w-4 text-blue-400" />,
  SESION_INICIADA:      <LogIn className="h-4 w-4 text-amber-400" />,
  PASSWORD_CAMBIADO:    <KeyRound className="h-4 w-4 text-orange-400" />,
  PORTADA_CAMBIADA:     <Settings className="h-4 w-4 text-[#00B4C5]" />,
  ESTADO_CAMBIADO:      <FileText className="h-4 w-4 text-indigo-400" />,
}

function agruparPorFecha(entradas: Entrada[]) {
  const grupos: Record<string, Entrada[]> = {}
  for (const e of entradas) {
    const key = format(new Date(e.creadoEn), "yyyy-MM-dd")
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(e)
  }
  return grupos
}

export default function BitacoraPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/bitacora").then(r => r.json()).then(d => { setEntradas(d); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-[#737373]">Cargando...</div>

  const grupos = agruparPorFecha(entradas)
  const fechas = Object.keys(grupos).sort((a, b) => b.localeCompare(a))

  return (
    <div className="max-w-3xl space-y-6 mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#F2F2F2]">Bitácora</h1>
        <p className="text-sm text-[#737373] mt-1">Registro de actividad de los últimos 3 meses.</p>
      </div>

      {entradas.length === 0 && (
        <div className="flex items-center justify-center h-48 text-[#4A4A4A] text-sm">
          <Activity className="h-5 w-5 mr-2" /> Sin actividad registrada aún
        </div>
      )}

      {fechas.map(fecha => (
        <div key={fecha}>
          <p className="text-[11px] text-[#4A4A4A] uppercase tracking-wider font-medium mb-3">
            {format(new Date(fecha + "T12:00:00"), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
          <div className="relative border-l border-[#222222] ml-2 space-y-0">
            {grupos[fecha].map((e, i) => (
              <div key={e.id} className="relative pl-6 pb-4">
                <span className="absolute -left-[9px] top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1C1C1C] border border-[#2A2A2A]">
                  {ICONOS[e.tipo] ?? <Activity className="h-3 w-3 text-[#737373]" />}
                </span>
                <div className="rounded-xl border border-[#1E1E1E] bg-[#141414] px-4 py-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <p className="text-sm text-[#F2F2F2] leading-snug">{e.descripcion}</p>
                    <span className="text-[11px] text-[#4A4A4A] tabular-nums shrink-0">
                      {format(new Date(e.creadoEn), "h:mm a", { locale: es })}
                    </span>
                  </div>
                  {e.usuario && (
                    <p className="text-[11px] text-[#5A5A5A] mt-1">
                      por {e.usuario.nombre || e.usuario.usuario}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
