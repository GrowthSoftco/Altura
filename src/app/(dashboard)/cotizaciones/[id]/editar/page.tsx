export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { CotizacionForm } from "@/components/cotizaciones/cotizacion-form"
import { serializeCotizacion } from "@/lib/serialize"
import { getCurrentUser, puedeAccederCotizacion } from "@/lib/auth"

export default async function EditarCotizacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const me = await getCurrentUser()
  if (!me) redirect("/login")
  const { id } = await params
  const { from } = await searchParams
  const backTo = from || `/cotizaciones/${id}`

  const cot = await prisma.cotizacion.findUnique({
    where: { id },
    include: { cliente: true },
  })

  if (!cot) notFound()
  if (!puedeAccederCotizacion(me, cot)) redirect("/cotizaciones")

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/cotizaciones/${id}?from=${encodeURIComponent(backTo)}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-[#737373] hover:text-[#F2F2F2]")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">
            Editar Cotización
          </h1>
          <p className="text-sm text-[#737373] mt-0.5 font-mono">{cot.codigo}</p>
        </div>
      </div>

      <div className="h-px bg-[#1E1E1E]" />

      <CotizacionForm cotizacion={serializeCotizacion(cot)} backTo={backTo} />
    </div>
  )
}
