"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users, Shield, BookOpen } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { AlturaLogo } from "@/components/logo"
import { cn } from "@/lib/utils"

interface Perms {
  inicio: boolean
  cotizaciones: boolean
  clientes: boolean
  usuarios: boolean
}

export function AppSidebar({
  rol, perms, variant,
}: { nombre?: string; usuario?: string; rol: string; perms: Perms; variant?: "sidebar" | "floating" | "inset" }) {
  const pathname = usePathname()

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

  return (
    <Sidebar variant={variant} collapsible="icon" className="bg-[#0F0F0F]">
      <SidebarHeader className="px-5 pt-6 pb-5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <div className="group-data-[collapsible=icon]:hidden">
          <AlturaLogo size="md" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Altura" className="hidden h-7 w-auto mx-auto brightness-0 invert group-data-[collapsible=icon]:block" />
      </SidebarHeader>

      <SidebarContent className="px-3 flex-1 group-data-[collapsible=icon]:px-1.5">
        <p className="px-2 mb-2 text-[10px] font-medium text-[#383838] tracking-[0.18em] uppercase select-none group-data-[collapsible=icon]:hidden">
          Navegación
        </p>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "group/item flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:h-9",
                  active ? "bg-[#1E1E1E] text-[#F2F2F2]" : "text-[#737373] hover:bg-[#191919] hover:text-[#C0C0C0]"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-white" : "text-[#4A4A4A] group-hover/item:text-[#737373]"
                )} />
                <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white group-data-[collapsible=icon]:hidden" />}
              </Link>
            )
          })}
        </nav>
      </SidebarContent>
    </Sidebar>
  )
}
