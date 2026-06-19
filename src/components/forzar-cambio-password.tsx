"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ShieldAlert } from "lucide-react"

const inp = "w-full h-10 rounded-lg bg-[#161616] border border-[#262626] px-3 text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A] outline-none focus:border-[#00B4C5] transition-colors"

/**
 * Modal bloqueante: si el usuario tiene contraseña temporal, no puede
 * hacer nada hasta crear una nueva. Cubre toda la pantalla y no se puede cerrar.
 */
export function ForzarCambioPassword({ activo }: { activo: boolean }) {
  const router = useRouter()
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, setLoading] = useState(false)

  if (!activo) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nueva.length < 6) { toast.error("La nueva contraseña debe tener al menos 6 caracteres"); return }
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
      router.replace("/")
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A]/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-2xl">
        <div className="h-11 w-11 rounded-full bg-amber-500/10 grid place-items-center mb-4">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold text-[#F2F2F2]">Crea tu contraseña</h2>
        <p className="text-[13px] text-[#909090] mt-1.5 leading-relaxed">
          Estás usando una contraseña temporal. Por seguridad debes crear tu propia contraseña antes de continuar.
        </p>

        <form onSubmit={submit} className="space-y-3 mt-5">
          <div className="space-y-1">
            <label className="text-xs text-[#909090]">Contraseña temporal actual</label>
            <input type="password" className={inp} value={actual} onChange={e => setActual(e.target.value)} autoComplete="current-password" autoFocus />
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
            className="w-full h-11 rounded-lg bg-white text-[#0A0A0A] font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar y continuar
          </button>
        </form>
      </div>
    </div>
  )
}
