"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Search } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { saveAs } from "file-saver"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { ServiciosTable } from "@/components/cotizaciones/servicios-table"
import { ResumenCard } from "@/components/cotizaciones/resumen-card"
import { CotizacionPDF } from "@/components/cotizaciones/cotizacion-pdf"

import { calcularPrecios, calcularDuracion, SERVICIOS_DEFAULT } from "@/lib/calculos"
import { ServicioItem, CalculoPrecios, CotizacionCompleta, ClienteBase } from "@/types"
import { cn } from "@/lib/utils"

function SectionDivider({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-7">
      <div className="h-px flex-1 bg-[#262626]" />
      <span className="text-[#4A4A4A] text-[10px] font-medium tracking-[0.18em] uppercase">
        {titulo}
      </span>
      <div className="h-px flex-1 bg-[#262626]" />
    </div>
  )
}

const PORCENTAJES = [5, 8, 10, 12, 15, 20]

export function CotizacionForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Cliente
  const [clienteId, setClienteId]   = useState<string | null>(null)
  const [nombre, setNombre]         = useState("")
  const [telefono, setTelefono]     = useState("")
  const [correo, setCorreo]         = useState("")
  const [documento, setDocumento]   = useState("")
  const [clienteSearch, setClienteSearch] = useState(false)
  const [clientes, setClientes]     = useState<ClienteBase[]>([])

  // Viaje
  const [tipo, setTipo]             = useState<"NACIONAL" | "INTERNACIONAL">("NACIONAL")
  const [origen, setOrigen]         = useState("")
  const [destino, setDestino]       = useState("")
  const [fechaSalida, setFechaSalida]   = useState<Date | undefined>()
  const [fechaRegreso, setFechaRegreso] = useState<Date | undefined>()
  const [aerolinea, setAerolinea]   = useState("")
  const [adultos, setAdultos]       = useState(1)
  const [menores, setMenores]       = useState(0)

  // Servicios
  const [servicios, setServicios]   = useState<ServicioItem[]>(SERVICIOS_DEFAULT)
  const [porcentaje, setPorcentaje] = useState(5)

  // Extras
  const [observaciones, setObservaciones] = useState("")

  // Cálculos en tiempo real
  const [calculos, setCalculos] = useState<CalculoPrecios>(() =>
    calcularPrecios(SERVICIOS_DEFAULT, 1, 0, 5)
  )

  useEffect(() => {
    setCalculos(calcularPrecios(servicios, adultos, menores, porcentaje))
  }, [servicios, adultos, menores, porcentaje])

  const duracion =
    fechaSalida && fechaRegreso && fechaRegreso > fechaSalida
      ? calcularDuracion(fechaSalida, fechaRegreso)
      : null

  const buscarClientes = useCallback(async (q: string) => {
    if (!q || q.length < 2) return
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setClientes(data)
    } catch {
      // silent
    }
  }, [])

  const seleccionarCliente = (c: ClienteBase) => {
    setClienteId(c.id)
    setNombre(c.nombre)
    setTelefono(c.telefono)
    setCorreo(c.correo ?? "")
    setDocumento(c.documento ?? "")
    setClienteSearch(false)
  }

  const buildPayload = () => ({
    clienteId: clienteId ?? undefined,
    clienteNuevo: clienteId
      ? undefined
      : { nombre, telefono, correo, documento },
    tipo,
    origen,
    destino,
    fechaSalida: fechaSalida?.toISOString(),
    fechaRegreso: fechaRegreso?.toISOString(),
    aerolinea,
    adultos,
    menores,
    servicios,
    porcentajeGanancia: porcentaje,
    asistenciaMedica: servicios.find((s) => s.id === "asistencia")?.activo ?? false,
    observaciones,
  })

  const handleGuardar = async () => {
    if (!nombre || !telefono || !origen || !destino || !fechaSalida || !fechaRegreso) {
      toast.error("Completa los campos requeridos")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) throw new Error(await res.text())
      const cotizacion = await res.json()
      toast.success(`Cotización ${cotizacion.codigo} guardada`)
      router.push(`/cotizaciones/${cotizacion.id}`)
    } catch (e) {
      toast.error("Error al guardar la cotización")
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerarPDF = async () => {
    if (!nombre || !origen || !destino || !fechaSalida || !fechaRegreso) {
      toast.error("Completa los datos del viaje antes de generar el PDF")
      return
    }
    try {
      const mockCotizacion: CotizacionCompleta = {
        id: "preview",
        codigo: "COT-PREVIEW",
        estado: "COTIZADA",
        fechaCreacion: new Date(),
        clienteId: clienteId ?? "preview",
        cliente: {
          id: clienteId ?? "preview",
          nombre,
          telefono,
          correo: correo || null,
          documento: documento || null,
          fechaRegistro: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tipo,
        origen,
        destino,
        fechaSalida,
        fechaRegreso,
        aerolinea: aerolinea || null,
        numeroVuelo: null,
        adultos,
        menores,
        edadesMenores: [],
        servicios,
        itinerario: null,
        porcentajeGanancia: porcentaje,
        valorNetoIndividual: calculos.valorNetoIndividual,
        valorNetoTotal: calculos.valorNetoTotal,
        gananciaTotal: calculos.gananciaTotal,
        valorConPorcentaje: calculos.valorConPorcentaje,
        planPagos: calculos.planPagos,
        asistenciaMedica: servicios.find((s) => s.id === "asistencia")?.activo ?? false,
        observaciones: observaciones || null,
        notasInternas: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const blob = await pdf(<CotizacionPDF cotizacion={mockCotizacion} />).toBlob()
      saveAs(blob, `Cotizacion_${nombre}_COT-PREVIEW.pdf`)
    } catch (e) {
      toast.error("Error al generar el PDF")
      console.error(e)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6 items-start">
      {/* Left: Form */}
      <div className="col-span-2 space-y-1">
        {/* Datos del Cliente */}
        <SectionDivider titulo="Datos del Cliente" />
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-[#737373] text-xs">Nombre completo *</Label>
              <Input
                className="bg-[#1C1C1C] border-[#262626] text-white focus:border-[#4F6EF7]"
                placeholder="Nombre del cliente"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="mt-6">
              <Popover open={clienteSearch} onOpenChange={setClienteSearch}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "border-[#262626] bg-[#1C1C1C] text-[#737373] hover:text-white"
                      )}
                    />
                  }
                >
                  <Search className="h-4 w-4 mr-1" /> Buscar
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-[#1C1C1C] border-[#262626]">
                  <Command className="bg-[#1C1C1C]">
                    <CommandInput
                      placeholder="Buscar cliente..."
                      className="text-white"
                      onValueChange={buscarClientes}
                    />
                    <CommandList>
                      <CommandEmpty className="text-[#737373] text-sm py-4 text-center">
                        No se encontraron clientes
                      </CommandEmpty>
                      <CommandGroup>
                        {clientes.map((c) => (
                          <CommandItem
                            key={c.id}
                            onSelect={() => seleccionarCliente(c)}
                            className="text-white cursor-pointer"
                          >
                            <div>
                              <p className="font-medium">{c.nombre}</p>
                              <p className="text-xs text-[#737373]">{c.telefono}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Teléfono / WhatsApp *</Label>
              <Input
                className="bg-[#1C1C1C] border-[#262626] text-white focus:border-[#4F6EF7]"
                placeholder="300 000 0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Correo electrónico</Label>
              <Input
                className="bg-[#1C1C1C] border-[#262626] text-white focus:border-[#4F6EF7]"
                placeholder="cliente@email.com"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Documento de identidad</Label>
            <Input
              className="bg-[#1C1C1C] border-[#262626] text-white focus:border-[#4F6EF7]"
              placeholder="CC / Pasaporte"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
            />
          </div>
        </div>

        {/* Datos del Viaje */}
        <SectionDivider titulo="Datos del Viaje" />
        <div className="space-y-3">
          {/* Tipo de viaje */}
          <div className="grid grid-cols-2 gap-2">
            {(["NACIONAL", "INTERNACIONAL"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                  tipo === t
                    ? "bg-[#4F6EF7] border-[#4F6EF7] text-white"
                    : "bg-[#1C1C1C] border-[#262626] text-[#737373] hover:border-[#4F6EF7]/40 hover:text-[#F2F2F2]"
                )}
              >
                {t === "NACIONAL" ? "Nacional" : "Internacional"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Origen *</Label>
              <Input
                className="bg-[#1C1C1C] border-[#262626] text-white focus:border-[#4F6EF7]"
                placeholder="Ciudad de origen"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Destino *</Label>
              <Input
                className="bg-[#1C1C1C] border-[#262626] text-white focus:border-[#4F6EF7]"
                placeholder="Ciudad de destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Fecha de salida *</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-start text-left font-normal bg-[#1C1C1C] border-[#262626]",
                        !fechaSalida && "text-[#737373]"
                      )}
                    />
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#737373]" />
                  {fechaSalida ? format(fechaSalida, "dd/MM/yyyy") : "Seleccionar fecha"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1C1C1C] border-[#262626]">
                  <Calendar
                    mode="single"
                    selected={fechaSalida}
                    onSelect={setFechaSalida}
                    locale={es}
                    className="bg-[#1C1C1C] text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Fecha de regreso *</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-start text-left font-normal bg-[#1C1C1C] border-[#262626]",
                        !fechaRegreso && "text-[#737373]"
                      )}
                    />
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#737373]" />
                  {fechaRegreso ? format(fechaRegreso, "dd/MM/yyyy") : "Seleccionar fecha"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1C1C1C] border-[#262626]">
                  <Calendar
                    mode="single"
                    selected={fechaRegreso}
                    onSelect={setFechaRegreso}
                    locale={es}
                    className="bg-[#1C1C1C] text-white"
                    disabled={(date) =>
                      fechaSalida ? date <= fechaSalida : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {duracion && (
            <p className="text-xs text-[#4F6EF7] font-medium">
              ✈ {duracion.label}
            </p>
          )}

          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Aerolínea</Label>
            <Input
              className="bg-[#1C1C1C] border-[#262626] text-white focus:border-[#4F6EF7]"
              placeholder="Nombre de la aerolínea"
              value={aerolinea}
              onChange={(e) => setAerolinea(e.target.value)}
            />
          </div>

          {/* Pasajeros */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Adultos", value: adultos, set: setAdultos, min: 1 },
              { label: "Menores", value: menores, set: setMenores, min: 0 },
            ].map(({ label, value, set, min }) => (
              <div key={label} className="flex items-center gap-3">
                <Label className="text-[#737373] text-xs w-16">{label}</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="h-7 w-7 border-[#262626] bg-[#1C1C1C] text-white"
                    onClick={() => set(Math.max(min, value - 1))}
                  >
                    -
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold text-white">
                    {value}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="h-7 w-7 border-[#262626] bg-[#1C1C1C] text-white"
                    onClick={() => set(value + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Servicios */}
        <SectionDivider titulo="Servicios" />
        <ServiciosTable servicios={servicios} onChange={setServicios} />

        {/* Porcentaje de ganancia */}
        <SectionDivider titulo="Ganancia" />
        <div className="flex items-center gap-4">
          <Label className="text-[#737373] text-xs w-40">Porcentaje de ganancia</Label>
          <Select
            value={String(porcentaje)}
            onValueChange={(v) => setPorcentaje(Number(v))}
          >
            <SelectTrigger className="w-40 bg-[#1C1C1C] border-[#262626] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1C1C1C] border-[#262626] text-white">
              {PORCENTAJES.map((p) => (
                <SelectItem key={p} value={String(p)} className="focus:bg-[#242424]">
                  {p}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Observaciones */}
        <SectionDivider titulo="Observaciones" />
        <Textarea
          className="bg-[#1C1C1C] border-[#262626] text-white focus:border-[#4F6EF7] min-h-[80px]"
          placeholder="Notas adicionales para el cliente..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </div>

      {/* Right: Resumen */}
      <div>
        <ResumenCard
          calculos={calculos}
          porcentaje={porcentaje}
          totalPax={adultos + menores}
          onGuardar={handleGuardar}
          onGenerarPDF={handleGenerarPDF}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
