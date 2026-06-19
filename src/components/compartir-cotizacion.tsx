"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Share2, Loader2, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsuarioMini { id: string; usuario: string; nombre: string | null }

export function CompartirCotizacion({ id }: { id: string }) {
  const [esAdmin, setEsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [usuarios, setUsuarios] = useState<UsuarioMini[]>([])
  const [sel, setSel] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => setEsAdmin(d?.rol === "ADMIN")).catch(() => {})
  }, [])

  const abrir = async () => {
    setOpen(true); setLoading(true)
    try {
      const r = await fetch(`/api/cotizaciones/${id}/compartir`)
      if (!r.ok) { toast.error("No se pudo cargar"); setOpen(false); return }
      const d = await r.json()
      setUsuarios(d.usuarios)
      setSel(new Set(d.compartidoCon))
    } finally { setLoading(false) }
  }

  const toggle = (uid: string) => {
    setSel(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n })
  }

  const guardar = async () => {
    setSaving(true)
    try {
      const r = await fetch(`/api/cotizaciones/${id}/compartir`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioIds: [...sel] }),
      })
      if (!r.ok) { toast.error("Error al guardar"); return }
      toast.success("Acceso actualizado")
      setOpen(false)
    } finally { setSaving(false) }
  }

  if (!esAdmin) return null

  return (
    <>
      <button
        onClick={abrir}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#262626] bg-[#1C1C1C] text-[#737373] hover:text-[#F2F2F2] hover:bg-[#242424] text-sm transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" /> Compartir
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#F2F2F2]">Compartir cotización</h3>
              <button onClick={() => setOpen(false)} className="text-[#737373] hover:text-[#F2F2F2]"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-[#737373] mb-3">Selecciona a qué usuarios darles acceso a esta cotización.</p>

            {loading ? (
              <div className="py-8 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#737373]" /></div>
            ) : usuarios.length === 0 ? (
              <p className="text-sm text-[#5A5A5A] py-6 text-center">No hay usuarios para compartir.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {usuarios.map(u => {
                  const on = sel.has(u.id)
                  return (
                    <button key={u.id} onClick={() => toggle(u.id)}
                      className={cn("w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                        on ? "bg-[#00B4C5]/10 text-[#F2F2F2]" : "hover:bg-[#1E1E1E] text-[#C0C0C0]")}>
                      <div className="text-left">
                        <div className="font-medium">{u.nombre || u.usuario}</div>
                        <div className="text-[11px] text-[#5A5A5A]">{u.usuario}</div>
                      </div>
                      <span className={cn("h-5 w-5 rounded-md grid place-items-center border",
                        on ? "bg-[#00B4C5] border-[#00B4C5]" : "border-[#3A3A3A]")}>
                        {on && <Check className="h-3 w-3 text-white" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="h-9 px-4 rounded-lg text-sm text-[#737373] hover:text-[#F2F2F2]">Cancelar</button>
              <button onClick={guardar} disabled={saving} className="h-9 px-4 rounded-lg bg-white text-[#0A0A0A] text-sm font-semibold hover:bg-gray-100 disabled:opacity-40 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
