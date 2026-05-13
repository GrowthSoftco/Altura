import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  iconBg: string
}

export function MetricCard({ label, value, icon: Icon, color, iconBg }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-[#222222] bg-[#1C1C1C] p-5 hover:border-[#2E2E2E] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-xs text-[#737373] font-medium leading-none">
            {label}
          </p>
          <p className={cn("text-2xl font-bold tracking-tight leading-none", color)}>
            {value}
          </p>
        </div>
        <div className={cn("rounded-lg p-2 shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
    </div>
  )
}
