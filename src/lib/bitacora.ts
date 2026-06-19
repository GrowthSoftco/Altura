import "server-only"
import { prisma } from "@/lib/prisma"

export async function logBitacora(
  tipo: string,
  descripcion: string,
  usuarioId?: string | null,
  meta?: Record<string, unknown>
) {
  try {
    await prisma.bitacora.create({
      data: { tipo, descripcion, usuarioId: usuarioId || null, meta: meta ? (meta as never) : undefined },
    })
    // Limpiar entradas > 3 meses automáticamente
    const hace3Meses = new Date()
    hace3Meses.setMonth(hace3Meses.getMonth() - 3)
    await prisma.bitacora.deleteMany({ where: { creadoEn: { lt: hace3Meses } } })
  } catch {
    // No interrumpir la operación principal si falla el log
  }
}
