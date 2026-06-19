export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { actual, nueva } = await req.json()
    if (!nueva || String(nueva).length < 6) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }
    if (!(await verifyPassword(actual || "", user.passwordHash))) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 })
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(nueva), mustChangePassword: false },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/auth/change-password error:", err)
    return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 })
  }
}
