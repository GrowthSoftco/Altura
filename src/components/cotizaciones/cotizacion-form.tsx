"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Search, Plus, Trash2 } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { saveAs } from "file-saver"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

import { ServiciosTable } from "@/components/cotizaciones/servicios-table"
import { ResumenCard } from "@/components/cotizaciones/resumen-card"
import { CotizacionPDF } from "@/components/cotizaciones/cotizacion-pdf"

import { calcularPrecios, calcularDuracion, SERVICIOS_DEFAULT } from "@/lib/calculos"
import { ServicioItem, CalculoPrecios, CotizacionCompleta, ClienteBase, Tramo } from "@/types"
import { cn } from "@/lib/utils"

// Section divider component
function Section({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-7">
      <div className="h-px flex-1 bg-[#262626]" />
      <span className="text-[#4A4A4A] text-[10px] font-medium tracking-[0.18em] uppercase">{title}</span>
      <div className="h-px flex-1 bg-[#262626]" />
    </div>
  )
}

// Flight block for tramos
function TramoBlock({
  tramo, index, onUpdate, onRemove
}: {
  tramo: Tramo
  index: number
  onUpdate: (t: Tramo) => void
  onRemove: () => void
}) {
  const up = (k: keyof Tramo, v: string) => onUpdate({ ...tramo, [k]: v })

  return (
    <div className="rounded-xl border border-[#262626] bg-[#181818] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#00B4C5] uppercase tracking-wider">Tramo {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-[#737373] hover:text-red-400 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Origen</Label>
          <Input className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.origen} onChange={e => up("origen", e.target.value)} placeholder="Ciudad origen" />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Destino</Label>
          <Input className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.destino} onChange={e => up("destino", e.target.value)} placeholder="Ciudad destino" />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Fecha salida</Label>
          <Input type="date" className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.fechaSalida ?? ""} onChange={e => up("fechaSalida", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Fecha regreso</Label>
          <Input type="date" className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.fechaRegreso ?? ""} onChange={e => up("fechaRegreso", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Aerolínea ida</Label>
          <Input className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.aerolineaIda ?? ""} onChange={e => up("aerolineaIda", e.target.value)} placeholder="Aerolínea" />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Aerolínea regreso</Label>
          <Input className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.aerolineaRegreso ?? ""} onChange={e => up("aerolineaRegreso", e.target.value)} placeholder="Aerolínea" />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Hora salida (ida)</Label>
          <Input type="time" className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.horaSalidaIda ?? ""} onChange={e => up("horaSalidaIda", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Hora llegada (ida)</Label>
          <Input type="time" className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.horaLlegadaIda ?? ""} onChange={e => up("horaLlegadaIda", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Escalas / conexión</Label>
          <Input className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.escalas ?? ""} onChange={e => up("escalas", e.target.value)} placeholder="Ej: Bogotá (1h30)" />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Plataforma</Label>
          <Input className="bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
            value={tramo.plataforma ?? ""} onChange={e => up("plataforma", e.target.value)} placeholder="Despegar, Avianca..." />
        </div>
      </div>
    </div>
  )
}

const PORCENTAJES_CUOTAS_DEFAULT: Record<number, number[]> = {
  1: [100],
  2: [50, 50],
  3: [50, 30, 20],
  4: [40, 30, 20, 10],
  5: [30, 25, 20, 15, 10],
  6: [25, 20, 20, 15, 10, 10],
}

interface CotizacionFormProps {
  initialClienteId?: string
  cotizacion?: CotizacionCompleta
}

export function CotizacionForm({ initialClienteId, cotizacion }: CotizacionFormProps = {}) {
  const router = useRouter()
  const isEdit = Boolean(cotizacion)
  const [isLoading, setIsLoading] = useState(false)

  // Cliente
  const [clienteId, setClienteId]       = useState<string | null>(cotizacion?.clienteId ?? null)
  const [nombre, setNombre]             = useState(cotizacion?.cliente?.nombre ?? "")
  const [telefono, setTelefono]         = useState(cotizacion?.cliente?.telefono ?? "")
  const [correo, setCorreo]             = useState(cotizacion?.cliente?.correo ?? "")
  const [documento, setDocumento]       = useState(cotizacion?.cliente?.documento ?? "")
  const [clienteSearch, setClienteSearch] = useState(false)
  const [clientes, setClientes]         = useState<ClienteBase[]>([])

  // Viaje principal
  const [tipo, setTipo]                 = useState<"NACIONAL" | "INTERNACIONAL">((cotizacion?.tipo as "NACIONAL" | "INTERNACIONAL") ?? "NACIONAL")
  const [origen, setOrigen]             = useState(cotizacion?.origen ?? "")
  const [destino, setDestino]           = useState(cotizacion?.destino ?? "")
  const [fechaSalida, setFechaSalida]   = useState<Date | undefined>(cotizacion ? new Date(cotizacion.fechaSalida) : undefined)
  const [fechaRegreso, setFechaRegreso] = useState<Date | undefined>(cotizacion ? new Date(cotizacion.fechaRegreso) : undefined)
  const [plataforma, setPlataforma]     = useState(cotizacion?.plataforma ?? "")
  const [aerolineaIda, setAerolineaIda]             = useState(cotizacion?.aerolineaIda ?? "")
  const [aerolineaRegreso, setAerolineaRegreso]     = useState(cotizacion?.aerolineaRegreso ?? "")
  const [horaSalidaIda, setHoraSalidaIda]           = useState(cotizacion?.horaSalidaIda ?? "")
  const [horaLlegadaIda, setHoraLlegadaIda]         = useState(cotizacion?.horaLlegadaIda ?? "")
  const [horaSalidaRegreso, setHoraSalidaRegreso]   = useState(cotizacion?.horaSalidaRegreso ?? "")
  const [horaLlegadaRegreso, setHoraLlegadaRegreso] = useState(cotizacion?.horaLlegadaRegreso ?? "")
  const [tiempoVuelo, setTiempoVuelo]   = useState(cotizacion?.tiempoVuelo ?? "")
  const [escalas, setEscalas]           = useState(cotizacion?.escalas ?? "")
  const [tiempoEscala, setTiempoEscala] = useState(cotizacion?.tiempoEscala ?? "")

  // Pasajeros
  const [adultos, setAdultos]           = useState(cotizacion?.adultos ?? 1)
  const [menores, setMenores]           = useState(cotizacion?.menores ?? 0)
  const [edadesMenores, setEdadesMenores] = useState<number[]>(cotizacion?.edadesMenores ?? [])

  // Hotel
  const [hotelNombre, setHotelNombre]   = useState(cotizacion?.hotelNombre ?? "")
  const [hotelNoches, setHotelNoches]   = useState<number>(cotizacion?.hotelNoches ?? 0)
  const [hotelTipo, setHotelTipo]       = useState(cotizacion?.hotelTipo ?? "")

  // Tramos
  const [tramos, setTramos]             = useState<Tramo[]>((cotizacion?.tramos as Tramo[]) ?? [])

  // Servicios
  const [servicios, setServicios]       = useState<ServicioItem[]>((cotizacion?.servicios as ServicioItem[]) ?? SERVICIOS_DEFAULT)
  const [porcentaje, setPorcentaje]     = useState(cotizacion ? Number(cotizacion.porcentajeGanancia) : 10)

  // Plan de pagos
  const initPlan = cotizacion?.planPagos as { aplicar?: boolean; numeroCuotas?: number; cuotas?: { porcentaje: number }[] } | undefined
  const [aplicarPlan, setAplicarPlan]   = useState(initPlan?.aplicar ?? true)
  const [numCuotas, setNumCuotas]       = useState(cotizacion?.numeroCuotas ?? initPlan?.numeroCuotas ?? 3)
  const [porcentajesCuotas, setPorcentajesCuotas] = useState<number[]>(
    initPlan?.cuotas?.map(c => c.porcentaje) ?? [50, 30, 20]
  )

  // IVA + PDF toggles
  const [cobrarIva, setCobrarIva]               = useState(cotizacion?.cobrarIva ?? false)
  const [mostrarPlanPagos, setMostrarPlanPagos] = useState(cotizacion?.mostrarPlanPagos ?? true)

  // Extras
  const [observaciones, setObservaciones] = useState(cotizacion?.observaciones ?? "")
  const [calculos, setCalculos]         = useState<CalculoPrecios>(() => {
    const initServicios = (cotizacion?.servicios as ServicioItem[]) ?? SERVICIOS_DEFAULT
    const initPct = cotizacion ? Number(cotizacion.porcentajeGanancia) : 10
    return calcularPrecios(initServicios, cotizacion?.adultos ?? 1, cotizacion?.menores ?? 0, initPct, { aplicar: true, numeroCuotas: cotizacion?.numeroCuotas ?? 3 }, cotizacion?.cobrarIva ?? false)
  })

  // Pre-fill client when coming from /clientes/[id] with ?clienteId=
  useEffect(() => {
    if (!initialClienteId || cotizacion) return
    fetch(`/api/clientes/${initialClienteId}`)
      .then(r => r.ok ? r.json() : null)
      .then((c) => { if (c) seleccionarCliente(c) })
      .catch(() => {/* silent */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClienteId])

  useEffect(() => {
    setCalculos(calcularPrecios(servicios, adultos, menores, porcentaje, {
      aplicar: aplicarPlan, numeroCuotas: numCuotas, porcentajes: porcentajesCuotas
    }, cobrarIva))
  }, [servicios, adultos, menores, porcentaje, aplicarPlan, numCuotas, porcentajesCuotas, cobrarIva])

  // Sync edades when menores changes
  useEffect(() => {
    setEdadesMenores(prev => {
      if (menores > prev.length) return [...prev, ...Array(menores - prev.length).fill(0)]
      return prev.slice(0, menores)
    })
  }, [menores])

  // Sync cuota percentages when numCuotas changes
  useEffect(() => {
    setPorcentajesCuotas(PORCENTAJES_CUOTAS_DEFAULT[numCuotas] ?? Array(numCuotas).fill(Math.floor(100 / numCuotas)))
  }, [numCuotas])

  const duracion = fechaSalida && fechaRegreso && fechaRegreso > fechaSalida
    ? calcularDuracion(fechaSalida, fechaRegreso) : null

  const buscarClientes = useCallback(async (q: string) => {
    if (!q || q.length < 2) return
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      setClientes(await res.json())
    } catch { /* silent */ }
  }, [])

  const seleccionarCliente = (c: ClienteBase) => {
    setClienteId(c.id); setNombre(c.nombre); setTelefono(c.telefono)
    setCorreo(c.correo ?? ""); setDocumento(c.documento ?? "")
    setClienteSearch(false)
  }

  const addTramo = () => setTramos(prev => [...prev, {
    id: `tramo_${Date.now()}`, origen: "", destino: "",
    aerolineaIda: "", aerolineaRegreso: "", plataforma: ""
  }])

  const updateTramo = (id: string, t: Tramo) => setTramos(prev => prev.map(x => x.id === id ? t : x))
  const removeTramo = (id: string) => setTramos(prev => prev.filter(x => x.id !== id))

  const updatePorcentajeCuota = (idx: number, val: number) => {
    setPorcentajesCuotas(prev => { const n = [...prev]; n[idx] = val; return n })
  }

  const buildPayload = () => ({
    clienteId: clienteId ?? undefined,
    clienteNuevo: clienteId ? undefined : { nombre, telefono, correo, documento },
    tipo, origen, destino,
    fechaSalida: fechaSalida?.toISOString(),
    fechaRegreso: fechaRegreso?.toISOString(),
    plataforma, aerolineaIda, aerolineaRegreso,
    horaSalidaIda, horaLlegadaIda, horaSalidaRegreso, horaLlegadaRegreso,
    tiempoVuelo, escalas, tiempoEscala,
    adultos, menores, edadesMenores,
    hotelNombre, hotelNoches: hotelNoches || null, hotelTipo,
    tramos,
    servicios,
    porcentajeGanancia: porcentaje,
    cobrarIva,
    mostrarPlanPagos: aplicarPlan,
    numeroCuotas: numCuotas,
    porcentajesCuotas,
    asistenciaMedica: servicios.find(s => s.id === "asistencia")?.activo ?? false,
    observaciones,
  })

  const handleGuardar = async () => {
    if (!nombre || !telefono || !origen || !destino || !fechaSalida || !fechaRegreso) {
      toast.error("Completa los campos requeridos"); return
    }
    setIsLoading(true)
    try {
      const url    = isEdit ? `/api/cotizaciones/${cotizacion!.id}` : "/api/cotizaciones"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      toast.success(isEdit ? "Cotización actualizada" : `Cotización ${saved.codigo} guardada`)
      router.push(`/cotizaciones/${saved.id}`)
    } catch { toast.error("Error al guardar") } finally { setIsLoading(false) }
  }

  const handleGenerarPDF = async () => {
    if (!nombre || !origen || !destino || !fechaSalida || !fechaRegreso) {
      toast.error("Completa los datos del viaje"); return
    }
    try {
      const mock: CotizacionCompleta = {
        id: "preview", codigo: "COT-PREVIEW", estado: "COTIZADA",
        fechaCreacion: new Date(), clienteId: clienteId ?? "preview",
        cliente: { id: clienteId ?? "preview", nombre, telefono, correo: correo || null, documento: documento || null, fechaRegistro: new Date(), createdAt: new Date(), updatedAt: new Date() },
        tipo, origen, destino, fechaSalida, fechaRegreso,
        aerolinea: aerolineaIda || null, aerolineaIda: aerolineaIda || null, aerolineaRegreso: aerolineaRegreso || null,
        plataforma: plataforma || null,
        horaSalidaIda: horaSalidaIda || null, horaLlegadaIda: horaLlegadaIda || null,
        horaSalidaRegreso: horaSalidaRegreso || null, horaLlegadaRegreso: horaLlegadaRegreso || null,
        tiempoVuelo: tiempoVuelo || null, escalas: escalas || null, tiempoEscala: tiempoEscala || null,
        numeroVuelo: null, adultos, menores, edadesMenores,
        servicios, itinerario: null,
        hotelNombre: hotelNombre || null, hotelNoches: hotelNoches || null, hotelTipo: hotelTipo || null,
        tramos: tramos.length > 0 ? tramos : null,
        porcentajeGanancia: porcentaje,
        costoNetoTotal: calculos.costoNetoTotal,
        valorConUtilidad: calculos.valorConUtilidad,
        valorPorPersona: calculos.valorPorPersona,
        valorNetoIndividual: calculos.valorPorPersona,
        valorNetoTotal: calculos.valorFinal,
        gananciaTotal: calculos.valorFinal - calculos.costoNetoTotal,
        valorConPorcentaje: calculos.valorFinal,
        planPagos: calculos.planPagos,
        cobrarIva,
        mostrarPlanPagos: aplicarPlan,
        numeroCuotas: numCuotas,
        asistenciaMedica: servicios.find(s => s.id === "asistencia")?.activo ?? false,
        observaciones: observaciones || null, notasInternas: null,
        createdAt: new Date(), updatedAt: new Date(),
      }
      const blob = await pdf(<CotizacionPDF cotizacion={mock} />).toBlob()
      saveAs(blob, `Cotizacion_${nombre}_COT-PREVIEW.pdf`)
    } catch (e) { toast.error("Error al generar PDF"); console.error(e) }
  }

  const sumaCuotas = porcentajesCuotas.reduce((a, b) => a + b, 0)

  return (
    <div className="grid grid-cols-3 gap-6 items-start">
      {/* Left: Form */}
      <div className="col-span-2 space-y-1">

        {/* CLIENTE */}
        <Section title="Datos del Cliente" />
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-[#737373] text-xs">Nombre completo *</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Nombre del cliente" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="mt-6">
              <Popover open={clienteSearch} onOpenChange={setClienteSearch}>
                <PopoverTrigger render={
                  <button type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }),
                    "border-[#262626] bg-[#1C1C1C] text-[#737373] hover:text-[#F2F2F2]")} />
                }>
                  <Search className="h-4 w-4 mr-1" /> Buscar
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-[#1C1C1C] border-[#262626]">
                  <Command className="bg-[#1C1C1C]">
                    <CommandInput placeholder="Buscar por nombre o teléfono..." className="text-[#F2F2F2]"
                      onValueChange={buscarClientes} />
                    <CommandList>
                      <CommandEmpty className="text-[#737373] text-sm py-4 text-center">Sin resultados</CommandEmpty>
                      <CommandGroup>
                        {clientes.map(c => (
                          <CommandItem key={c.id} onSelect={() => seleccionarCliente(c)}
                            className="text-[#F2F2F2] cursor-pointer hover:bg-[#242424]">
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
              <Label className="text-[#737373] text-xs">Teléfono *</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="300 000 0000" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Correo electrónico</Label>
              <Input type="email" className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="cliente@email.com" value={correo} onChange={e => setCorreo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Documento de identidad</Label>
            <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
              placeholder="CC / Pasaporte" value={documento} onChange={e => setDocumento(e.target.value)} />
          </div>
        </div>

        {/* VIAJE PRINCIPAL */}
        <Section title="Datos del Viaje" />
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(["NACIONAL", "INTERNACIONAL"] as const).map(t => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                className={cn("rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  tipo === t ? "bg-[#00B4C5] border-[#00B4C5] text-white" : "bg-[#1C1C1C] border-[#262626] text-[#737373] hover:border-[#00B4C5]/40 hover:text-[#F2F2F2]")}>
                {t === "NACIONAL" ? "Nacional" : "Internacional"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Origen *</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Ciudad origen" value={origen} onChange={e => setOrigen(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Destino *</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Ciudad destino" value={destino} onChange={e => setDestino(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Fecha de salida *</Label>
              <Popover>
                <PopoverTrigger render={
                  <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                    "w-full justify-start text-left font-normal bg-[#1C1C1C] border-[#262626]",
                    !fechaSalida && "text-[#737373]")} />
                }>
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#737373]" />
                  {fechaSalida ? format(fechaSalida, "dd/MM/yyyy") : "Seleccionar fecha"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1C1C1C] border-[#262626]">
                  <Calendar mode="single" selected={fechaSalida} onSelect={setFechaSalida} locale={es} className="bg-[#1C1C1C] text-[#F2F2F2]" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Fecha de regreso *</Label>
              <Popover>
                <PopoverTrigger render={
                  <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                    "w-full justify-start text-left font-normal bg-[#1C1C1C] border-[#262626]",
                    !fechaRegreso && "text-[#737373]")} />
                }>
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#737373]" />
                  {fechaRegreso ? format(fechaRegreso, "dd/MM/yyyy") : "Seleccionar fecha"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1C1C1C] border-[#262626]">
                  <Calendar mode="single" selected={fechaRegreso} onSelect={setFechaRegreso} locale={es}
                    className="bg-[#1C1C1C] text-[#F2F2F2]" disabled={d => fechaSalida ? d <= fechaSalida : false} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {duracion && <p className="text-xs text-[#00B4C5] font-medium">✈ {duracion.label}</p>}

          {/* Vuelo detalle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Plataforma de reserva</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Despegar, Avianca.com..." value={plataforma} onChange={e => setPlataforma(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Escalas / conexión</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Ej: Bogotá (1h30)" value={escalas} onChange={e => setEscalas(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Aerolínea ida</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Avianca, Latam..." value={aerolineaIda} onChange={e => setAerolineaIda(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Aerolínea regreso</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Avianca, Latam..." value={aerolineaRegreso} onChange={e => setAerolineaRegreso(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Hora salida (ida)</Label>
              <Input type="time" className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                value={horaSalidaIda} onChange={e => setHoraSalidaIda(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Hora llegada (ida)</Label>
              <Input type="time" className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                value={horaLlegadaIda} onChange={e => setHoraLlegadaIda(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Hora salida (regreso)</Label>
              <Input type="time" className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                value={horaSalidaRegreso} onChange={e => setHoraSalidaRegreso(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Hora llegada (regreso)</Label>
              <Input type="time" className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                value={horaLlegadaRegreso} onChange={e => setHoraLlegadaRegreso(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Tiempo de vuelo</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Ej: 4h30m" value={tiempoVuelo} onChange={e => setTiempoVuelo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Tiempo de escala</Label>
              <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
                placeholder="Ej: 2h" value={tiempoEscala} onChange={e => setTiempoEscala(e.target.value)} />
            </div>
          </div>
        </div>

        {/* PASAJEROS */}
        <Section title="Pasajeros" />
        <div className="space-y-4">
          <div className="flex items-center gap-8">
            {[
              { label: "Adultos", value: adultos, set: setAdultos, min: 1 },
              { label: "Menores", value: menores, set: setMenores, min: 0 },
            ].map(({ label, value, set, min }) => (
              <div key={label} className="flex items-center gap-3">
                <Label className="text-[#737373] text-xs w-16">{label}</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" type="button"
                    className="h-7 w-7 border-[#262626] bg-[#1C1C1C] text-[#F2F2F2]"
                    onClick={() => set(Math.max(min, value - 1))}>-</Button>
                  <span className="w-6 text-center text-sm font-semibold text-[#F2F2F2]">{value}</span>
                  <Button variant="outline" size="icon" type="button"
                    className="h-7 w-7 border-[#262626] bg-[#1C1C1C] text-[#F2F2F2]"
                    onClick={() => set(value + 1)}>+</Button>
                </div>
              </div>
            ))}
          </div>

          {menores > 0 && (
            <div className="space-y-2">
              <Label className="text-[#737373] text-xs">Edad de cada menor</Label>
              <div className="flex flex-wrap gap-2">
                {edadesMenores.map((edad, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-xs text-[#737373]">M{i + 1}:</span>
                    <Input
                      type="number" min={0} max={17}
                      className="w-16 h-7 bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] text-sm text-center"
                      value={edad}
                      onChange={e => {
                        const n = [...edadesMenores]
                        n[i] = parseInt(e.target.value) || 0
                        setEdadesMenores(n)
                      }}
                    />
                    <span className="text-xs text-[#737373]">años</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HOTEL */}
        <Section title="Hotel" />
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 space-y-1">
            <Label className="text-[#737373] text-xs">Nombre del hotel</Label>
            <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
              placeholder="Ej: Marriott" value={hotelNombre} onChange={e => setHotelNombre(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Noches</Label>
            <Input type="number" min={0} className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
              value={hotelNoches || ""} onChange={e => setHotelNoches(parseInt(e.target.value) || 0)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-[#737373] text-xs">Tipo de habitación</Label>
            <Input className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5]"
              placeholder="Doble, sencilla..." value={hotelTipo} onChange={e => setHotelTipo(e.target.value)} />
          </div>
        </div>

        {/* TRAMOS */}
        <Section title="Tramos adicionales" />
        <div className="space-y-3">
          {tramos.map((t, i) => (
            <TramoBlock key={t.id} tramo={t} index={i}
              onUpdate={updated => updateTramo(t.id, updated)}
              onRemove={() => removeTramo(t.id)} />
          ))}
          <button type="button" onClick={addTramo}
            className="flex items-center gap-2 text-sm text-[#00B4C5] hover:text-[#3D4F6E] transition-colors font-medium">
            <Plus className="h-4 w-4" /> Añadir tramo
          </button>
        </div>

        {/* SERVICIOS */}
        <Section title="Servicios incluidos" />
        <ServiciosTable servicios={servicios} onChange={setServicios} />

        {/* UTILIDAD */}
        <Section title="Utilidad" />
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="text-[#737373] text-xs w-40">Porcentaje de utilidad</Label>
            <input type="range" min={0} max={70} value={porcentaje}
              onChange={e => setPorcentaje(Number(e.target.value))}
              className="flex-1 accent-[#00B4C5]" />
            <div className="flex items-center gap-1">
              <Input type="number" min={0} max={70}
                className="w-16 bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] text-center h-8"
                value={porcentaje} onChange={e => setPorcentaje(Math.min(70, Math.max(0, Number(e.target.value))))} />
              <span className="text-[#737373] text-sm">%</span>
            </div>
          </div>
        </div>

        {/* PLAN DE PAGOS */}
        <Section title="Plan de Pagos" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={aplicarPlan} onCheckedChange={setAplicarPlan}
              className="data-[state=checked]:bg-[#00B4C5]" />
            <Label className="text-[#F2F2F2] text-sm cursor-pointer" onClick={() => setAplicarPlan(!aplicarPlan)}>
              Aplicar plan de pagos en cuotas
            </Label>
          </div>

          {aplicarPlan && (
            <div className="space-y-3 rounded-xl border border-[#262626] bg-[#181818] p-4">
              <div className="flex items-center gap-3">
                <Label className="text-[#737373] text-xs">Número de cuotas</Label>
                <Select value={String(numCuotas)} onValueChange={v => setNumCuotas(Number(v))}>
                  <SelectTrigger className="w-24 bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2]">
                    {[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n} cuota{n > 1 ? "s" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {porcentajesCuotas.map((pct, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-[#737373] w-16">Cuota {i + 1}</span>
                    <Input type="number" min={0} max={100}
                      className="w-20 h-7 bg-[#222222] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] text-sm text-center"
                      value={pct} onChange={e => updatePorcentajeCuota(i, Number(e.target.value))} />
                    <span className="text-xs text-[#737373]">%</span>
                  </div>
                ))}
                {sumaCuotas !== 100 && (
                  <p className="text-xs text-amber-400">Los porcentajes suman {sumaCuotas}% (debe ser 100%)</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OBSERVACIONES */}
        <Section title="Observaciones" />
        <Textarea className="bg-[#1C1C1C] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] min-h-[80px]"
          placeholder="Notas adicionales para el cliente..." value={observaciones}
          onChange={e => setObservaciones(e.target.value)} />
      </div>

      {/* Right: Resumen */}
      <div>
        <ResumenCard
          calculos={calculos} porcentaje={porcentaje} adultos={adultos} menores={menores}
          cobrarIva={cobrarIva} onToggleIva={setCobrarIva}
          mostrarPlanPagos={mostrarPlanPagos} onTogglePlanPagos={setMostrarPlanPagos}
          onGuardar={handleGuardar} onGenerarPDF={handleGenerarPDF} isLoading={isLoading}
        />
      </div>
    </div>
  )
}
