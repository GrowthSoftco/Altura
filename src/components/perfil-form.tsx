"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

const inp = "w-full h-10 rounded-lg bg-[#161616] border border-[#262626] px-3 text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A] outline-none focus:border-[#00B4C5] transition-colors"

export function PerfilForm({ debeCambiar, isAdmin = false }: { debeCambiar: boolean; isAdmin?: boolean }) {
  const router = useRouter()
  const [actual, setActual] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingPortada, setUploadingPortada] = useState(false)

  const subirPortada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Solo se aceptan imágenes"); return }
    setUploadingPortada(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string
        const res = await fetch("/api/configuracion/portada", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        })
        if (!res.ok) { toast.error("Error al subir imagen"); return }
        toast.success("Imagen de portada actualizada")
        setUploadingPortada(false)
      }
      reader.readAsDataURL(file)
    } catch { toast.error("Error al subir imagen"); setUploadingPortada(false) }
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
          <h3 className="text-sm font-semibold text-[#F2F2F2] mb-1">Imagen de portada del login</h3>
          <p className="text-[13px] text-[#737373] mb-3">Sube una imagen que se mostrará en la pantalla de inicio de sesión.</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={subirPortada} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingPortada}
            className="h-10 px-4 rounded-lg border border-[#262626] bg-[#161616] text-sm text-[#F2F2F2] hover:border-[#00B4C5]/40 disabled:opacity-40 flex items-center gap-2 transition-colors">
            {uploadingPortada ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingPortada ? "Subiendo..." : "Seleccionar imagen"}
          </button>
        </div>
      )}
    </div>
  )
}
