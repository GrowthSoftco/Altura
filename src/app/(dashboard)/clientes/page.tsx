"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, UserPlus, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClienteForm } from "@/components/clientes/cliente-form"

interface Cliente {
  id: string
  nombre: string
  telefono: string
  correo: string | null
  createdAt: string
  _count?: { cotizaciones: number }
}

export default function ClientesPage() {
  const [clientes, setClientes]   = useState<Cliente[]>([])
  const [query, setQuery]         = useState("")
  const [loading, setLoading]     = useState(true)

  const fetchClientes = async (q = "") => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      const data = await res.json()
      setClientes(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchClientes() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchClientes(query), 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">Clientes</h1>
          <p className="text-sm text-[#737373] mt-0.5">{clientes.length} cliente(s)</p>
        </div>
        <ClienteForm
          trigger={
            <Button className="bg-[#4F6EF7] hover:bg-[#6B85F9] text-white font-semibold text-sm h-9 px-4 rounded-lg shadow-md shadow-[#4F6EF7]/10">
              <UserPlus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          }
          onSuccess={() => fetchClientes(query)}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
        <Input
          className="pl-9 bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#4F6EF7] h-9"
          placeholder="Buscar por nombre o teléfono..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#222222] overflow-hidden bg-[#1C1C1C]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#222222]">
              <th className="text-left text-[10px] text-[#4A4A4A] uppercase tracking-wider font-medium px-4 py-3">Cliente</th>
              <th className="text-left text-[10px] text-[#4A4A4A] uppercase tracking-wider font-medium px-4 py-3">Teléfono</th>
              <th className="text-left text-[10px] text-[#4A4A4A] uppercase tracking-wider font-medium px-4 py-3">Correo</th>
              <th className="text-left text-[10px] text-[#4A4A4A] uppercase tracking-wider font-medium px-4 py-3">Registro</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="text-center text-[#737373] py-10 text-sm">Cargando...</td></tr>
            )}
            {!loading && clientes.length === 0 && (
              <tr><td colSpan={4} className="text-center text-[#4A4A4A] py-10 text-sm">
                {query ? `Sin resultados para "${query}"` : "No hay clientes aún"}
              </td></tr>
            )}
            {clientes.map(c => (
              <tr key={c.id} className="border-t border-[#1E1E1E] hover:bg-[#202020] transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/clientes/${c.id}`} className="flex items-center gap-3 group">
                    <div className="h-8 w-8 rounded-full bg-[#1E2A4A] flex items-center justify-center text-[#4F6EF7] font-bold text-sm shrink-0">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-[#F2F2F2] text-sm group-hover:text-[#4F6EF7] transition-colors">{c.nombre}</span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-sm text-[#737373]">
                    <Phone className="h-3 w-3 shrink-0" /> {c.telefono}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.correo ? (
                    <span className="flex items-center gap-1.5 text-sm text-[#737373] truncate max-w-[200px]">
                      <Mail className="h-3 w-3 shrink-0" /> {c.correo}
                    </span>
                  ) : <span className="text-[#383838] text-sm">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-[#737373] tabular-nums">
                  {format(new Date(c.createdAt), "dd MMM yyyy", { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
