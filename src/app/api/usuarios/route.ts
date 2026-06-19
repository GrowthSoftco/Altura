export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, hashPassword, generarPasswordTemporal } from "@/lib/auth"

const select = {
  id: true, usuario: true, nombre: true, rol: true, mustChangePassword: true,
  permInicio: true, permClientes: true, permCotizaciones: true, permUsuarios: true, permModificarEstados: true,
  createdAt: true,
} as const

export async function GET() {
  const me = await getCurrentUser()
  if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const usuarios = await prisma.usuario.findMany({ select, orderBy: { createdAt: "asc" } })
  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser()
    if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const b = await req.json()
    const usuario = String(b.usuario || "").trim()
    if (!usuario) {
      return NextResponse.json({ error: "El usuario es requerido" }, { status: 400 })
    }
    const existe = await prisma.usuario.findUnique({ where: { usuario } })
    if (existe) return NextResponse.json({ error: "Ese usuario ya existe" }, { status: 409 })

    // El sistema genera la contraseña temporal; el usuario la cambia al ingresar.
    const tempPassword = generarPasswordTemporal()

    const nuevo = await prisma.usuario.create({
      data: {
        usuario,
        nombre: b.nombre || null,
        passwordHash: await hashPassword(tempPassword),
        rol: b.rol === "ADMIN" ? "ADMIN" : "USER",
        mustChangePassword: true,
        permInicio: b.permInicio ?? true,
        permClientes: b.permClientes ?? true,
        permCotizaciones: b.permCotizaciones ?? true,
        permUsuarios: b.permUsuarios ?? false,
        permModificarEstados: b.permModificarEstados ?? true,
      },
      select,
    })
    return NextResponse.json({ ...nuevo, tempPassword }, { status: 201 })
  } catch (err) {
    console.error("POST /api/usuarios error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
