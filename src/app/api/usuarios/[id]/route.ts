export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, hashPassword, generarPasswordTemporal } from "@/lib/auth"

const select = {
  id: true, usuario: true, nombre: true, rol: true, mustChangePassword: true,
  permInicio: true, permClientes: true, permCotizaciones: true, permUsuarios: true, permModificarEstados: true,
  createdAt: true,
} as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser()
    if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const { id } = await params
    const b = await req.json()

    const data: Record<string, unknown> = {}
    if (b.nombre !== undefined) data.nombre = b.nombre || null
    if (b.rol !== undefined) data.rol = b.rol === "ADMIN" ? "ADMIN" : "USER"
    if (b.permInicio !== undefined) data.permInicio = !!b.permInicio
    if (b.permClientes !== undefined) data.permClientes = !!b.permClientes
    if (b.permCotizaciones !== undefined) data.permCotizaciones = !!b.permCotizaciones
    if (b.permUsuarios !== undefined) data.permUsuarios = !!b.permUsuarios
    if (b.permModificarEstados !== undefined) data.permModificarEstados = !!b.permModificarEstados

    // Restablecer contraseña: el sistema genera una nueva temporal
    let tempPassword: string | undefined
    if (b.resetPassword) {
      tempPassword = generarPasswordTemporal()
      data.passwordHash = await hashPassword(tempPassword)
      data.mustChangePassword = true
    }

    const actualizado = await prisma.usuario.update({ where: { id }, data, select })
    return NextResponse.json(tempPassword ? { ...actualizado, tempPassword } : actualizado)
  } catch (err) {
    console.error("PATCH /api/usuarios/[id] error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser()
    if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const { id } = await params
    if (id === me.id) return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })

    // No permitir borrar el último admin
    const target = await prisma.usuario.findUnique({ where: { id } })
    if (target?.rol === "ADMIN") {
      const admins = await prisma.usuario.count({ where: { rol: "ADMIN" } })
      if (admins <= 1) return NextResponse.json({ error: "Debe existir al menos un administrador" }, { status: 400 })
    }

    await prisma.usuario.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/usuarios/[id] error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
