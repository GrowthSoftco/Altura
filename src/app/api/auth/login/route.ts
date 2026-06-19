export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/auth"
import { createSessionToken, SESSION_COOKIE } from "@/lib/session"
import { logBitacora } from "@/lib/bitacora"

export async function POST(req: NextRequest) {
  try {
    const { usuario, password } = await req.json()
    if (!usuario || !password) {
      return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 })
    }

    const user = await prisma.usuario.findUnique({ where: { usuario: String(usuario).trim() } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
    }

    const token = await createSessionToken({ sub: user.id, usuario: user.usuario, rol: user.rol })
    await logBitacora("SESION_INICIADA", `${user.nombre || user.usuario} inició sesión`, user.id)

    const res = NextResponse.json({
      ok: true,
      mustChangePassword: user.mustChangePassword,
      nombre: user.nombre,
      rol: user.rol,
    })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })
    return res
  } catch (err) {
    console.error("POST /api/auth/login error:", err)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
