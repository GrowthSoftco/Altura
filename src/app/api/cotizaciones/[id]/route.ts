export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { calcularPrecios } from "@/lib/calculos"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cot = await prisma.cotizacion.findUnique({ where: { id }, include: { cliente: true } })
  if (!cot) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(cot)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await params
  const body = await req.json()

  // If full edit (has servicios in body), recalculate prices
  let preciosData = {}
  if (body.servicios) {
    const precios = calcularPrecios(
      body.servicios,
      body.adultos ?? 1,
      body.menores ?? 0,
      body.porcentajeGanancia ?? 0,
      { aplicar: body.mostrarPlanPagos ?? true, numeroCuotas: body.numeroCuotas ?? 3, porcentajes: body.porcentajesCuotas, modalidad: body.modalidadPlan, fechaInicial: body.fechaInicioPago, fechas: body.fechas },
      body.cobrarIva ?? false,
    )
    preciosData = {
      servicios:           body.servicios,
      porcentajeGanancia:  body.porcentajeGanancia,
      cobrarIva:           body.cobrarIva ?? false,
      valorNetoIndividual: precios.valorPorPersona,
      valorNetoTotal:      precios.valorFinal,
      gananciaTotal:       precios.valorFinal - precios.costoNetoTotal,
      valorConPorcentaje:  precios.valorFinal,
      planPagos:           precios.planPagos as never,
    }
  }

  const cot = await prisma.cotizacion.update({
    where: { id },
    data: {
      ...(body.estado              !== undefined && { estado: body.estado }),
      ...(body.tipo                !== undefined && { tipo: body.tipo }),
      ...(body.origen              !== undefined && { origen: body.origen }),
      ...(body.destino             !== undefined && { destino: body.destino }),
      ...(body.fechaSalida         !== undefined && { fechaSalida: new Date(body.fechaSalida) }),
      ...(body.fechaRegreso        !== undefined && { fechaRegreso: new Date(body.fechaRegreso) }),
      ...(body.aerolineaIda        !== undefined && { aerolineaIda: body.aerolineaIda, aerolinea: body.aerolineaIda }),
      ...(body.aerolineaRegreso    !== undefined && { aerolineaRegreso: body.aerolineaRegreso }),
      ...(body.plataforma          !== undefined && { plataforma: body.plataforma }),
      ...(body.horaSalidaIda       !== undefined && { horaSalidaIda: body.horaSalidaIda }),
      ...(body.horaLlegadaIda      !== undefined && { horaLlegadaIda: body.horaLlegadaIda }),
      ...(body.horaSalidaRegreso   !== undefined && { horaSalidaRegreso: body.horaSalidaRegreso }),
      ...(body.horaLlegadaRegreso  !== undefined && { horaLlegadaRegreso: body.horaLlegadaRegreso }),
      ...(body.tiempoVuelo         !== undefined && { tiempoVuelo: body.tiempoVuelo }),
      ...(body.escalas             !== undefined && { escalas: body.escalas }),
      ...(body.tiempoEscala        !== undefined && { tiempoEscala: body.tiempoEscala }),
      ...(body.adultos             !== undefined && { adultos: body.adultos }),
      ...(body.menores             !== undefined && { menores: body.menores }),
      ...(body.edadesMenores       !== undefined && { edadesMenores: body.edadesMenores }),
      ...(body.hotelNombre         !== undefined && { hotelNombre: body.hotelNombre }),
      ...(body.hotelNoches         !== undefined && { hotelNoches: body.hotelNoches }),
      ...(body.hotelTipo           !== undefined && { hotelTipo: body.hotelTipo }),
      ...(body.tramos              !== undefined && { tramos: body.tramos }),
      ...(body.hospedaje           !== undefined && { hospedaje: body.hospedaje ?? Prisma.JsonNull }),
      ...(body.mostrarPlanPagos    !== undefined && { mostrarPlanPagos: body.mostrarPlanPagos }),
      ...(body.numeroCuotas        !== undefined && { numeroCuotas: body.numeroCuotas }),
      ...(body.cobrarIva           !== undefined && { cobrarIva: body.cobrarIva }),
      ...(body.observaciones       !== undefined && { observaciones: body.observaciones }),
      ...(body.notasInternas       !== undefined && { notasInternas: body.notasInternas }),
      ...preciosData,
    },
    include: { cliente: true },
  })
  return NextResponse.json(cot)
  } catch (err) {
    console.error("PUT /api/cotizaciones/[id] error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.cotizacion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
