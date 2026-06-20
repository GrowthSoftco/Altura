export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  const config = await prisma.configuracion.findUnique({ where: { clave: "header_pdf_imagen" } })
  const res = NextResponse.json({ url: config?.valor ?? null })
  res.headers.set("Cache-Control", "no-store")
  return res
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me || me.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { url } = await req.json()
  if (!url || !url.startsWith("http")) return NextResponse.json({ error: "URL inválida" }, { status: 400 })
  await prisma.configuracion.upsert({
    where: { clave: "header_pdf_imagen" },
    update: { valor: url },
    create: { clave: "header_pdf_imagen", valor: url },
  })
  return NextResponse.json({ ok: true })
}
