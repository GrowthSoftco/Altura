import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  const clientes = await prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nombre:   { contains: q, mode: "insensitive" } },
            { telefono: { contains: q } },
            { correo:   { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const cliente = await prisma.cliente.create({
    data: {
      nombre:    body.nombre,
      telefono:  body.telefono,
      correo:    body.correo    || null,
      documento: body.documento || null,
    },
  })
  return NextResponse.json(cliente, { status: 201 })
}
