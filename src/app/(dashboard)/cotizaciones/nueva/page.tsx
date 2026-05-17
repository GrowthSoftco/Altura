import { CotizacionForm } from "@/components/cotizaciones/cotizacion-form"

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>
}) {
  const { clienteId } = await searchParams

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">
          Nueva Cotización
        </h1>
        <p className="text-sm text-[#737373] mt-0.5">
          Completa los datos del cliente, viaje y servicios incluidos
        </p>
      </div>

      <div className="h-px bg-[#1E1E1E]" />

      <CotizacionForm initialClienteId={clienteId} />
    </div>
  )
}
