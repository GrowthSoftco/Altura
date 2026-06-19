"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ConfirmState {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  action: () => void | Promise<void>
}

export function ConfirmDialog({
  state, loading, onClose,
}: { state: ConfirmState | null; loading?: boolean; onClose: () => void }) {
  if (!state) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => !loading && onClose()}>
      <div className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#161616] p-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-[#F2F2F2]">{state.title}</h3>
        {state.description && <p className="text-[13px] text-[#909090] mt-1.5 leading-relaxed">{state.description}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-lg text-sm text-[#909090] hover:text-[#F2F2F2] disabled:opacity-40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => state.action()}
            disabled={loading}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-40 transition-colors",
              state.danger ? "bg-red-500 text-white hover:bg-red-600" : "bg-white text-[#0A0A0A] hover:bg-gray-100"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {state.confirmLabel || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  )
}
