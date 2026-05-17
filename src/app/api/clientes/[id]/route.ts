export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cliente = await prisma.cliente.findUnique({ where: { id }, include: { cotizaciones: { orderBy: { createdAt: "desc" } } } })
  if (!cliente) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(cliente)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      ...(body.nombre    && { nombre: body.nombre }),
      ...(body.telefono  && { telefono: body.telefono }),
      ...(body.correo    !== undefined && { correo: body.correo || null }),
      ...(body.documento !== undefined && { documento: body.documento || null }),
    },
  })
  return NextResponse.json(cliente)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.cliente.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
