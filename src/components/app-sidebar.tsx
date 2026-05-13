"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FilePlus, FileText, Users } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlturaLogo } from "@/components/logo"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Inicio",       dot: "bg-emerald-500" },
  { href: "/cotizaciones", icon: FileText,         label: "Cotizaciones", dot: "bg-[#4F6EF7]"  },
  { href: "/clientes",     icon: Users,            label: "Clientes",     dot: "bg-violet-500"  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href) && href !== "/cotizaciones/nueva"

  return (
    <Sidebar className="border-r border-[#1E1E1E] bg-[#0F0F0F]">

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
                  active
                    ? "bg-[#1E1E1E] text-[#F2F2F2]"
                    : "text-[#737373] hover:bg-[#191919] hover:text-[#C0C0C0]"
                )}
              >
                <span className={cn(
                  "h-[7px] w-[7px] rounded-full shrink-0 transition-opacity",
                  item.dot,
                  active ? "opacity-100" : "opacity-30 group-hover:opacity-60"
                )} />
                <span className="font-medium">{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#4F6EF7]" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-5">
          <Link
            href="/cotizaciones/nueva"
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
              pathname === "/cotizaciones/nueva"
                ? "bg-[#4F6EF7] text-white shadow-lg shadow-[#4F6EF7]/20"
                : "bg-[#4F6EF7] text-white hover:bg-[#6B85F9] shadow-md shadow-[#4F6EF7]/15"
            )}
          >
            <FilePlus className="h-4 w-4 shrink-0" />
            Nueva Cotización
          </Link>
        </div>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-[#1E2A4A] text-[#4F6EF7] text-[11px] font-bold">
              A
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-[#C0C0C0] truncate">Altura Agencia</span>
            <span className="text-[10px] text-[#383838]">v1.0</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
