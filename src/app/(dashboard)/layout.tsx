import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { ForzarCambioPassword } from "@/components/forzar-cambio-password"
import { getCurrentUser } from "@/lib/auth"

// Mapa de prefijo de ruta → permiso requerido
function permParaRuta(pathname: string, u: { permInicio: boolean; permClientes: boolean; permCotizaciones: boolean; permUsuarios: boolean; rol: string }) {
  if (pathname.startsWith("/usuarios")) return u.rol === "ADMIN" || u.permUsuarios
  if (pathname.startsWith("/clientes")) return u.permClientes
  if (pathname.startsWith("/cotizaciones")) return u.permCotizaciones
  if (pathname.startsWith("/dashboard")) return u.permInicio
  if (pathname.startsWith("/perfil")) return true
  if (pathname.startsWith("/bitacora")) return u.rol === "ADMIN"
  return true
}

// Primera ruta permitida (para redirigir si no tiene acceso a la actual)
function primeraRutaPermitida(u: { permInicio: boolean; permClientes: boolean; permCotizaciones: boolean }) {
  if (u.permInicio) return "/dashboard"
  if (u.permCotizaciones) return "/cotizaciones"
  if (u.permClientes) return "/clientes"
  return "/perfil"
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const h = await headers()
  const pathname = h.get("x-pathname") || ""

  if (pathname && !permParaRuta(pathname, user)) {
    redirect(primeraRutaPermitida(user))
  }

  return (
    <SidebarProvider defaultOpen={false} className="bg-[#0A0A0A]">
      <AppSidebar
        variant="inset"
        nombre={user.nombre || user.usuario}
        usuario={user.usuario}
        rol={user.rol}
        perms={{
          inicio: user.permInicio,
          cotizaciones: user.permCotizaciones,
          clientes: user.permClientes,
          usuarios: user.rol === "ADMIN" || user.permUsuarios,
        }}
      />
      <SidebarInset className="bg-[#141414] rounded-xl border border-[#1E1E1E] overflow-hidden h-[calc(100svh-1rem)] flex flex-col">
        <DashboardHeader
          nombre={user.nombre || user.usuario}
          usuario={user.usuario}
          rol={user.rol}
          fotoUrl={user.fotoUrl}
          canCotizar={user.permCotizaciones}
          perms={{
            inicio: user.permInicio,
            cotizaciones: user.permCotizaciones,
            clientes: user.permClientes,
            usuarios: user.rol === "ADMIN" || user.permUsuarios,
          }}
        />
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </SidebarInset>
      <ForzarCambioPassword activo={user.mustChangePassword} />
    </SidebarProvider>
  )
}
