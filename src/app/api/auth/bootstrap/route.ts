export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generarPasswordTemporal } from "@/lib/auth"

const ADMIN_USUARIO = "camilo@agenciadeviajesaltura.com"

/**
 * Crea el usuario administrador inicial. Solo funciona si NO existe ya el admin.
 * Devuelve la contraseña temporal una única vez.
 */
export async function POST() {
  try {
    const existing = await prisma.usuario.findUnique({ where: { usuario: ADMIN_USUARIO } })
    if (existing) {
      return NextResponse.json({ created: false, message: "El administrador ya existe." })
    }

    const temp = generarPasswordTemporal()
    await prisma.usuario.create({
      data: {
        usuario: ADMIN_USUARIO,
        nombre: "Camilo Correa",
        passwordHash: await hashPassword(temp),
        rol: "ADMIN",
        mustChangePassword: true,
        permInicio: true,
        permClientes: true,
        permCotizaciones: true,
        permUsuarios: true,
      },
    })

    return NextResponse.json({
      created: true,
      usuario: ADMIN_USUARIO,
      tempPassword: temp,
      message: "Administrador creado. Guarda esta contraseña temporal; deberá cambiarla al ingresar.",
    })
  } catch (err) {
    console.error("POST /api/auth/bootstrap error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
