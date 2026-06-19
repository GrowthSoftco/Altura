export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// Devuelve la lista de usuarios (para elegir) y con quién está compartida.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const { id } = await params

  const [cot, usuarios] = await Promise.all([
    prisma.cotizacion.findUnique({ where: { id }, select: { compartidoCon: true, creadoPorId: true } }),
    prisma.usuario.findMany({ where: { rol: "USER" }, select: { id: true, usuario: true, nombre: true }, orderBy: { createdAt: "asc" } }),
  ])
  if (!cot) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ compartidoCon: cot.compartidoCon, creadoPorId: cot.creadoPorId, usuarios })
}

// Reemplaza la lista de usuarios con acceso compartido.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const { id } = await params
  const { usuarioIds } = await req.json()
  const ids = Array.isArray(usuarioIds) ? usuarioIds.filter((x) => typeof x === "string") : []

  const cot = await prisma.cotizacion.update({
    where: { id },
    data: { compartidoCon: ids },
    select: { compartidoCon: true },
  })
  return NextResponse.json(cot)
}
