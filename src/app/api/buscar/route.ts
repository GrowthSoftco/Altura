export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, filtroCotizaciones } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const q = (new URL(req.url).searchParams.get("q") || "").trim()
  if (q.length < 1) return NextResponse.json({ clientes: [], cotizaciones: [] })

  const scope = filtroCotizaciones(me)

  const [clientes, cotizaciones] = await Promise.all([
    me.permClientes
      ? prisma.cliente.findMany({
          where: {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { telefono: { contains: q } },
              { correo: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: { nombre: "asc" },
          select: { id: true, nombre: true, telefono: true },
        })
      : Promise.resolve([]),
    me.permCotizaciones
      ? prisma.cotizacion.findMany({
          where: {
            ...scope,
            OR: [
              { codigo: { contains: q, mode: "insensitive" } },
              { origen: { contains: q, mode: "insensitive" } },
              { destino: { contains: q, mode: "insensitive" } },
              { cliente: { nombre: { contains: q, mode: "insensitive" } } },
            ],
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, codigo: true, origen: true, destino: true, cliente: { select: { nombre: true } } },
        })
      : Promise.resolve([]),
  ])

  return NextResponse.json({ clientes, cotizaciones })
}
