export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { calcularPrecios } from "@/lib/calculos"
import { getCurrentUser, puedeAccederCotizacion } from "@/lib/auth"
import { logBitacora } from "@/lib/bitacora"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const cot = await prisma.cotizacion.findUnique({ where: { id }, include: { cliente: true } })
  if (!cot) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!puedeAccederCotizacion(me, cot)) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })
  return NextResponse.json(cot)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const actual = await prisma.cotizacion.findUnique({ where: { id }, select: { creadoPorId: true, compartidoCon: true } })
  if (!actual) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!puedeAccederCotizacion(me, actual)) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })
  const body = await req.json()
  if (body.estado !== undefined && me.rol !== "ADMIN" && !me.permModificarEstados) {
    return NextResponse.json({ error: "Sin permiso para modificar estados" }, { status: 403 })
  }

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
      utilidadModo:        body.utilidadModo || null,
      utilidadFija:        body.utilidadFija ?? null,
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
  await logBitacora("COTIZACION_EDITADA", `Cotización ${cot.codigo} editada`, me.id, { cotizacionId: id })
  return NextResponse.json(cot)
  } catch (err) {
    console.error("PUT /api/cotizaciones/[id] error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (me.rol !== "ADMIN") return NextResponse.json({ error: "Solo el administrador puede eliminar cotizaciones" }, { status: 403 })
  const { id } = await params
  const cot = await prisma.cotizacion.findUnique({ where: { id }, select: { creadoPorId: true, compartidoCon: true, codigo: true } })
  if (!cot) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!puedeAccederCotizacion(me, cot)) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })
  await prisma.cotizacion.delete({ where: { id } })
  await logBitacora("COTIZACION_ELIMINADA", `Cotización ${cot.codigo} eliminada`, me.id, { cotizacionId: id })
  return NextResponse.json({ ok: true })
}
