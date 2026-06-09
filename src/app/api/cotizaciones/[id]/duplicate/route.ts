export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generarCodigoCotizacion } from "@/lib/calculos"

// Json nullable: convierte null/undefined al sentinel de Prisma
const jOrNull = (v: unknown) =>
  v === null || v === undefined ? Prisma.JsonNull : (v as Prisma.InputJsonValue)

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const orig = await prisma.cotizacion.findUnique({ where: { id } })
    if (!orig) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const codigo = await generarCodigoCotizacion(prisma)

    // Copiar todos los campos menos los únicos / timestamps
    const {
      id: _id,
      codigo: _codigo,
      fechaCreacion: _fc,
      createdAt: _ca,
      updatedAt: _ua,
      ...rest
    } = orig

    const nueva = await prisma.cotizacion.create({
      data: {
        ...rest,
        codigo,
        estado: "COTIZADA",
        servicios:  rest.servicios as Prisma.InputJsonValue,
        planPagos:  rest.planPagos as Prisma.InputJsonValue,
        tramos:     jOrNull(rest.tramos),
        itinerario: jOrNull(rest.itinerario),
        hospedaje:  jOrNull(rest.hospedaje),
      },
      include: { cliente: true },
    })
    return NextResponse.json(nueva, { status: 201 })
  } catch (err) {
    console.error("POST /api/cotizaciones/[id]/duplicate error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
