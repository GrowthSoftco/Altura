export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  const u = await getCurrentUser()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  return NextResponse.json({
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    fotoUrl: u.fotoUrl,
    rol: u.rol,
    permModificarEstados: u.permModificarEstados,
    perms: {
      inicio: u.permInicio,
      cotizaciones: u.permCotizaciones,
      clientes: u.permClientes,
      usuarios: u.permUsuarios,
      modificarEstados: u.permModificarEstados,
    },
  })
}
