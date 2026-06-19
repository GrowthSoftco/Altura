export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  const config = await prisma.configuracion.findUnique({ where: { clave: "portada_imagen" } })
  if (!config) return NextResponse.json({ url: null })
  return NextResponse.json({ url: config.valor })
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { dataUrl } = await req.json()
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Imagen inválida" }, { status: 400 })
  }

  await prisma.configuracion.upsert({
    where: { clave: "portada_imagen" },
    update: { valor: dataUrl },
    create: { clave: "portada_imagen", valor: dataUrl },
  })
  return NextResponse.json({ ok: true })
}
