import { NextRequest, NextResponse } from "next/server"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)

  // Endpoints públicos (auth + configuración pública)
  if (pathname.startsWith("/api/auth")) return NextResponse.next()
  if (pathname === "/api/configuracion/portada" && req.method === "GET") return NextResponse.next()

  // APIs protegidas → 401 si no hay sesión
  if (pathname.startsWith("/api")) {
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    return NextResponse.next()
  }

  // Página de login: si ya hay sesión, mandar al inicio
  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/", req.url))
    return NextResponse.next()
  }

  // Resto de páginas → requieren sesión
  if (!session) {
    const url = new URL("/login", req.url)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  // Pasa la ruta actual al server (para validar permisos de página con datos frescos)
  const headers = new Headers(req.headers)
  headers.set("x-pathname", pathname)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Corre en todo menos estáticos e imágenes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
