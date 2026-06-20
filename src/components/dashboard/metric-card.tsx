import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  iconBg: string
  /** Serie de datos para el mini-gráfico (de más antiguo a más reciente). */
  data?: number[]
  /** Color hex del gráfico, ej "#00B4C5". */
  chartColor?: string
}

/** Sparkline SVG suave (área + línea). Server-safe, sin librerías. */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 240
  const H = 48
  const pad = 4
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = (W - pad * 2) / Math.max(data.length - 1, 1)
  const pts = data.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (H - pad * 2) * (1 - (v - min) / range)
    return [x, y] as const
  })

  // Línea suavizada con curvas cúbicas
  const line = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [px, py] = pts[i - 1]
    const cx = (px + x) / 2
    return `${acc} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`
  }, "")
  const area = `${line} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`
  const gid = `spark-${color.replace("#", "")}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-12">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function MetricCard({ label, value, icon: Icon, color, iconBg, data, chartColor = "#00B4C5" }: MetricCardProps) {
  // Tendencia: último vs penúltimo punto
  let trend: number | null = null
  if (data && data.length >= 2) {
    const last = data[data.length - 1]
    const prev = data[data.length - 2]
    if (prev > 0) trend = Math.round(((last - prev) / prev) * 100)
    else if (last > 0) trend = 100
    else trend = 0
  }
  const up = (trend ?? 0) >= 0

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#222222] bg-[#1A1A1A] p-5 hover:border-[#2E2E2E] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-xs text-[#737373] font-medium leading-none">{label}</p>
          <p className={cn("text-2xl font-bold tracking-tight leading-none", color)}>{value}</p>
        </div>
        <div className={cn("rounded-lg p-2 shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>

      {data && data.length > 1 && (
        <div className="mt-4 -mx-1">
          <Sparkline data={data} color={chartColor} />
        </div>
      )}

      {trend !== null && (
        <div className="mt-1 flex items-center gap-1">
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", up ? "text-emerald-400" : "text-red-400")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-[11px] text-[#4A4A4A]">vs mes anterior</span>
        </div>
      )}
    </div>
  )
}
