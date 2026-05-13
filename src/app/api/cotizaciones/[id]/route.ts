import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    include: { cliente: true },
  })
  if (!cotizacion) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(cotizacion)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const cotizacion = await prisma.cotizacion.update({
    where: { id },
    data: {
      ...(body.estado        && { estado: body.estado }),
      ...(body.notasInternas !== undefined && { notasInternas: body.notasInternas }),
      ...(body.observaciones !== undefined && { observaciones: body.observaciones }),
    },
    include: { cliente: true },
  })
  return NextResponse.json(cotizacion)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.cotizacion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
