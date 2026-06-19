export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const hace3Meses = new Date()
  hace3Meses.setMonth(hace3Meses.getMonth() - 3)

  const entradas = await prisma.bitacora.findMany({
    where: { creadoEn: { gte: hace3Meses } },
    orderBy: { creadoEn: "desc" },
    include: { usuario: { select: { nombre: true, usuario: true } } },
    take: 500,
  })
  return NextResponse.json(entradas)
}
