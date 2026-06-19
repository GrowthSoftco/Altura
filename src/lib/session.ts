import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "altura-dev-secret-cambiar-en-produccion"
)

export const SESSION_COOKIE = "altura_session"

export type Rol = "ADMIN" | "USER"

export interface SessionPayload {
  sub: string       // id del usuario
  usuario: string   // identificador de login
  rol: Rol
}

/** Firma un JWT de sesión (válido 7 días). */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ usuario: payload.usuario, rol: payload.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

/** Verifica un token y devuelve el payload, o null si es inválido/expirado. */
export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    if (!payload.sub) return null
    return { sub: payload.sub, usuario: payload.usuario as string, rol: payload.rol as Rol }
  } catch {
    return null
  }
}
