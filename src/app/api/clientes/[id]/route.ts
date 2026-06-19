export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { logBitacora } from "@/lib/bitacora"

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
  const me = await getCurrentUser()
  await logBitacora("CLIENTE_EDITADO", `Cliente ${cliente.nombre} editado`, me?.id)
  return NextResponse.json(cliente)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "Solo el administrador puede eliminar clientes" }, { status: 403 })
  const { id } = await params
  const cliente = await prisma.cliente.findUnique({ where: { id }, select: { nombre: true } })
  await prisma.cliente.delete({ where: { id } })
  await logBitacora("CLIENTE_ELIMINADO", `Cliente ${cliente?.nombre} eliminado`, me.id)
  return NextResponse.json({ ok: true })
}
