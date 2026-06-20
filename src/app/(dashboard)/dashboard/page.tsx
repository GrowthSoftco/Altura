export const dynamic = "force-dynamic"

import { FileText, Users, CheckCircle, TrendingUp } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { MetricCard } from "@/components/dashboard/metric-card"
import { RecientesTable } from "@/components/dashboard/recientes-table"
import { serializeCotizaciones } from "@/lib/serialize"
import { getCurrentUser, filtroCotizaciones } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCOP } from "@/lib/utils"

async function getDashboardData(scope: object) {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [cotizacionesMes, totalClientes, aprobadas, valorAggregate, recientes, cotsSerie, clientesSerie] =
    await Promise.all([
      prisma.cotizacion.count({ where: { ...scope, createdAt: { gte: start } } }),
      prisma.cliente.count(),
      prisma.cotizacion.count({ where: { ...scope, estado: "APROBADA" } }),
      prisma.cotizacion.aggregate({ where: scope, _sum: { valorConPorcentaje: true } }),
      prisma.cotizacion.findMany({
        where: scope,
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { cliente: true, creadoPor: { select: { nombre: true, usuario: true } } },
      }),
      prisma.cotizacion.findMany({
        where: { ...scope, createdAt: { gte: sixAgo } },
        select: { createdAt: true, estado: true, valorConPorcentaje: true },
      }),
      prisma.cliente.findMany({ where: { createdAt: { gte: sixAgo } }, select: { createdAt: true } }),
    ])

  // Buckets de los últimos 6 meses (índice 0 = más antiguo, 5 = mes actual)
  const idxDe = (d: Date) => (d.getFullYear() - sixAgo.getFullYear()) * 12 + (d.getMonth() - sixAgo.getMonth())
  const cotsMes      = Array(6).fill(0)
  const aprobadasMes = Array(6).fill(0)
  const valorMes     = Array(6).fill(0)
  const clientesMes  = Array(6).fill(0)
  for (const c of cotsSerie) {
    const i = idxDe(new Date(c.createdAt)); if (i < 0 || i > 5) continue
    cotsMes[i] += 1
    if (c.estado === "APROBADA") aprobadasMes[i] += 1
    valorMes[i] += Number(c.valorConPorcentaje ?? 0)
  }
  for (const c of clientesSerie) {
    const i = idxDe(new Date(c.createdAt)); if (i < 0 || i > 5) continue
    clientesMes[i] += 1
  }

  return {
    cotizacionesMes,
    totalClientes,
    aprobadas,
    valorTotal: Number(valorAggregate._sum.valorConPorcentaje ?? 0),
    recientes,
    series: { cotsMes, aprobadasMes, valorMes, clientesMes },
  }
}

export default async function DashboardPage() {
  const me = await getCurrentUser()
  if (!me) redirect("/login")

  const { cotizacionesMes, totalClientes, aprobadas, valorTotal, recientes, series } =
    await getDashboardData(filtroCotizaciones(me))

  const metrics = [
    {
      label:      "Cotizaciones este mes",
      value:      cotizacionesMes,
      icon:       FileText,
      color:      "text-[#00B4C5]",
      iconBg:     "bg-[#00B4C5]/10",
      data:       series.cotsMes,
      chartColor: "#00B4C5",
    },
    {
      label:      "Clientes registrados",
      value:      totalClientes,
      icon:       Users,
      color:      "text-blue-400",
      iconBg:     "bg-blue-500/10",
      data:       series.clientesMes,
      chartColor: "#60A5FA",
    },
    {
      label:      "Cotizaciones aprobadas",
      value:      aprobadas,
      icon:       CheckCircle,
      color:      "text-emerald-400",
      iconBg:     "bg-emerald-500/10",
      data:       series.aprobadasMes,
      chartColor: "#34D399",
    },
    {
      label:      "Valor total cotizado",
      value:      formatCOP(valorTotal),
      icon:       TrendingUp,
      color:      "text-violet-400",
      iconBg:     "bg-violet-500/10",
      data:       series.valorMes,
      chartColor: "#A78BFA",
    },
  ]

  return (
    <div className="space-y-7 max-w-7xl mx-auto">

      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">
            Panel de Control
          </h1>
          <p className="text-sm text-[#737373] mt-0.5">
            Resumen de actividad · Altura Agencia de Viajes
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Recent table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#F2F2F2]">Últimas Cotizaciones</h2>
          <span className="text-xs text-[#4A4A4A]">
            {recientes.length} registros
          </span>
        </div>
        <RecientesTable cotizaciones={serializeCotizaciones(recientes)} mostrarCreador={me.rol === "ADMIN"} isAdmin={me.rol === "ADMIN"} />
      </div>

    </div>
  )
}
