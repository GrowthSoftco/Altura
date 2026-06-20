export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.fotoUrl !== undefined) {
    const url = String(body.fotoUrl || "").trim()
    if (url && !url.startsWith("http")) {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 })
    }
    data.fotoUrl = url || null
  }
  if (body.nombre !== undefined) {
    data.nombre = String(body.nombre || "").trim() || null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
  }

  const actualizado = await prisma.usuario.update({
    where: { id: me.id },
    data,
    select: { id: true, usuario: true, nombre: true, fotoUrl: true, rol: true },
  })
  return NextResponse.json(actualizado)
}
