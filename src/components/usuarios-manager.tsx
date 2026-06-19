"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, KeyRound, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfirmDialog, type ConfirmState } from "@/components/ui/confirm-dialog"

interface Usuario {
  id: string
  usuario: string
  nombre: string | null
  rol: string
  mustChangePassword: boolean
  permInicio: boolean
  permClientes: boolean
  permCotizaciones: boolean
  permUsuarios: boolean
  permModificarEstados: boolean
}

const inp = "w-full h-10 rounded-lg bg-[#161616] border border-[#262626] px-3 text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A] outline-none focus:border-[#00B4C5] transition-colors"

const PERMISOS: { key: keyof Usuario; label: string }[] = [
  { key: "permInicio", label: "Inicio" },
  { key: "permCotizaciones", label: "Cotizaciones" },
  { key: "permClientes", label: "Clientes" },
  { key: "permUsuarios", label: "Usuarios" },
  { key: "permModificarEstados", label: "Mod. estados" },
]

export function UsuariosManager({ usuariosIniciales, miId }: { usuariosIniciales: Usuario[]; miId: string }) {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales)
  const [busy, setBusy] = useState<string | null>(null)
  const [showCrear, setShowCrear] = useState(false)

  // crear
  const [nUsuario, setNUsuario] = useState("")
  const [nNombre, setNNombre] = useState("")
  const [nRol, setNRol] = useState<"USER" | "ADMIN">("USER")

  // credenciales generadas a mostrar
  const [cred, setCred] = useState<{ usuario: string; password: string } | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  const refrescar = async () => {
    const r = await fetch("/api/usuarios")
    if (r.ok) setUsuarios(await r.json())
  }

  const crear = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy("crear")
    try {
      const r = await fetch("/api/usuarios", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: nUsuario, nombre: nNombre, rol: nRol }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error || "Error"); return }
      setCred({ usuario: d.usuario, password: d.tempPassword })
      setNUsuario(""); setNNombre(""); setNRol("USER"); setShowCrear(false)
      await refrescar(); router.refresh()
    } finally { setBusy(null) }
  }

  const togglePerm = async (u: Usuario, key: keyof Usuario) => {
    const nuevo = !u[key]
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, [key]: nuevo } : x))
    const r = await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: nuevo }),
    })
    if (!r.ok) { toast.error("No se pudo actualizar"); refrescar() }
  }

  const eliminar = (u: Usuario) => setConfirm({
    title: `Eliminar a ${u.nombre || u.usuario}`,
    description: "Esta acción no se puede deshacer.",
    confirmLabel: "Eliminar", danger: true,
    action: async () => {
      setBusy(u.id)
      try {
        const r = await fetch(`/api/usuarios/${u.id}`, { method: "DELETE" })
        const d = await r.json()
        if (!r.ok) { toast.error(d.error || "Error"); return }
        toast.success("Usuario eliminado")
        setUsuarios(prev => prev.filter(x => x.id !== u.id)); router.refresh()
      } finally { setBusy(null); setConfirm(null) }
    },
  })

  const resetPassword = (u: Usuario) => setConfirm({
    title: `Restablecer contraseña de ${u.usuario}`,
    description: "El sistema generará una nueva contraseña temporal que el usuario deberá cambiar al ingresar.",
    confirmLabel: "Generar",
    action: async () => {
      setBusy(u.id)
      try {
        const r = await fetch(`/api/usuarios/${u.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resetPassword: true }),
        })
        const d = await r.json()
        if (!r.ok) { toast.error(d.error || "Error"); return }
        setConfirm(null)
        setCred({ usuario: u.usuario, password: d.tempPassword })
      } finally { setBusy(null) }
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCrear(s => !s)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white text-[#0A0A0A] text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          {showCrear ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCrear ? "Cancelar" : "Nuevo usuario"}
        </button>
      </div>

      {showCrear && (
        <form onSubmit={crear} className="rounded-xl border border-[#222222] bg-[#1C1C1C] p-5 grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[#909090]">Usuario (login)</label>
            <input className={inp} value={nUsuario} onChange={e => setNUsuario(e.target.value)} placeholder="nombre.apellido o correo" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#909090]">Nombre</label>
            <input className={inp} value={nNombre} onChange={e => setNNombre(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#909090]">Rol</label>
            <div className="flex gap-2">
              {(["USER", "ADMIN"] as const).map(r => (
                <button key={r} type="button" onClick={() => setNRol(r)}
                  className={cn("flex-1 h-10 rounded-lg border text-sm font-medium transition-colors",
                    nRol === r ? "bg-[#00B4C5] border-[#00B4C5] text-white" : "bg-[#161616] border-[#262626] text-[#737373]")}>
                  {r === "USER" ? "Usuario" : "Administrador"}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-[#5A5A5A]">El sistema generará una contraseña temporal; el usuario deberá cambiarla al ingresar.</p>
            <button type="submit" disabled={busy === "crear" || !nUsuario} className="h-10 px-4 rounded-lg bg-[#00B4C5] text-white text-sm font-semibold hover:bg-[#009aaa] disabled:opacity-40 flex items-center gap-2">
              {busy === "crear" && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear usuario
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog state={confirm} loading={!!busy && busy !== "crear"} onClose={() => setConfirm(null)} />

      {cred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCred(null)}>
          <div className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#161616] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-[#F2F2F2]">Contraseña temporal generada</h3>
              <button onClick={() => setCred(null)} className="text-[#737373] hover:text-[#F2F2F2]"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-[#737373] mb-4">Entrégala al usuario. La verás solo una vez; deberá cambiarla al ingresar.</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center rounded-lg bg-[#0F0F0F] border border-[#262626] px-3 py-2">
                <span className="text-[11px] text-[#5A5A5A]">Usuario</span>
                <span className="text-sm text-[#F2F2F2] font-mono">{cred.usuario}</span>
              </div>
              <div className="flex justify-between items-center rounded-lg bg-[#0F0F0F] border border-[#262626] px-3 py-2">
                <span className="text-[11px] text-[#5A5A5A]">Contraseña</span>
                <span className="text-base text-[#00B4C5] font-mono font-semibold tracking-wide">{cred.password}</span>
              </div>
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(`Usuario: ${cred.usuario}\nContraseña: ${cred.password}`); toast.success("Credenciales copiadas") }}
              className="w-full mt-4 h-10 rounded-lg bg-white text-[#0A0A0A] text-sm font-semibold hover:bg-gray-100"
            >
              Copiar credenciales
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#222222] bg-[#1C1C1C] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#222222] text-[10px] uppercase tracking-wider text-[#4A4A4A]">
              <th className="text-left font-medium px-4 py-3">Usuario</th>
              <th className="text-left font-medium px-2 py-3">Rol</th>
              {PERMISOS.map(p => <th key={p.key} className="text-center font-medium px-2 py-3">{p.label}</th>)}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => {
              const esAdmin = u.rol === "ADMIN"
              return (
                <tr key={u.id} className="border-b border-[#1A1A1A] last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-[#F2F2F2] font-medium">{u.nombre || u.usuario}</div>
                    <div className="text-[11px] text-[#5A5A5A]">{u.usuario}{u.id === miId ? " · tú" : ""}</div>
                  </td>
                  <td className="px-2 py-3">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-md", esAdmin ? "bg-[#00B4C5]/10 text-[#00B4C5]" : "bg-[#222] text-[#909090]")}>
                      {esAdmin ? "Admin" : "Usuario"}
                    </span>
                  </td>
                  {PERMISOS.map(p => (
                    <td key={p.key} className="px-2 py-3 text-center">
                      <button
                        type="button"
                        disabled={esAdmin}
                        onClick={() => togglePerm(u, p.key)}
                        title={esAdmin ? "El admin tiene todos los permisos" : "Activar/desactivar"}
                        className={cn("h-5 w-9 rounded-full relative transition-colors disabled:opacity-50",
                          (esAdmin || u[p.key]) ? "bg-[#00B4C5]" : "bg-[#2E2E2E]")}>
                        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                          (esAdmin || u[p.key]) ? "left-[18px]" : "left-0.5")} />
                      </button>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => resetPassword(u)} disabled={busy === u.id} title="Restablecer contraseña"
                        className="h-7 w-7 grid place-items-center rounded-lg text-[#4A4A4A] hover:text-[#00B4C5] hover:bg-[#2A2A2A]">
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      {u.id !== miId && (
                        <button onClick={() => eliminar(u)} disabled={busy === u.id} title="Eliminar"
                          className="h-7 w-7 grid place-items-center rounded-lg text-[#4A4A4A] hover:text-red-400 hover:bg-[#2A2A2A]">
                          {busy === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
