export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generarCodigoCotizacion, calcularPrecios } from "@/lib/calculos"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estado    = searchParams.get("estado")
  const clienteId = searchParams.get("clienteId")

  const cotizaciones = await prisma.cotizacion.findMany({
    where: {
      ...(estado    && { estado: estado as never }),
      ...(clienteId && { clienteId }),
    },
    include: { cliente: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(cotizaciones)
}

export async function POST(req: NextRequest) {
  try {
  const body = await req.json()
  let clienteId = body.clienteId

  if (!clienteId && body.clienteNuevo) {
    const c = body.clienteNuevo
    const cliente = await prisma.cliente.create({
      data: { nombre: c.nombre, telefono: c.telefono, correo: c.correo || null, documento: c.documento || null },
    })
    clienteId = cliente.id
  }
  if (!clienteId) return NextResponse.json({ error: "Cliente requerido" }, { status: 400 })

  // Validate required dates
  const fechaSalida  = body.fechaSalida  ? new Date(body.fechaSalida)  : null
  const fechaRegreso = body.fechaRegreso ? new Date(body.fechaRegreso) : null
  if (!fechaSalida  || isNaN(fechaSalida.getTime()))  return NextResponse.json({ error: "Fecha de salida inválida" }, { status: 400 })
  if (!fechaRegreso || isNaN(fechaRegreso.getTime())) return NextResponse.json({ error: "Fecha de llegada inválida" }, { status: 400 })

  const codigo  = await generarCodigoCotizacion(prisma)
  const precios = calcularPrecios(
    body.servicios,
    body.adultos,
    body.menores,
    body.porcentajeGanancia,
    { aplicar: body.mostrarPlanPagos ?? true, numeroCuotas: body.numeroCuotas ?? 3, porcentajes: body.porcentajesCuotas },
    body.cobrarIva ?? false,
  )

  const cotizacion = await prisma.cotizacion.create({
    data: {
      codigo,
      clienteId,
      tipo:               body.tipo,
      origen:             body.origen,
      destino:            body.destino,
      fechaSalida,
      fechaRegreso,
      aerolinea:          body.aerolineaIda  || null,
      aerolineaIda:       body.aerolineaIda  || null,
      aerolineaRegreso:   body.aerolineaRegreso || null,
      plataforma:         body.plataforma    || null,
      horaSalidaIda:      body.horaSalidaIda || null,
      horaLlegadaIda:     body.horaLlegadaIda || null,
      horaSalidaRegreso:  body.horaSalidaRegreso || null,
      horaLlegadaRegreso: body.horaLlegadaRegreso || null,
      tiempoVuelo:        body.tiempoVuelo   || null,
      escalas:            body.escalas       || null,
      tiempoEscala:       body.tiempoEscala  || null,
      numeroVuelo:        body.numeroVuelo   || null,
      adultos:            body.adultos,
      menores:            body.menores,
      edadesMenores:      body.edadesMenores || [],
      servicios:          body.servicios,
      itinerario:         body.itinerario || {},
      hotelNombre:        body.hotelNombre  || null,
      hotelNoches:        body.hotelNoches  || null,
      hotelTipo:          body.hotelTipo    || null,
      tramos:             body.tramos       || [],
      mostrarPlanPagos:   body.mostrarPlanPagos ?? true,
      numeroCuotas:       body.numeroCuotas ?? 3,
      porcentajeGanancia:  body.porcentajeGanancia,
      cobrarIva:           body.cobrarIva ?? false,
      valorNetoIndividual: precios.valorPorPersona,
      valorNetoTotal:      precios.valorFinal,
      gananciaTotal:       precios.valorFinal - precios.costoNetoTotal,
      valorConPorcentaje:  precios.valorFinal,
      planPagos:           precios.planPagos as never,
      asistenciaMedica:    body.asistenciaMedica ?? false,
      observaciones:       body.observaciones || null,
      notasInternas:       body.notasInternas  || null,
    },
    include: { cliente: true },
  })
  return NextResponse.json(cotizacion, { status: 201 })
  } catch (err) {
    console.error("POST /api/cotizaciones error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
