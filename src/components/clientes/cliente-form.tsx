"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClienteBase } from "@/types"

interface ClienteFormProps {
  trigger: React.ReactNode
  cliente?: ClienteBase
  onSuccess?: (cliente: ClienteBase) => void
}

export function ClienteForm({ trigger, cliente, onSuccess }: ClienteFormProps) {
  const [open, setOpen]         = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [nombre, setNombre]     = useState(cliente?.nombre ?? "")
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "")
  const [correo, setCorreo]     = useState(cliente?.correo ?? "")
  const [documento, setDoc]     = useState(cliente?.documento ?? "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !telefono) {
      toast.error("Nombre y teléfono son requeridos")
      return
    }
    setLoading(true)
    try {
      const url    = cliente ? `/api/clientes/${cliente.id}` : "/api/clientes"
      const method = cliente ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono, correo, documento }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(cliente ? "Cliente actualizado" : "Cliente creado")
      onSuccess?.(data)
      setOpen(false)
    } catch {
      toast.error("Error al guardar el cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger}
      </span>
      <DialogContent className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2]">
        <DialogHeader>
          <DialogTitle className="text-[#F2F2F2] text-base font-semibold">
            {cliente ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Nombre completo *</Label>
            <Input
              className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Teléfono *</Label>
            <Input
              className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Correo</Label>
            <Input
              type="email"
              className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Documento</Label>
            <Input
              className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
              value={documento}
              onChange={(e) => setDoc(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 text-[#272F46] font-semibold shadow-md shadow-[#272F46]/15"
          >
            {isLoading ? "Guardando..." : cliente ? "Actualizar" : "Crear cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
