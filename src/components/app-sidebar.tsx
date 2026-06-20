"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FilePlus, FileText, Users, Shield, LogOut, UserCog, BookOpen } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlturaLogo } from "@/components/logo"
import { cn } from "@/lib/utils"

interface Perms {
  inicio: boolean
  cotizaciones: boolean
  clientes: boolean
  usuarios: boolean
}

export function AppSidebar({
  nombre, usuario, rol, perms, variant,
}: { nombre: string; usuario: string; rol: string; perms: Perms; variant?: "sidebar" | "floating" | "inset" }) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: "/dashboard",    icon: LayoutDashboard, label: "Inicio",       show: perms.inicio },
    { href: "/cotizaciones", icon: FileText,        label: "Cotizaciones", show: perms.cotizaciones },
    { href: "/clientes",     icon: Users,           label: "Clientes",     show: perms.clientes },
    { href: "/usuarios",     icon: Shield,          label: "Usuarios",     show: perms.usuarios },
    { href: "/bitacora",     icon: BookOpen,        label: "Bitácora",     show: rol === "ADMIN" },
  ].filter(i => i.show)

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href) && href !== "/cotizaciones/nueva"

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }

  const inicial = (nombre || usuario || "?").trim().charAt(0).toUpperCase()

  return (
    <Sidebar variant={variant} className="border-r border-[#1E1E1E] bg-[#0F0F0F]">
      <SidebarHeader className="px-5 pt-6 pb-5">
        <AlturaLogo size="md" />
      </SidebarHeader>

      <SidebarContent className="px-3 flex-1">
        <p className="px-2 mb-2 text-[10px] font-medium text-[#383838] tracking-[0.18em] uppercase select-none">
          Navegación
        </p>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  active ? "bg-[#1E1E1E] text-[#F2F2F2]" : "text-[#737373] hover:bg-[#191919] hover:text-[#C0C0C0]"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-white" : "text-[#4A4A4A] group-hover:text-[#737373]"
                )} />
                <span className="font-medium">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
              </Link>
            )
          })}
        </nav>

        {perms.cotizaciones && (
          <div className="mt-5">
            <Link
              href="/cotizaciones/nueva"
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                "bg-white text-[#00B4C5] hover:bg-gray-100 shadow-md shadow-black/15"
              )}
            >
              <FilePlus className="h-4 w-4 shrink-0" />
              Nueva Cotización
            </Link>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-[#1A1A1A] space-y-1">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#191919] transition-colors group"
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-[#1A2035] text-[#00B4C5] text-[11px] font-bold">{inicial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium text-[#C0C0C0] truncate">{nombre}</span>
            <span className="text-[10px] text-[#383838]">{rol === "ADMIN" ? "Administrador" : "Usuario"}</span>
          </div>
          <UserCog className="h-3.5 w-3.5 text-[#383838] group-hover:text-[#737373]" />
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-[#737373] hover:bg-[#191919] hover:text-red-400 transition-colors text-xs font-medium"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
