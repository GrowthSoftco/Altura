"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { format, addMonths, addDays, differenceInCalendarDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarIcon, Search, Plus, Trash2,
  User, Users, MapPin, Plane, BedDouble, ListChecks, Percent, Wallet, StickyNote, type LucideIcon,
} from "lucide-react"
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
import { CotizacionPDF, resolveHeaderDataUrl } from "@/components/cotizaciones/cotizacion-pdf"

import { calcularPrecios, calcularDuracion, SERVICIOS_DEFAULT, generarPorcentajesDefault } from "@/lib/calculos"
import { AIRPORTS } from "@/lib/iata-airports"
import { ServicioItem, CalculoPrecios, CotizacionCompleta, ClienteBase, Tramo, Hospedaje } from "@/types"
import { cn } from "@/lib/utils"

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtMiles = (v: number) => v === 0 ? "" : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
const parseMiles = (raw: string) => { const c = raw.replace(/\./g, "").replace(/[^0-9]/g, ""); return c === "" ? 0 : parseInt(c, 10) }

const NOTA_PLAN_PAGOS =
  "Nota importante: El plan de pagos fraccionado no corresponde a un crédito bancario ni genera intereses. " +
  "Debido a que los servicios turísticos están sujetos a variaciones del mercado, el valor final de los tiquetes " +
  "y hoteles puede presentar cambios al momento de la emisión o del pago total del plan o servicio adquirido. " +
  "En consecuencia, el ajuste en el costo obedecerá a la diferencia de la tarifa vigente al momento de confirmar " +
  "el servicio, garantizando así la correcta ejecución del plan o servicio adquirido."

const PORCENTAJES_CUOTAS_DEFAULT: Record<number, number[]> = {
  1: [100],
  2: [50, 50],
  3: [50, 30, 20],
  4: [40, 30, 20, 10],
  5: [30, 25, 20, 15, 10],
  6: [25, 20, 20, 15, 10, 10],
}

function generarFechasCuotas(
  fechaInicial: Date | undefined,
  modalidad: "mensual" | "quincenal",
  n: number
): (string | undefined)[] {
  if (!fechaInicial) return Array(n).fill(undefined)
  return Array.from({ length: n }, (_, i) => {
    const d = modalidad === "mensual" ? addMonths(fechaInicial, i) : addDays(fechaInicial, i * 15)
    return format(d, "yyyy-MM-dd")
  })
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  n, icon: Icon, title, subtitle, children,
}: { n: number; icon: LucideIcon; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="group rounded-2xl border border-[#222222] bg-[#171717] overflow-hidden transition-colors hover:border-[#2C2C2C]">
      <div className="flex items-center gap-3.5 px-5 py-4 border-b border-[#1F1F1F] bg-gradient-to-b from-[#1C1C1C] to-[#171717]">
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-xl bg-[#00B4C5]/10 ring-1 ring-[#00B4C5]/20 flex items-center justify-center">
            <Icon className="h-[18px] w-[18px] text-[#00B4C5]" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 h-[18px] w-[18px] rounded-full bg-[#00B4C5] text-[#052028] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#171717]">
            {n}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-[#F2F2F2] leading-tight tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-[#5E5E5E] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

// ─── Airport Combobox ─────────────────────────────────────────────────────────
function AirportCombobox({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync when external value changes (e.g. edit mode pre-fill)
  useEffect(() => { setQuery(value) }, [value])

  const filtered = query.length >= 1
    ? AIRPORTS.filter(a => {
        const q = query.toLowerCase()
        return a.code.toLowerCase().startsWith(q) ||
          a.city.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
      }).slice(0, 8)
    : []

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  const handleSelect = (code: string, city: string) => {
    const display = `${code} - ${city}`
    setQuery(display)
    onChange(display)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={handleInput}
        onFocus={() => query.length >= 1 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-lg border border-[#262626] bg-[#161616] shadow-xl overflow-hidden">
          {filtered.map(a => (
            <button key={a.code} type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect(a.code, a.city) }}
              className="w-full text-left px-3 py-2 hover:bg-[#242424] transition-colors flex items-center gap-2">
              <span className="text-[#00B4C5] font-mono font-bold text-xs w-8 shrink-0">{a.code}</span>
              <span className="text-[#F2F2F2] text-sm">{a.city}</span>
              <span className="text-[#4A4A4A] text-xs truncate">— {a.name}, {a.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tramo block ─────────────────────────────────────────────────────────────
const inpT = "bg-[#161616] border-[#2A2A2A] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"

function TramoBlock({
  tramo, index, onUpdate, onRemove, isFirst,
}: { tramo: Tramo; index: number; onUpdate: (t: Tramo) => void; onRemove?: () => void; isFirst?: boolean }) {
  const up = (k: keyof Tramo, v: string | number) => onUpdate({ ...tramo, [k]: v })
  const tramoNum = index + 1
  const [openSalida,  setOpenSalida]  = useState(false)
  const [openLlegada, setOpenLlegada] = useState(false)
  const [openCheckIn,  setOpenCheckIn]  = useState(false)
  const [openCheckOut, setOpenCheckOut] = useState(false)

  // Hotel opcional — visible solo si el usuario lo añade o ya tiene datos guardados
  const [showHotel, setShowHotel] = useState(
    Boolean(tramo.hotelNombre || tramo.hotelTipo || tramo.hotelCheckIn || tramo.hotelCheckOut)
  )

  const addHotel = () => setShowHotel(true)
  const removeHotel = () => {
    setShowHotel(false)
    onUpdate({
      ...tramo,
      hotelNombre: undefined, hotelTipo: undefined,
      hotelCheckIn: undefined, hotelCheckOut: undefined,
      hotelHoraCheckIn: undefined, hotelHoraCheckOut: undefined,
      hotelNoches: undefined,
    })
  }

  const selSalida  = tramo.fechaSalida  ? new Date(tramo.fechaSalida  + "T12:00:00") : undefined
  const selLlegada = tramo.fechaRegreso ? new Date(tramo.fechaRegreso + "T12:00:00") : undefined
  const selCheckIn  = tramo.hotelCheckIn  ? new Date(tramo.hotelCheckIn  + "T12:00:00") : undefined
  const selCheckOut = tramo.hotelCheckOut ? new Date(tramo.hotelCheckOut + "T12:00:00") : undefined

  // Auto-calc tiempo de vuelo from hora salida + hora llegada
  useEffect(() => {
    if (!tramo.horaSalidaIda || !tramo.horaLlegadaIda) return
    const [sh, sm] = tramo.horaSalidaIda.split(":").map(Number)
    const [lh, lm] = tramo.horaLlegadaIda.split(":").map(Number)
    let totalMin = (lh * 60 + lm) - (sh * 60 + sm)
    if (totalMin <= 0) totalMin += 24 * 60  // overnight flight
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    const tv = `${h}h${m > 0 ? ` ${m}m` : ""}`
    if (tv !== tramo.tiempoVuelo) onUpdate({ ...tramo, tiempoVuelo: tv })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tramo.horaSalidaIda, tramo.horaLlegadaIda])

  // Auto-calc noches del hotel desde check-in + check-out
  useEffect(() => {
    if (!tramo.hotelCheckIn || !tramo.hotelCheckOut) return
    const noches = Math.max(differenceInCalendarDays(
      new Date(tramo.hotelCheckOut + "T12:00:00"),
      new Date(tramo.hotelCheckIn  + "T12:00:00")
    ), 1)
    if (noches !== tramo.hotelNoches) onUpdate({ ...tramo, hotelNoches: noches })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tramo.hotelCheckIn, tramo.hotelCheckOut])

  return (
    <div className="rounded-xl border border-[#262626] bg-[#141414] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#00B4C5] uppercase tracking-wider">Tramo {tramoNum}</span>
        {!isFirst && onRemove && (
          <button type="button" onClick={onRemove} className="text-[#737373] hover:text-red-400 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Origen</Label>
          <AirportCombobox value={tramo.origen} onChange={v => up("origen", v)}
            placeholder="Ciudad o IATA" className={inpT} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Destino</Label>
          <AirportCombobox value={tramo.destino} onChange={v => up("destino", v)}
            placeholder="Ciudad o IATA" className={inpT} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Fecha salida</Label>
          <Popover open={openSalida} onOpenChange={setOpenSalida}>
            <PopoverTrigger render={
              <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                "w-full justify-start text-left font-normal bg-[#161616] border-[#2A2A2A] h-8 text-sm",
                !tramo.fechaSalida && "text-[#737373]")} />
            }>
              <CalendarIcon className="mr-1.5 h-3 w-3 text-[#737373] shrink-0" />
              {selSalida ? format(selSalida, "dd/MM/yyyy") : <span className="text-[#4A4A4A]">Seleccionar</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
              <Calendar mode="single" selected={selSalida} locale={es}
                className="bg-[#161616] text-[#F2F2F2]"
                onSelect={d => { if (d) { up("fechaSalida", format(d, "yyyy-MM-dd")); setOpenSalida(false) } }} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Fecha de llegada</Label>
          <Popover open={openLlegada} onOpenChange={setOpenLlegada}>
            <PopoverTrigger render={
              <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                "w-full justify-start text-left font-normal bg-[#161616] border-[#2A2A2A] h-8 text-sm",
                !tramo.fechaRegreso && "text-[#737373]")} />
            }>
              <CalendarIcon className="mr-1.5 h-3 w-3 text-[#737373] shrink-0" />
              {selLlegada ? format(selLlegada, "dd/MM/yyyy") : <span className="text-[#4A4A4A]">Seleccionar</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
              <Calendar mode="single" selected={selLlegada} locale={es}
                defaultMonth={selLlegada ?? selSalida}
                disabled={selSalida ? { before: selSalida } : undefined}
                className="bg-[#161616] text-[#F2F2F2]"
                onSelect={d => { if (d) { up("fechaRegreso", format(d, "yyyy-MM-dd")); setOpenLlegada(false) } }} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Aerolínea</Label>
          <Input className={inpT} value={tramo.aerolineaIda ?? ""}
            onChange={e => up("aerolineaIda", e.target.value)} placeholder="Avianca, Latam..." />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Plataforma de reserva</Label>
          <Input className={inpT} value={tramo.plataforma ?? ""}
            onChange={e => up("plataforma", e.target.value)} placeholder="Despegar, Avianca.com..." />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Hora salida</Label>
          <Input type="time" className={inpT}
            value={tramo.horaSalidaIda ?? ""} onChange={e => up("horaSalidaIda", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Hora llegada</Label>
          <Input type="time" className={inpT}
            value={tramo.horaLlegadaIda ?? ""} onChange={e => up("horaLlegadaIda", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Tiempo de vuelo</Label>
          <Input className={inpT} value={tramo.tiempoVuelo ?? ""}
            onChange={e => up("tiempoVuelo", e.target.value)} placeholder="4h 30m" />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Escalas / conexión</Label>
          <Input className={inpT} value={tramo.escalas ?? ""}
            onChange={e => up("escalas", e.target.value)} placeholder="Bogotá (1h30)" />
        </div>
      </div>

      {/* Hotel — opcional, independiente del vuelo */}
      <div className="border-t border-[#262626] pt-3">
        {!showHotel ? (
          <button type="button" onClick={addHotel}
            className="flex items-center gap-1.5 text-xs font-medium text-[#00B4C5] hover:text-[#00d4e8] transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Añadir hotel
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider">Hospedaje tramo {tramoNum}</p>
              <button type="button" onClick={removeHotel}
                className="text-[#737373] hover:text-red-400 transition-colors" title="Quitar hotel">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[#737373] text-xs">Nombre del hotel</Label>
                <Input className={inpT} value={tramo.hotelNombre ?? ""}
                  onChange={e => up("hotelNombre", e.target.value)} placeholder="Marriott..." />
              </div>
              <div className="space-y-1">
                <Label className="text-[#737373] text-xs">Nombre de la habitación</Label>
                <Input className={inpT} value={tramo.hotelTipo ?? ""}
                  onChange={e => up("hotelTipo", e.target.value)} placeholder="Twin Economy, Doble..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[#737373] text-xs">Fecha check-in</Label>
                <Popover open={openCheckIn} onOpenChange={setOpenCheckIn}>
                  <PopoverTrigger render={
                    <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                      "w-full justify-start text-left font-normal bg-[#161616] border-[#2A2A2A] h-8 text-sm",
                      !tramo.hotelCheckIn && "text-[#737373]")} />
                  }>
                    <CalendarIcon className="mr-1.5 h-3 w-3 text-[#737373] shrink-0" />
                    {selCheckIn ? format(selCheckIn, "dd/MM/yyyy") : <span className="text-[#4A4A4A]">Seleccionar</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
                    <Calendar mode="single" selected={selCheckIn} locale={es}
                      className="bg-[#161616] text-[#F2F2F2]"
                      onSelect={d => { if (d) { up("hotelCheckIn", format(d, "yyyy-MM-dd")); setOpenCheckIn(false) } }} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-[#737373] text-xs">Hora check-in</Label>
                <Input type="time" className={inpT}
                  value={tramo.hotelHoraCheckIn ?? ""} onChange={e => up("hotelHoraCheckIn", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[#737373] text-xs">Fecha check-out</Label>
                <Popover open={openCheckOut} onOpenChange={setOpenCheckOut}>
                  <PopoverTrigger render={
                    <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                      "w-full justify-start text-left font-normal bg-[#161616] border-[#2A2A2A] h-8 text-sm",
                      !tramo.hotelCheckOut && "text-[#737373]")} />
                  }>
                    <CalendarIcon className="mr-1.5 h-3 w-3 text-[#737373] shrink-0" />
                    {selCheckOut ? format(selCheckOut, "dd/MM/yyyy") : <span className="text-[#4A4A4A]">Seleccionar</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
                    <Calendar mode="single" selected={selCheckOut} locale={es}
                      defaultMonth={selCheckOut ?? selCheckIn}
                      disabled={selCheckIn ? { before: selCheckIn } : undefined}
                      className="bg-[#161616] text-[#F2F2F2]"
                      onSelect={d => { if (d) { up("hotelCheckOut", format(d, "yyyy-MM-dd")); setOpenCheckOut(false) } }} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-[#737373] text-xs">Hora check-out</Label>
                <Input type="time" className={inpT}
                  value={tramo.hotelHoraCheckOut ?? ""} onChange={e => up("hotelHoraCheckOut", e.target.value)} />
              </div>
            </div>
            {(() => {
              if (!tramo.hotelCheckIn || !tramo.hotelCheckOut) return null
              const noches = Math.max(differenceInCalendarDays(
                new Date(tramo.hotelCheckOut + "T12:00:00"),
                new Date(tramo.hotelCheckIn  + "T12:00:00")
              ), 1)
              const dias = noches + 1
              return (
                <p className="text-[11px] text-[#00B4C5] font-medium mt-1">
                  {dias} día{dias !== 1 ? "s" : ""} / {noches} noche{noches !== 1 ? "s" : ""}
                </p>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Hospedaje (sección independiente, opcional) ──────────────────────────────
function HospedajeSection({
  hospedaje, onChange,
}: { hospedaje: Hospedaje | null; onChange: (h: Hospedaje | null) => void }) {
  const [openIn,  setOpenIn]  = useState(false)
  const [openOut, setOpenOut] = useState(false)
  const h = hospedaje ?? {}
  const up = (k: keyof Hospedaje, v: string) => onChange({ ...h, [k]: v })

  const selIn  = h.checkIn  ? new Date(h.checkIn  + "T12:00:00") : undefined
  const selOut = h.checkOut ? new Date(h.checkOut + "T12:00:00") : undefined

  if (!hospedaje) {
    return (
      <button type="button" onClick={() => onChange({})}
        className="flex items-center gap-1.5 text-sm font-medium text-[#00B4C5] hover:text-[#00d4e8] transition-colors">
        <Plus className="h-4 w-4" /> Añadir hospedaje
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-[#262626] bg-[#141414] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#00B4C5] uppercase tracking-wider">Hospedaje</span>
        <button type="button" onClick={() => onChange(null)}
          className="text-[#737373] hover:text-red-400 transition-colors" title="Quitar hospedaje">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Nombre del hospedaje</Label>
          <Input className={inpT} value={h.nombre ?? ""} onChange={e => up("nombre", e.target.value)} placeholder="Hotel, Airbnb, finca..." />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Habitación / tipo</Label>
          <Input className={inpT} value={h.habitacion ?? ""} onChange={e => up("habitacion", e.target.value)} placeholder="Suite, doble..." />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Ciudad</Label>
          <Input className={inpT} value={h.ciudad ?? ""} onChange={e => up("ciudad", e.target.value)} placeholder="Cartagena..." />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Dirección</Label>
          <Input className={inpT} value={h.direccion ?? ""} onChange={e => up("direccion", e.target.value)} placeholder="Calle 1 #2-3..." />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Fecha check-in</Label>
          <Popover open={openIn} onOpenChange={setOpenIn}>
            <PopoverTrigger render={
              <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                "w-full justify-start text-left font-normal bg-[#161616] border-[#2A2A2A] h-8 text-sm",
                !h.checkIn && "text-[#737373]")} />
            }>
              <CalendarIcon className="mr-1.5 h-3 w-3 text-[#737373] shrink-0" />
              {selIn ? format(selIn, "dd/MM/yyyy") : <span className="text-[#4A4A4A]">Seleccionar</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
              <Calendar mode="single" selected={selIn} locale={es} className="bg-[#161616] text-[#F2F2F2]"
                onSelect={d => { if (d) { up("checkIn", format(d, "yyyy-MM-dd")); setOpenIn(false) } }} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Hora check-in</Label>
          <Input type="time" className={inpT} value={h.horaCheckIn ?? ""} onChange={e => up("horaCheckIn", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Fecha check-out</Label>
          <Popover open={openOut} onOpenChange={setOpenOut}>
            <PopoverTrigger render={
              <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                "w-full justify-start text-left font-normal bg-[#161616] border-[#2A2A2A] h-8 text-sm",
                !h.checkOut && "text-[#737373]")} />
            }>
              <CalendarIcon className="mr-1.5 h-3 w-3 text-[#737373] shrink-0" />
              {selOut ? format(selOut, "dd/MM/yyyy") : <span className="text-[#4A4A4A]">Seleccionar</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
              <Calendar mode="single" selected={selOut} locale={es}
                defaultMonth={selOut ?? selIn}
                disabled={selIn ? { before: selIn } : undefined}
                className="bg-[#161616] text-[#F2F2F2]"
                onSelect={d => { if (d) { up("checkOut", format(d, "yyyy-MM-dd")); setOpenOut(false) } }} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label className="text-[#737373] text-xs">Hora check-out</Label>
          <Input type="time" className={inpT} value={h.horaCheckOut ?? ""} onChange={e => up("horaCheckOut", e.target.value)} />
        </div>
      </div>
      {(() => {
        if (!h.checkIn || !h.checkOut) return null
        const noches = Math.max(differenceInCalendarDays(
          new Date(h.checkOut + "T12:00:00"),
          new Date(h.checkIn  + "T12:00:00")
        ), 1)
        const dias = noches + 1
        return (
          <p className="text-[11px] text-[#00B4C5] font-medium mt-1">
            {dias} día{dias !== 1 ? "s" : ""} / {noches} noche{noches !== 1 ? "s" : ""}
          </p>
        )
      })()}
      <div className="space-y-1">
        <Label className="text-[#737373] text-xs">Notas / detalles</Label>
        <Input className={inpT} value={h.notas ?? ""} onChange={e => up("notas", e.target.value)} placeholder="Desayuno incluido, parqueadero..." />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface CotizacionFormProps {
  initialClienteId?: string
  cotizacion?: CotizacionCompleta
}

export function CotizacionForm({ initialClienteId, cotizacion }: CotizacionFormProps = {}) {
  const router  = useRouter()
  const isEdit  = Boolean(cotizacion)
  const [isLoading, setIsLoading] = useState(false)

  // ── Cliente ──
  const [clienteId, setClienteId]         = useState<string | null>(cotizacion?.clienteId ?? null)
  const [nombre, setNombre]               = useState(cotizacion?.cliente?.nombre ?? "")
  const [telefono, setTelefono]           = useState(cotizacion?.cliente?.telefono ?? "")
  const [correo, setCorreo]               = useState(cotizacion?.cliente?.correo ?? "")
  const [documento, setDocumento]         = useState(cotizacion?.cliente?.documento ?? "")
  const [clienteSearch, setClienteSearch] = useState(false)
  const [clientes, setClientes]           = useState<ClienteBase[]>([])

  // ── Viaje (tipo) ──
  const [tipo, setTipo] = useState<"NACIONAL" | "INTERNACIONAL">((cotizacion?.tipo as "NACIONAL" | "INTERNACIONAL") ?? "NACIONAL")

  // ── Pasajeros ──
  const [adultos, setAdultos]           = useState(cotizacion?.adultos ?? 1)
  const [menores, setMenores]           = useState(cotizacion?.menores ?? 0)
  const [edadesMenores, setEdadesMenores] = useState<number[]>(cotizacion?.edadesMenores ?? [])

  // ── Tramos (tramos[0] = Tramo 1 — siempre presente, incluye hotel) ──
  const [tramos, setTramos] = useState<Tramo[]>(() => {
    if (!cotizacion) return [{ id: "tramo_1", origen: "", destino: "" }]
    const existing = cotizacion.tramos as Tramo[] | null
    if (existing && existing.length > 0) return existing
    // Backward compat: build tramo 1 from top-level fields
    return [{
      id: "tramo_1",
      origen:       cotizacion.origen ?? "",
      destino:      cotizacion.destino ?? "",
      fechaSalida:  cotizacion.fechaSalida  ? format(new Date(cotizacion.fechaSalida),  "yyyy-MM-dd") : undefined,
      fechaRegreso: cotizacion.fechaRegreso ? format(new Date(cotizacion.fechaRegreso), "yyyy-MM-dd") : undefined,
      aerolineaIda: cotizacion.aerolineaIda  ?? undefined,
      horaSalidaIda:    cotizacion.horaSalidaIda  ?? undefined,
      horaLlegadaIda:   cotizacion.horaLlegadaIda ?? undefined,
      tiempoVuelo:  cotizacion.tiempoVuelo ?? undefined,
      escalas:      cotizacion.escalas     ?? undefined,
      plataforma:   cotizacion.plataforma  ?? undefined,
      hotelNombre:  cotizacion.hotelNombre ?? undefined,
      hotelNoches:  cotizacion.hotelNoches ?? undefined,
      hotelTipo:    cotizacion.hotelTipo   ?? undefined,
    }]
  })

  // ── Hospedaje (sección independiente, opcional) ──
  const [hospedaje, setHospedaje] = useState<Hospedaje | null>((cotizacion?.hospedaje as Hospedaje) ?? null)

  // ── Servicios ──
  const [servicios, setServicios] = useState<ServicioItem[]>((cotizacion?.servicios as ServicioItem[]) ?? SERVICIOS_DEFAULT)
  const [porcentaje, setPorcentaje]         = useState(cotizacion ? Number(cotizacion.porcentajeGanancia) : 0)
  const [utilidadModo, setUtilidadModo]     = useState<"porcentaje" | "fijo">(
    (cotizacion?.utilidadModo as "porcentaje" | "fijo") ?? "porcentaje"
  )
  const [utilidadFija, setUtilidadFija]     = useState(cotizacion?.utilidadFija ?? 0)

  // ── Plan de pagos ──
  const initPlan = cotizacion?.planPagos as { aplicar?: boolean; numeroCuotas?: number; cuotas?: { porcentaje: number; fecha?: string }[]; modalidad?: "mensual" | "quincenal"; incremento?: number; fechaInicial?: string } | undefined
  const initN    = cotizacion?.numeroCuotas ?? initPlan?.numeroCuotas ?? 3
  const [aplicarPlan, setAplicarPlan]       = useState(initPlan?.aplicar ?? true)
  const [numCuotas, setNumCuotas]           = useState(initN)
  const [porcentajesCuotas, setPorcentajesCuotas] = useState<number[]>(() => {
    const stored = initPlan?.cuotas?.map(c => c.porcentaje) ?? []
    // Use stored if length matches, otherwise generate defaults
    return stored.length === initN ? stored : generarPorcentajesDefault(initN)
  })
  const [modalidadPlan, setModalidadPlan]   = useState<"mensual" | "quincenal">(initPlan?.modalidad ?? "mensual")
  const [fechaInicioPago, setFechaInicioPago] = useState<Date | undefined>(
    initPlan?.fechaInicial ? new Date(initPlan.fechaInicial + "T12:00:00") : undefined
  )
  const [incrementoCuota, setIncrementoCuota] = useState(initPlan?.incremento ?? 0)

  // ── IVA + PDF toggles ──
  const [cobrarIva, setCobrarIva]               = useState(cotizacion?.cobrarIva ?? false)
  const [mostrarPlanPagos, setMostrarPlanPagos] = useState(cotizacion?.mostrarPlanPagos ?? true)

  // ── Detalles del viaje — completamente independientes de los tramos ──
  const [detOrigen,       setDetOrigen]       = useState<string>(cotizacion?.origen ?? "")
  const [detDestino,      setDetDestino]      = useState<string>(cotizacion?.destino ?? "")
  const [detFechaSalida,  setDetFechaSalida]  = useState<string | undefined>(
    cotizacion?.fechaSalida  ? format(new Date(cotizacion.fechaSalida),  "yyyy-MM-dd") : undefined
  )
  const [detFechaRegreso, setDetFechaRegreso] = useState<string | undefined>(
    cotizacion?.fechaRegreso ? format(new Date(cotizacion.fechaRegreso), "yyyy-MM-dd") : undefined
  )
  const [openDetSalida,  setOpenDetSalida]  = useState(false)
  const [openDetLlegada, setOpenDetLlegada] = useState(false)

  // ── Observaciones ──
  const [observaciones, setObservaciones] = useState(cotizacion?.observaciones ?? "")

  // ── Calculos ──
  const [calculos, setCalculos] = useState<CalculoPrecios>(() => {
    const initServicios = (cotizacion?.servicios as ServicioItem[]) ?? SERVICIOS_DEFAULT
    const initPct       = cotizacion ? Number(cotizacion.porcentajeGanancia) : 0
    const storedPcts    = initPlan?.cuotas?.map(c => c.porcentaje) ?? []
    const initPcts      = storedPcts.length === initN ? storedPcts : generarPorcentajesDefault(initN)
    return calcularPrecios(initServicios, cotizacion?.adultos ?? 1, cotizacion?.menores ?? 0, initPct,
      { aplicar: initPlan?.aplicar ?? true, numeroCuotas: initN, porcentajes: initPcts }, cotizacion?.cobrarIva ?? false)
  })

  // ── Effects ──

  // Pre-fill client from URL param
  useEffect(() => {
    if (!initialClienteId || cotizacion) return
    fetch(`/api/clientes/${initialClienteId}`)
      .then(r => r.ok ? r.json() : null)
      .then(c => { if (c) seleccionarCliente(c) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClienteId])

  // Effective porcentaje — supports both % and fixed-value modes
  const costoNetoCalc = (() => {
    const pax = Math.max(adultos + menores, 1)
    const pp  = servicios.filter(s => s.activo && s.esPorPersona !== false).reduce((s, x) => s + x.valorNeto, 0)
    const pg  = servicios.filter(s => s.activo && s.esPorPersona === false).reduce((s, x) => s + x.valorNeto, 0)
    return pp * pax + pg
  })()
  const porcentajeEfectivo = utilidadModo === "fijo" && costoNetoCalc > 0
    ? (utilidadFija / costoNetoCalc) * 100
    : porcentaje

  // Recalculate on any pricing input change
  useEffect(() => {
    const fechas = generarFechasCuotas(fechaInicioPago, modalidadPlan, numCuotas)
    setCalculos(calcularPrecios(servicios, adultos, menores, porcentajeEfectivo, {
      aplicar: aplicarPlan,
      numeroCuotas: numCuotas,
      porcentajes: porcentajesCuotas,
      incremento: 0,
      modalidad: modalidadPlan,
      fechaInicial: fechaInicioPago ? format(fechaInicioPago, "yyyy-MM-dd") : undefined,
      fechas,
    }, cobrarIva))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicios, adultos, menores, porcentajeEfectivo, aplicarPlan, numCuotas, porcentajesCuotas,
      cobrarIva, modalidadPlan, fechaInicioPago])

  // Sync edades when menores changes
  useEffect(() => {
    setEdadesMenores(prev => {
      if (menores > prev.length) return [...prev, ...Array(menores - prev.length).fill(0)]
      return prev.slice(0, menores)
    })
  }, [menores])

  // Sync cuota percentages when numCuotas changes — skip on initial mount
  const isMountedCuotas = useRef(false)
  useEffect(() => {
    if (!isMountedCuotas.current) { isMountedCuotas.current = true; return }
    setPorcentajesCuotas(PORCENTAJES_CUOTAS_DEFAULT[numCuotas] ?? Array(numCuotas).fill(Math.floor(100 / numCuotas)))
  }, [numCuotas])


  // Derived from Tramo 1
  const t0           = tramos[0]
  // Detalles del viaje — fechas propias (independientes de tramos)
  const fs           = detFechaSalida  ? new Date(detFechaSalida  + "T12:00:00") : undefined
  const fr           = detFechaRegreso ? new Date(detFechaRegreso + "T12:00:00") : undefined
  const duracion     = fs && fr && fr > fs ? calcularDuracion(fs, fr) : null
  const sumaCuotas = porcentajesCuotas.reduce((a, b) => a + b, 0)

  // ── Handlers ──
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

  const addTramo = () => {
    const tramoId  = `tramo_${Date.now()}`
    const tramoNum = tramos.length + 1   // after push: new tramo is at index tramos.length → num = tramos.length+1
    setTramos(prev => [...prev, { id: tramoId, origen: "", destino: "" }])
    setServicios(prev => [...prev,
      { id: `tkt_${tramoId}`,   nombre: `Tiquete Tramo ${tramoNum}`, activo: true, valorNeto: 0, obs: "", esPorPersona: true  },
      { id: `hotel_${tramoId}`, nombre: `Hospedaje tramo ${tramoNum}`, activo: true, valorNeto: 0, obs: "", esPorPersona: false },
    ])
  }

  const removeTramo = (tramoId: string) => {
    if (tramoId === "tramo_1") return  // Tramo 1 no se puede eliminar
    setTramos(prev => prev.filter(x => x.id !== tramoId))
    setServicios(prev => prev.filter(s => !s.id.includes(tramoId)))
  }

  const updatePorcentajeCuota = (idx: number, val: number) => {
    setPorcentajesCuotas(prev => { const n = [...prev]; n[idx] = val; return n })
  }

  const buildPayload = () => {
    const t = tramos[0]
    return {
      clienteId: clienteId ?? undefined,
      clienteNuevo: clienteId ? undefined : { nombre, telefono, correo, documento },
      tipo,
      // Top-level fields — Detalles del viaje (independientes de tramos)
      origen:       detOrigen,
      destino:      detDestino,
      fechaSalida:  detFechaSalida  ? new Date(detFechaSalida  + "T12:00:00").toISOString() : undefined,
      fechaRegreso: detFechaRegreso ? new Date(detFechaRegreso + "T12:00:00").toISOString() : undefined,
      aerolineaIda:       t?.aerolineaIda    ?? "",
      aerolineaRegreso:   "",
      horaSalidaIda:      t?.horaSalidaIda   ?? "",
      horaLlegadaIda:     t?.horaLlegadaIda  ?? "",
      horaSalidaRegreso:  "",
      horaLlegadaRegreso: "",
      tiempoVuelo:  t?.tiempoVuelo ?? "",
      escalas:      t?.escalas     ?? "",
      tiempoEscala: "",
      plataforma:   t?.plataforma  ?? "",
      adultos, menores, edadesMenores,
      hotelNombre: t?.hotelNombre ?? "", hotelNoches: t?.hotelNoches ?? null, hotelTipo: t?.hotelTipo ?? "",
      tramos,   // All tramos including tramo_1
      hospedaje,  // Sección de hospedaje independiente (null si no se usa)
      servicios,
      porcentajeGanancia: porcentajeEfectivo,
      utilidadModo,
      utilidadFija: utilidadModo === "fijo" ? Math.round(utilidadFija) : null,
      cobrarIva,
      mostrarPlanPagos,
      numeroCuotas: numCuotas,
      porcentajesCuotas,
      incrementoCuota: 0,
      modalidadPlan,
      fechaInicioPago: fechaInicioPago ? format(fechaInicioPago, "yyyy-MM-dd") : null,
      asistenciaMedica: servicios.find(s => s.id === "asistencia")?.activo ?? false,
      observaciones,
    }
  }

  const handleGuardar = async () => {
    if (!nombre)           { toast.error("El nombre del cliente es requerido"); return }
    if (!telefono)         { toast.error("El teléfono del cliente es requerido"); return }
    if (!detOrigen)  { toast.error("El origen del viaje es requerido"); return }
    if (!detDestino) { toast.error("El destino del viaje es requerido"); return }
    if (!detFechaSalida)  { toast.error("La fecha de salida es requerida"); return }
    if (!detFechaRegreso) { toast.error("La fecha de llegada es requerida"); return }
    setIsLoading(true)
    try {
      const url    = isEdit ? `/api/cotizaciones/${cotizacion!.id}` : "/api/cotizaciones"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) {
        const msg = await res.text()
        console.error("API error:", msg)
        toast.error(`Error al guardar: ${msg.slice(0, 120)}`)
        return
      }
      const saved = await res.json()
      toast.success(isEdit ? "Cotización actualizada" : `Cotización ${saved.codigo} guardada`)
      router.push(`/cotizaciones/${saved.id}`)
    } catch (e) {
      console.error("handleGuardar error:", e)
      toast.error(`Error al guardar: ${e instanceof Error ? e.message : "Error desconocido"}`)
    } finally { setIsLoading(false) }
  }

  const handleGenerarPDF = async () => {
    if (!nombre || !detOrigen || !detDestino || !detFechaSalida) {
      toast.error("Completa los datos del viaje"); return
    }
    try {
      const mock: CotizacionCompleta = {
        id: "preview", codigo: "COT-PREVIEW", estado: "BORRADOR",
        fechaCreacion: new Date(), clienteId: clienteId ?? "preview",
        cliente: { id: clienteId ?? "preview", nombre, telefono, correo: correo || null, documento: documento || null, fechaRegistro: new Date(), createdAt: new Date(), updatedAt: new Date() },
        tipo, origen: detOrigen, destino: detDestino,
        fechaSalida: fs ?? new Date(), fechaRegreso: fr ?? new Date(),
        aerolinea: t0?.aerolineaIda || null, aerolineaIda: t0?.aerolineaIda || null, aerolineaRegreso: null,
        plataforma: t0?.plataforma || null,
        horaSalidaIda: t0?.horaSalidaIda || null, horaLlegadaIda: t0?.horaLlegadaIda || null,
        horaSalidaRegreso: null, horaLlegadaRegreso: null,
        tiempoVuelo: t0?.tiempoVuelo || null, escalas: t0?.escalas || null, tiempoEscala: null,
        numeroVuelo: null, adultos, menores, edadesMenores,
        servicios, itinerario: null,
        hotelNombre: t0?.hotelNombre || null, hotelNoches: t0?.hotelNoches || null, hotelTipo: t0?.hotelTipo || null,
        tramos: tramos.length > 0 ? tramos : null,
        hospedaje,
        creadoPorId: null, compartidoCon: [], utilidadModo: null, utilidadFija: null,
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
        mostrarPlanPagos,
        numeroCuotas: numCuotas,
        asistenciaMedica: servicios.find(s => s.id === "asistencia")?.activo ?? false,
        observaciones: observaciones || null, notasInternas: null,
        createdAt: new Date(), updatedAt: new Date(),
      }
      const headerUrl = await resolveHeaderDataUrl()
      const blob = await pdf(<CotizacionPDF cotizacion={mock} headerUrl={headerUrl} />).toBlob()
      saveAs(blob, `Cotizacion_${nombre}_COT-PREVIEW.pdf`)
    } catch (e) { toast.error("Error al generar PDF"); console.error(e) }
  }

  // ── Input class helpers ──
  const inp = "bg-[#161616] border-[#2A2A2A] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm rounded-lg transition-colors"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
      {/* ── Left: Form ── */}
      <div className="lg:col-span-2 space-y-4">

        {/* CLIENTE */}
        <SectionCard n={1} icon={User} title="Datos del Cliente" subtitle="¿Quién viaja?">
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-[#737373] text-xs">Nombre completo *</Label>
              <Input className={cn(inp, "h-9")} placeholder="Nombre del cliente"
                value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="mt-6">
              <Popover open={clienteSearch} onOpenChange={setClienteSearch}>
                <PopoverTrigger render={
                  <button type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }),
                    "border-[#262626] bg-[#161616] text-[#737373] hover:text-[#F2F2F2]")} />
                }>
                  <Search className="h-4 w-4 mr-1" /> Buscar
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-[#161616] border-[#262626]">
                  <Command className="bg-[#161616]">
                    <CommandInput placeholder="Nombre o teléfono..." className="text-[#F2F2F2]" onValueChange={buscarClientes} />
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
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Teléfono *</Label>
              <Input className={inp} placeholder="300 000 0000" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Correo electrónico</Label>
              <Input type="email" className={inp} placeholder="cliente@email.com" value={correo} onChange={e => setCorreo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Documento</Label>
              <Input className={inp} placeholder="CC / Pasaporte" value={documento} onChange={e => setDocumento(e.target.value)} />
            </div>
          </div>
        </div>

        </SectionCard>

        {/* PASAJEROS */}
        <SectionCard n={2} icon={Users} title="Pasajeros" subtitle="Adultos y menores">
        <div className="space-y-3">
          <div className="flex items-center gap-8">
            {[
              { label: "Adultos", value: adultos, set: setAdultos, min: 1 },
              { label: "Menores", value: menores, set: setMenores, min: 0 },
            ].map(({ label, value, set, min }) => (
              <div key={label} className="flex items-center gap-3">
                <Label className="text-[#737373] text-xs w-14">{label}</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" type="button"
                    className="h-7 w-7 border-[#262626] bg-[#161616] text-[#F2F2F2]"
                    onClick={() => set(Math.max(min, value - 1))}>–</Button>
                  <span className="w-5 text-center text-sm font-semibold text-[#F2F2F2]">{value}</span>
                  <Button variant="outline" size="icon" type="button"
                    className="h-7 w-7 border-[#262626] bg-[#161616] text-[#F2F2F2]"
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
                    <Input type="number" min={0} max={17}
                      className="w-14 h-7 bg-[#161616] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] text-sm text-center"
                      value={edad}
                      onChange={e => {
                        const n = [...edadesMenores]; n[i] = parseInt(e.target.value) || 0; setEdadesMenores(n)
                      }} />
                    <span className="text-xs text-[#737373]">a</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        </SectionCard>

        {/* DETALLES DEL VIAJE */}
        <SectionCard n={3} icon={MapPin} title="Detalles del viaje" subtitle="Origen, destino y fechas">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Origen *</Label>
              <AirportCombobox value={detOrigen} className={inp}
                placeholder="Ciudad o IATA"
                onChange={v => setDetOrigen(v)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Destino *</Label>
              <AirportCombobox value={detDestino} className={inp}
                placeholder="Ciudad o IATA"
                onChange={v => setDetDestino(v)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Fecha de ida *</Label>
              <Popover open={openDetSalida} onOpenChange={setOpenDetSalida}>
                <PopoverTrigger render={
                  <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                    "w-full justify-start text-left font-normal bg-[#161616] border-[#262626] h-8 text-sm",
                    !fs && "text-[#737373]")} />
                }>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#737373] shrink-0" />
                  {fs ? format(fs, "dd/MM/yyyy") : <span className="text-[#4A4A4A]">Seleccionar</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
                  <Calendar mode="single" selected={fs} locale={es}
                    className="bg-[#161616] text-[#F2F2F2]"
                    onSelect={d => { if (d) { setDetFechaSalida(format(d, "yyyy-MM-dd")); setOpenDetSalida(false) } }} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-[#737373] text-xs">Fecha de llegada *</Label>
              <Popover open={openDetLlegada} onOpenChange={setOpenDetLlegada}>
                <PopoverTrigger render={
                  <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                    "w-full justify-start text-left font-normal bg-[#161616] border-[#262626] h-8 text-sm",
                    !fr && "text-[#737373]")} />
                }>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#737373] shrink-0" />
                  {fr ? format(fr, "dd/MM/yyyy") : <span className="text-[#4A4A4A]">Seleccionar</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
                  <Calendar mode="single" selected={fr} locale={es}
                    defaultMonth={fr ?? fs}
                    disabled={fs ? { before: fs } : undefined}
                    className="bg-[#161616] text-[#F2F2F2]"
                    onSelect={d => { if (d) { setDetFechaRegreso(format(d, "yyyy-MM-dd")); setOpenDetLlegada(false) } }} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {duracion && (
            <p className="text-xs text-[#00B4C5] font-medium">{duracion.label}</p>
          )}
        </div>

        </SectionCard>

        {/* VUELOS */}
        <SectionCard n={4} icon={Plane} title="Vuelos" subtitle="Tipo de viaje y tramos">
        {/* Tipo de viaje */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(["NACIONAL", "INTERNACIONAL"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTipo(t)}
              className={cn("rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                tipo === t ? "bg-[#00B4C5] border-[#00B4C5] text-white" : "bg-[#161616] border-[#262626] text-[#737373] hover:border-[#00B4C5]/40 hover:text-[#F2F2F2]")}>
              {t === "NACIONAL" ? "Nacional" : "Internacional"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {tramos.map((tramo, i) => (
            <TramoBlock key={tramo.id} tramo={tramo} index={i} isFirst={i === 0}
              onUpdate={updated => setTramos(prev => prev.map(x => x.id === tramo.id ? updated : x))}
              onRemove={i === 0 ? undefined : () => removeTramo(tramo.id)} />
          ))}
          <button type="button" onClick={addTramo}
            className="flex items-center gap-2 text-sm text-[#00B4C5] hover:text-[#009aaa] transition-colors font-medium">
            <Plus className="h-4 w-4" /> Añadir tramo
          </button>
        </div>

        </SectionCard>

        {/* HOSPEDAJE */}
        <SectionCard n={5} icon={BedDouble} title="Hospedaje" subtitle="Alojamiento (opcional)">
        <HospedajeSection hospedaje={hospedaje} onChange={setHospedaje} />
        </SectionCard>

        {/* SERVICIOS */}
        <SectionCard n={6} icon={ListChecks} title="Servicios incluidos" subtitle="Qué incluye la cotización">
        <ServiciosTable servicios={servicios} onChange={setServicios} />
        </SectionCard>

        {/* UTILIDAD */}
        <SectionCard n={7} icon={Percent} title="Utilidad" subtitle="Margen de ganancia">
        <div className="space-y-3">
          {/* Toggle modo */}
          <div className="flex gap-2">
            {([["porcentaje", "% Porcentaje"], ["fijo", "$ Valor fijo"]] as const).map(([m, label]) => (
              <button key={m} type="button"
                onClick={() => {
                  if (m === "fijo") setUtilidadFija(Math.round(calculos.valorConUtilidad - calculos.costoNetoTotal))
                  setUtilidadModo(m)
                }}
                className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  utilidadModo === m ? "bg-[#00B4C5] border-[#00B4C5] text-white" : "bg-[#161616] border-[#262626] text-[#737373] hover:border-[#00B4C5]/40")}>
                {label}
              </button>
            ))}
          </div>

          {utilidadModo === "porcentaje" ? (
            <div className="flex items-center gap-4">
              <Label className="text-[#737373] text-xs w-36 shrink-0">Porcentaje</Label>
              <input type="range" min={0} max={70} value={porcentaje}
                onChange={e => setPorcentaje(Number(e.target.value))}
                className="flex-1 accent-[#00B4C5]" />
              <div className="flex items-center gap-1">
                <Input type="number" min={0} max={70}
                  className="w-14 bg-[#161616] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] text-center h-8 text-sm"
                  value={porcentaje} onChange={e => setPorcentaje(Math.min(70, Math.max(0, Number(e.target.value))))} />
                <span className="text-[#737373] text-sm">%</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Label className="text-[#737373] text-xs w-36 shrink-0">Valor fijo</Label>
              <Input
                className="flex-1 bg-[#161616] border-[#262626] text-[#F2F2F2] focus:border-[#00B4C5] h-8 text-sm"
                value={fmtMiles(utilidadFija)}
                onChange={e => setUtilidadFija(parseMiles(e.target.value))}
                placeholder="0" />
              <span className="text-[#737373] text-sm shrink-0">COP</span>
              {costoNetoCalc > 0 && (
                <span className="text-xs text-[#4A4A4A] shrink-0">≈ {Math.round(porcentajeEfectivo)}%</span>
              )}
            </div>
          )}
        </div>

        </SectionCard>

        {/* PLAN DE PAGOS */}
        <SectionCard n={8} icon={Wallet} title="Plan de Pagos" subtitle="Cuotas y fechas">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch checked={aplicarPlan} onCheckedChange={setAplicarPlan} className="data-[state=checked]:bg-[#00B4C5]" />
            <Label className="text-[#F2F2F2] text-sm cursor-pointer" onClick={() => setAplicarPlan(!aplicarPlan)}>
              Aplicar plan de pagos en cuotas
            </Label>
          </div>

          {aplicarPlan && (
            <div className="rounded-xl border border-[#262626] bg-[#141414] p-4 space-y-4">

              {/* Fila 1: cuotas + modalidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[#737373] text-xs">Número de cuotas</Label>
                  <Select value={String(numCuotas)} onValueChange={v => setNumCuotas(Number(v))}>
                    <SelectTrigger className="bg-[#161616] border-[#262626] text-[#F2F2F2] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#262626] text-[#F2F2F2]">
                      {Array.from({length: 24}, (_, i) => i + 1).map(n => <SelectItem key={n} value={String(n)}>{n} cuota{n > 1 ? "s" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[#737373] text-xs">Modalidad</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["mensual", "quincenal"] as const).map(m => (
                      <button key={m} type="button" onClick={() => setModalidadPlan(m)}
                        className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                          modalidadPlan === m
                            ? "bg-[#00B4C5] border-[#00B4C5] text-white"
                            : "bg-[#161616] border-[#262626] text-[#737373] hover:border-[#00B4C5]/40")}>
                        {m === "mensual" ? "Mensual" : "Quincenal"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fecha inicial */}
              <div className="space-y-1">
                <Label className="text-[#737373] text-xs">Fecha inicial de pago</Label>
                <Popover>
                  <PopoverTrigger render={
                    <button type="button" className={cn(buttonVariants({ variant: "outline" }),
                      "w-full justify-start text-left font-normal bg-[#161616] border-[#262626] h-8 text-sm",
                      !fechaInicioPago && "text-[#737373]")} />
                  }>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#737373]" />
                    {fechaInicioPago ? format(fechaInicioPago, "dd/MM/yyyy") : "Seleccionar"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#161616] border-[#262626]">
                    <Calendar mode="single" selected={fechaInicioPago} onSelect={setFechaInicioPago}
                      locale={es} className="bg-[#161616] text-[#F2F2F2]" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Cuotas */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider">Distribución de cuotas</p>
                {porcentajesCuotas.map((pct, i) => {
                  const monto = Math.round(calculos.valorFinal * pct / 100)
                  const fecha = calculos.planPagos.cuotas[i]?.fecha
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-[#737373] w-16 shrink-0">Cuota {i + 1}</span>
                      <Input type="number" min={0} max={200}
                        className="w-16 h-7 bg-[#161616] border-[#2A2A2A] text-[#F2F2F2] focus:border-[#00B4C5] text-sm text-center"
                        value={pct}
                        onChange={e => updatePorcentajeCuota(i, Number(e.target.value))} />
                      <span className="text-xs text-[#737373]">%</span>
                      <span className="text-xs text-[#F2F2F2] tabular-nums ml-auto">${fmtMiles(monto)}</span>
                      {fecha && (
                        <span className="text-xs text-[#00B4C5] w-24 text-right">
                          {format(new Date(fecha + "T12:00:00"), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* Total del plan */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#262626]">
                  <span className="text-xs text-[#737373]">
                    Total plan
                    {sumaCuotas !== 100 && (
                      <span className={cn("ml-1", sumaCuotas > 100 ? "text-amber-400" : "text-red-400")}>
                        ({sumaCuotas}%)
                      </span>
                    )}
                  </span>
                  <span className={cn("text-sm font-semibold tabular-nums", sumaCuotas > 100 ? "text-amber-400" : "text-[#F2F2F2]")}>
                    ${fmtMiles(Math.round(calculos.valorFinal * sumaCuotas / 100))}
                  </span>
                </div>
                {sumaCuotas < 100 && (
                  <p className="text-xs text-red-400">Faltan {100 - sumaCuotas}% por asignar</p>
                )}
              </div>

              {/* Nota legal */}
              <div className="border-t border-[#262626] pt-3">
                <p className="text-[10px] text-[#383838] leading-relaxed">{NOTA_PLAN_PAGOS}</p>
              </div>
            </div>
          )}
        </div>

        </SectionCard>

        {/* OBSERVACIONES */}
        <SectionCard n={9} icon={StickyNote} title="Observaciones" subtitle="Notas para el cliente">
        <Textarea className="bg-[#161616] border-[#2A2A2A] text-[#F2F2F2] focus:border-[#00B4C5] min-h-[72px] text-sm rounded-lg"
          placeholder="Notas adicionales para el cliente..." value={observaciones}
          onChange={e => setObservaciones(e.target.value)} />
        </SectionCard>
      </div>

      {/* ── Right: Resumen sticky ── */}
      <div className="lg:sticky lg:top-6">
        <ResumenCard
          calculos={calculos} porcentaje={Math.round(porcentajeEfectivo)} adultos={adultos} menores={menores}
          cobrarIva={cobrarIva} onToggleIva={(v) => setCobrarIva(v)}
          mostrarPlanPagos={mostrarPlanPagos} onTogglePlanPagos={(v) => setMostrarPlanPagos(v)}
          sumaCuotas={sumaCuotas}
          onGuardar={handleGuardar} onGenerarPDF={handleGenerarPDF} isLoading={isLoading}
        />
      </div>
    </div>
  )
}
