import "server-only"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "@/lib/session"

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

/** Contraseña temporal generada por el sistema (sin caracteres ambiguos). Ej: Altura-K7M3PQ */
export function generarPasswordTemporal(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(6)
  let s = ""
  for (let i = 0; i < 6; i++) s += chars[bytes[i] % chars.length]
  return `Altura-${s}`
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/** Lee la sesión desde la cookie (server components / route handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/** Devuelve el usuario completo y fresco desde la BD (permisos actualizados). */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  return prisma.usuario.findUnique({ where: { id: session.sub } })
}

export type UsuarioActual = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

/**
 * Filtro Prisma para cotizaciones según el usuario:
 * - ADMIN: ve todas.
 * - USER: ve las que creó + las compartidas con él.
 */
export function filtroCotizaciones(user: { id: string; rol: string }) {
  if (user.rol === "ADMIN") return {}
  return { OR: [{ creadoPorId: user.id }, { compartidoCon: { has: user.id } }] }
}

/** True si el usuario puede ver/editar una cotización concreta. */
export function puedeAccederCotizacion(
  user: { id: string; rol: string },
  cot: { creadoPorId: string | null; compartidoCon: string[] }
): boolean {
  if (user.rol === "ADMIN") return true
  return cot.creadoPorId === user.id || cot.compartidoCon.includes(user.id)
}
