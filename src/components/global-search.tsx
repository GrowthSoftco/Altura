"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Search, LayoutDashboard, FileText, Users, Shield, BookOpen, Settings, FilePlus, CornerDownLeft, Loader2,
} from "lucide-react"

interface Perms { inicio: boolean; cotizaciones: boolean; clientes: boolean; usuarios: boolean }
interface ClienteRes { id: string; nombre: string; telefono: string }
interface CotRes { id: string; codigo: string; origen: string; destino: string; cliente: { nombre: string } }

type Item = { id: string; label: string; sub?: string; href: string; icon: typeof Search; group: string }

export function GlobalSearch({ rol, perms }: { rol: string; perms: Perms }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [remote, setRemote] = useState<{ clientes: ClienteRes[]; cotizaciones: CotRes[] }>({ clientes: [], cotizaciones: [] })
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Módulos (filtrados por permisos), búsqueda local
  const modulos = useMemo<Item[]>(() => [
    { id: "m-inicio",  label: "Inicio",       href: "/dashboard",    icon: LayoutDashboard, group: "Módulos", show: perms.inicio },
    { id: "m-cot",     label: "Cotizaciones", href: "/cotizaciones", icon: FileText,        group: "Módulos", show: perms.cotizaciones },
    { id: "m-nueva",   label: "Nueva cotización", href: "/cotizaciones/nueva", icon: FilePlus, group: "Módulos", show: perms.cotizaciones },
    { id: "m-cli",     label: "Clientes",     href: "/clientes",     icon: Users,           group: "Módulos", show: perms.clientes },
    { id: "m-usr",     label: "Usuarios",     href: "/usuarios",     icon: Shield,          group: "Módulos", show: rol === "ADMIN" || perms.usuarios },
    { id: "m-bit",     label: "Bitácora",     href: "/bitacora",     icon: BookOpen,        group: "Módulos", show: rol === "ADMIN" },
    { id: "m-perfil",  label: "Configuración", href: "/perfil",      icon: Settings,        group: "Módulos", show: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].filter((m: any) => m.show).map(({ ...m }) => m as Item), [perms, rol])

  // Atajo Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); inputRef.current?.focus(); setOpen(true)
      }
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  // Búsqueda remota (debounce)
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setRemote({ clientes: [], cotizaciones: [] }); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/buscar?q=${encodeURIComponent(term)}`)
        if (r.ok) setRemote(await r.json())
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }, 220)
    return () => clearTimeout(t)
  }, [q])

  const term = q.trim().toLowerCase()
  const modulosFiltrados = term
    ? modulos.filter(m => m.label.toLowerCase().includes(term))
    : modulos

  const items: Item[] = [
    ...modulosFiltrados,
    ...remote.cotizaciones.map(c => ({
      id: `c-${c.id}`, label: c.codigo, sub: `${c.cliente?.nombre ?? ""} · ${c.origen} → ${c.destino}`,
      href: `/cotizaciones/${c.id}`, icon: FileText, group: "Cotizaciones",
    })),
    ...remote.clientes.map(c => ({
      id: `p-${c.id}`, label: c.nombre, sub: c.telefono,
      href: `/clientes/${c.id}`, icon: Users, group: "Clientes",
    })),
  ]

  useEffect(() => { setActive(0) }, [q, remote])

  const go = (it: Item) => { setOpen(false); setQ(""); router.push(it.href) }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]) }
  }

  // Agrupar para render manteniendo orden de grupos
  const grupos = ["Módulos", "Cotizaciones", "Clientes"]
  let idx = -1

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A4A4A] pointer-events-none" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar clientes, cotizaciones, módulos..."
          className="w-full h-9 rounded-full bg-[#1A1A1A] border border-[#262626] pl-9 pr-12 text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A] outline-none focus:border-[#00B4C5]/50 transition-colors"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-[#4A4A4A] border border-[#2A2A2A] rounded px-1.5 py-0.5 pointer-events-none">
          ⌘K
        </kbd>
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-[#262626] bg-[#1A1A1A] shadow-xl shadow-black/40 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-[#737373]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-[#5A5A5A]">
              {q.trim().length < 2 ? "Escribe para buscar clientes y cotizaciones" : "Sin resultados"}
            </div>
          )}

          {grupos.map(grupo => {
            const delGrupo = items.filter(i => i.group === grupo)
            if (delGrupo.length === 0) return null
            return (
              <div key={grupo} className="py-1.5">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#4A4A4A]">{grupo}</p>
                {delGrupo.map(it => {
                  idx++
                  const isActive = idx === active
                  const curIdx = idx
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onMouseEnter={() => setActive(curIdx)}
                      onClick={() => go(it)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isActive ? "bg-[#242424]" : "hover:bg-[#202020]"}`}
                    >
                      <it.icon className="h-4 w-4 shrink-0 text-[#737373]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#F2F2F2] truncate">{it.label}</p>
                        {it.sub && <p className="text-[11px] text-[#5A5A5A] truncate">{it.sub}</p>}
                      </div>
                      {isActive && <CornerDownLeft className="h-3.5 w-3.5 text-[#4A4A4A] shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
