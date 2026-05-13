export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ClienteForm } from "@/components/clientes/cliente-form"
import { UserPlus, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    include: { _count: { select: { cotizaciones: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">
            Clientes
          </h1>
          <p className="text-sm text-[#737373] mt-0.5">
            {clientes.length} cliente(s) registrado(s)
          </p>
        </div>
        <ClienteForm
          trigger={
            <Button className="bg-[#4F6EF7] hover:bg-[#6B85F9] text-white font-semibold text-sm h-9 px-4 rounded-lg shadow-md shadow-[#4F6EF7]/10">
              <UserPlus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {clientes.map((c) => (
          <Link
            key={c.id}
            href={`/clientes/${c.id}`}
            className="group rounded-xl border border-[#222222] bg-[#1C1C1C] p-4 hover:border-[#2E2E2E] hover:bg-[#202020] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-8 w-8 rounded-full bg-[#1E2A4A] flex items-center justify-center text-[#4F6EF7] font-bold text-sm shrink-0">
                {c.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] text-[#4A4A4A] tabular-nums">
                {c._count.cotizaciones} cotización{c._count.cotizaciones !== 1 ? "es" : ""}
              </span>
            </div>
            <p className="font-medium text-[#F2F2F2] text-sm leading-snug">{c.nombre}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#737373]">
                <Phone className="h-3 w-3 shrink-0" />
                {c.telefono}
              </div>
              {c.correo && (
                <div className="flex items-center gap-2 text-xs text-[#737373]">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{c.correo}</span>
                </div>
              )}
            </div>
            <p className="mt-3 text-[10px] text-[#3A3A3A]">
              Desde {format(new Date(c.createdAt), "MMM yyyy", { locale: es })}
            </p>
          </Link>
        ))}
        {clientes.length === 0 && (
          <p className="col-span-3 text-center text-[#4A4A4A] text-sm py-16">
            No hay clientes registrados aún
          </p>
        )}
      </div>
    </div>
  )
}
