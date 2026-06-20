"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Loader2, ArrowRight } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get("from") || "/"

  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/configuracion/portada").then(r => r.json()).then(d => setPortadaUrl(d.url || null))
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión")
        return
      }
      router.replace(from)
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-[#0A0A0A]">
      {/* Columna izquierda — formulario */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            <Image src="/alturalogo.svg" alt="Altura" width={36} height={36} className="opacity-90" />
            <div className="leading-tight">
              <p className="text-[#F2F2F2] font-semibold tracking-wide text-sm">ALTURA</p>
              <p className="text-[#4A4A4A] text-[10px] tracking-[0.2em]">AGENCIA DE VIAJES</p>
            </div>
          </div>

          <h1 className="text-3xl font-semibold text-[#F2F2F2] tracking-tight">Iniciar sesión</h1>
          <p className="text-[#737373] text-sm mt-2 mb-8">
            Ingresa tus credenciales para acceder al panel.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#909090] font-medium">Usuario</label>
              <input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoFocus
                autoComplete="username"
                placeholder="tu.usuario"
                className="w-full h-11 rounded-lg bg-[#161616] border border-[#262626] px-3.5 text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A] outline-none focus:border-[#00B4C5] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#909090] font-medium">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-11 rounded-lg bg-[#161616] border border-[#262626] px-3.5 text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A] outline-none focus:border-[#00B4C5] transition-colors"
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !usuario || !password}
              className="group w-full h-11 rounded-lg bg-[#F2F2F2] text-[#0A0A0A] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-[#3A3A3A] text-xs mt-10">
            Altura Agencia de Viajes · Acceso restringido
          </p>
        </div>
      </div>

      {/* Columna derecha — imagen */}
      <div className="hidden lg:block relative overflow-hidden">
        {portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portadaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setPortadaUrl(null)} />
        ) : (
          <Image src="/nubes.jpg" alt="" fill priority className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <p className="text-white/90 text-2xl font-light leading-snug max-w-md">
            Ven y viaja con Altura
          </p>
          <p className="text-white/50 text-sm mt-2">Tu próximo destino empieza aquí.</p>
        </div>
      </div>
    </div>
  )
}
