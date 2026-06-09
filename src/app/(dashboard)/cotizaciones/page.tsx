export const dynamic = "force-dynamic"

import Link from "next/link"
import { FilePlus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RecientesTable } from "@/components/dashboard/recientes-table"
import { serializeCotizaciones } from "@/lib/serialize"
import { EstadoCotizacion } from "@/types"

const ESTADOS: { label: string; value: EstadoCotizacion | "ALL" }[] = [
  { label: "Todas",       value: "ALL"         },
  { label: "Cotizadas",   value: "COTIZADA"    },
  { label: "Negociación", value: "NEGOCIACION" },
  { label: "Aprobadas",   value: "APROBADA"    },
  { label: "Pagando",     value: "PAGANDO"     },
  { label: "Completadas", value: "COMPLETADA"  },
  { label: "Canceladas",  value: "CANCELADA"   },
]

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  const estadoFilter = estado && estado !== "ALL" ? estado : undefined

  const cotizaciones = await prisma.cotizacion.findMany({
    where: estadoFilter ? { estado: estadoFilter as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: { cliente: true },
  })

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">
            Cotizaciones
          </h1>
          <p className="text-sm text-[#737373] mt-0.5">
            {cotizaciones.length} cotización(es) encontrada(s)
          </p>
        </div>
        <Link
          href="/cotizaciones/nueva"
          className={cn(
            buttonVariants(),
            "bg-white hover:bg-gray-100 text-[#272F46] font-semibold text-sm h-9 px-4 rounded-lg shadow-md shadow-[#272F46]/10"
          )}
        >
          <FilePlus className="mr-2 h-4 w-4" /> Nueva Cotización
        </Link>
      </div>

      {/* Estado filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {ESTADOS.map((e) => {
          const active = (estado ?? "ALL") === e.value
          return (
            <Link
              key={e.value}
              href={`/cotizaciones?estado=${e.value}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border",
                active
                  ? "bg-[#1E1E1E] text-[#F2F2F2] border-[#2E2E2E]"
                  : "bg-transparent text-[#737373] border-[#222222] hover:border-[#2E2E2E] hover:text-[#C0C0C0]"
              )}
            >
              {e.label}
            </Link>
          )
        })}
      </div>

      <RecientesTable cotizaciones={serializeCotizaciones(cotizaciones)} />
    </div>
  )
}
