"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const inp = "w-full h-10 rounded-lg bg-[#161616] border border-[#262626] px-3 text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A] outline-none focus:border-[#00B4C5] transition-colors"

export function PerfilForm({ debeCambiar, isAdmin = false }: { debeCambiar: boolean; isAdmin?: boolean }) {
  const router = useRouter()
  const [actual, setActual] = useState("")
  const [portadaUrl, setPortadaUrl] = useState("")
  const [savingPortada, setSavingPortada] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    fetch("/api/configuracion/portada").then(r => r.json()).then(d => { if (d.url) setPortadaUrl(d.url) })
  }, [isAdmin])

  const guardarPortada = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!portadaUrl.startsWith("http")) { toast.error("Ingresa una URL válida"); return }
    setSavingPortada(true)
    try {
      const res = await fetch("/api/configuracion/portada", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: portadaUrl }),
      })
      if (!res.ok) { toast.error("Error al guardar"); return }
      toast.success("Portada actualizada")
    } catch { toast.error("Error de conexión") }
    finally { setSavingPortada(false) }
  }
  const [nueva, setNueva] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nueva !== confirmar) { toast.error("Las contraseñas no coinciden"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nueva }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error"); return }
      toast.success("Contraseña actualizada")
      setActual(""); setNueva(""); setConfirmar("")
      if (debeCambiar) {
        // Era un cambio obligatorio: ya puede entrar, lo llevamos al Inicio
        router.replace("/")
        router.refresh()
      } else {
        router.refresh()
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#222222] bg-[#1C1C1C] p-5">
      <h2 className="text-sm font-semibold text-[#F2F2F2] mb-1">Cambiar contraseña</h2>
      {debeCambiar && (
        <p className="text-[13px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
          Estás usando una contraseña temporal. Por seguridad, créala nueva ahora.
        </p>
      )}
      <form onSubmit={submit} className="space-y-3 mt-3">
        <div className="space-y-1">
          <label className="text-xs text-[#909090]">Contraseña actual</label>
          <input type="password" className={inp} value={actual} onChange={e => setActual(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#909090]">Nueva contraseña</label>
          <input type="password" className={inp} value={nueva} onChange={e => setNueva(e.target.value)} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#909090]">Confirmar nueva contraseña</label>
          <input type="password" className={inp} value={confirmar} onChange={e => setConfirmar(e.target.value)} autoComplete="new-password" />
        </div>
        <button
          type="submit"
          disabled={loading || !actual || !nueva || !confirmar}
          className="h-10 px-4 rounded-lg bg-white text-[#0A0A0A] font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 transition-all flex items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Actualizar contraseña
        </button>
      </form>

      {isAdmin && (
        <div className="mt-5 pt-5 border-t border-[#222222]">
          <h3 className="text-sm font-semibold text-[#F2F2F2] mb-1">Imagen de fondo — pantalla de login</h3>
          <form onSubmit={guardarPortada} className="flex gap-2 mt-2">
            <input className={inp} value={portadaUrl} onChange={e => setPortadaUrl(e.target.value)} placeholder="https://..." />
            <button type="submit" disabled={savingPortada || !portadaUrl}
              className="h-10 px-4 rounded-lg bg-white text-[#0A0A0A] text-sm font-semibold hover:bg-gray-100 disabled:opacity-40 flex items-center gap-2 shrink-0">
              {savingPortada && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
