"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ImageIcon, Lock, Monitor, ShieldCheck } from "lucide-react"

const inp = "w-full h-10 rounded-lg bg-[#141414] border border-[#2A2A2A] px-3 text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A] outline-none focus:border-[#00B4C5] transition-colors"
const card = "rounded-2xl border border-[#222222] bg-[#171717] overflow-hidden"
const btnWhite = "h-10 px-4 rounded-lg bg-white text-[#0A0A0A] font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shrink-0"

function CardHead({ icon: Icon, title, subtitle }: { icon: typeof Lock; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-4 border-b border-[#1F1F1F] bg-gradient-to-b from-[#1C1C1C] to-[#171717]">
      <div className="h-10 w-10 rounded-xl bg-[#00B4C5]/10 ring-1 ring-[#00B4C5]/20 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-[#00B4C5]" />
      </div>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-[#F2F2F2] leading-tight tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-[#5E5E5E] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

export function PerfilForm({
  debeCambiar, isAdmin = false, usuario, nombre, rol, fotoUrl: fotoInicial,
}: { debeCambiar: boolean; isAdmin?: boolean; usuario: string; nombre: string; rol: string; fotoUrl: string | null }) {
  const router = useRouter()
  const inicial = (nombre || usuario || "?").trim().charAt(0).toUpperCase()

  // Foto de perfil
  const [fotoUrl, setFotoUrl] = useState(fotoInicial || "")
  const [fotoError, setFotoError] = useState(false)
  const [savingFoto, setSavingFoto] = useState(false)

  // Portada (admin)
  const [portadaUrl, setPortadaUrl] = useState("")
  const [savingPortada, setSavingPortada] = useState(false)

  // Contraseña
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { setFotoError(false) }, [fotoUrl])

  useEffect(() => {
    if (!isAdmin) return
    fetch("/api/configuracion/portada").then(r => r.json()).then(d => { if (d.url) setPortadaUrl(d.url) })
  }, [isAdmin])

  const mostrarFoto = fotoUrl.startsWith("http") && !fotoError

  const guardarFoto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (fotoUrl && !fotoUrl.startsWith("http")) { toast.error("Ingresa una URL válida"); return }
    setSavingFoto(true)
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fotoUrl }),
      })
      if (!res.ok) { toast.error("Error al guardar la foto"); return }
      toast.success("Foto de perfil actualizada")
      router.refresh()
    } catch { toast.error("Error de conexión") }
    finally { setSavingFoto(false) }
  }

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nueva !== confirmar) { toast.error("Las contraseñas no coinciden"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nueva }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error"); return }
      toast.success("Contraseña actualizada")
      setActual(""); setNueva(""); setConfirmar("")
      if (debeCambiar) { router.replace("/"); router.refresh() }
      else router.refresh()
    } catch { toast.error("Error de conexión") }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">

      {/* ── HERO: avatar + identidad ── */}
      <div className={card}>
        <div className="h-24 bg-gradient-to-r from-[#1A2035] via-[#15323a] to-[#0e2a30]" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl ring-4 ring-[#171717] overflow-hidden shrink-0 bg-[#1A2035] flex items-center justify-center">
              {mostrarFoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrl} alt={nombre} className="h-full w-full object-cover" onError={() => setFotoError(true)} />
              ) : (
                <span className="text-[#00B4C5] font-bold text-3xl">{inicial}</span>
              )}
            </div>
            <div className="pb-1 min-w-0">
              <h2 className="text-xl font-semibold text-[#F2F2F2] tracking-tight truncate">{nombre || usuario}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00B4C5] bg-[#00B4C5]/10 ring-1 ring-[#00B4C5]/20 rounded-full px-2 py-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  {rol === "ADMIN" ? "Administrador" : "Usuario"}
                </span>
                <span className="text-xs text-[#5E5E5E] truncate">{usuario}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOTO DE PERFIL ── */}
      <div className={card}>
        <CardHead icon={ImageIcon} title="Foto de perfil" subtitle="Pega el link de una imagen para tu avatar" />
        <div className="p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full overflow-hidden shrink-0 bg-[#1A2035] flex items-center justify-center ring-1 ring-[#2A2A2A]">
            {mostrarFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="" className="h-full w-full object-cover" onError={() => setFotoError(true)} />
            ) : (
              <span className="text-[#00B4C5] font-bold text-xl">{inicial}</span>
            )}
          </div>
          <form onSubmit={guardarFoto} className="flex-1 flex gap-2">
            <input className={inp} value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} placeholder="https://...  (imagen .jpg / .png)" />
            <button type="submit" disabled={savingFoto} className={btnWhite}>
              {savingFoto && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </form>
        </div>
        {fotoUrl && fotoError && (
          <p className="px-5 pb-4 -mt-2 text-xs text-amber-400">No se pudo cargar esa imagen. Usa el link directo del archivo (que termine en .jpg, .png, etc.).</p>
        )}
      </div>

      {/* ── CONTRASEÑA ── */}
      <div className={card}>
        <CardHead icon={Lock} title="Cambiar contraseña" subtitle="Mantén tu cuenta segura" />
        <div className="p-5">
          {debeCambiar && (
            <p className="text-[13px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
              Estás usando una contraseña temporal. Por seguridad, créala nueva ahora.
            </p>
          )}
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-[#909090]">Contraseña actual</label>
              <input type="password" className={inp} value={actual} onChange={e => setActual(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-[#909090]">Nueva contraseña</label>
                <input type="password" className={inp} value={nueva} onChange={e => setNueva(e.target.value)} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#909090]">Confirmar nueva contraseña</label>
                <input type="password" className={inp} value={confirmar} onChange={e => setConfirmar(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" disabled={loading || !actual || !nueva || !confirmar} className={btnWhite}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Actualizar contraseña
            </button>
          </form>
        </div>
      </div>

      {/* ── PORTADA LOGIN (admin) ── */}
      {isAdmin && (
        <div className={card}>
          <CardHead icon={Monitor} title="Imagen de fondo del login" subtitle="Se muestra en la pantalla de inicio de sesión" />
          <div className="p-5">
            <form onSubmit={guardarPortada} className="flex gap-2">
              <input className={inp} value={portadaUrl} onChange={e => setPortadaUrl(e.target.value)} placeholder="https://..." />
              <button type="submit" disabled={savingPortada || !portadaUrl} className={btnWhite}>
                {savingPortada && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
