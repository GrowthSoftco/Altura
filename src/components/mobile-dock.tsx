"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users, Shield, FilePlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Perms { inicio: boolean; cotizaciones: boolean; clientes: boolean; usuarios: boolean }

export function MobileDock({ rol, perms, canCotizar }: { rol: string; perms: Perms; canCotizar: boolean }) {
  const pathname = usePathname()

  const items = [
    { href: "/dashboard",    icon: LayoutDashboard, label: "Inicio",   show: perms.inicio },
    { href: "/cotizaciones", icon: FileText,        label: "Cotiz.",   show: perms.cotizaciones },
    { href: "/clientes",     icon: Users,           label: "Clientes", show: perms.clientes },
    { href: "/usuarios",     icon: Shield,          label: "Usuarios", show: rol === "ADMIN" || perms.usuarios },
  ].filter(i => i.show)

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-2xl border border-[#262626] bg-[#1A1A1A]/95 backdrop-blur px-2 py-1.5 shadow-xl shadow-black/40">
      {items.map(item => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-xl px-3.5 py-1.5 transition-colors",
              active ? "bg-[#00B4C5]/15 text-[#22d3ee]" : "text-[#737373] hover:text-[#C0C0C0]"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[9px] font-medium">{item.label}</span>
          </Link>
        )
      })}

      {canCotizar && (
        <Link
          href="/cotizaciones/nueva"
          aria-label="Nueva cotización"
          className="ml-1 flex items-center justify-center h-11 w-11 rounded-xl bg-white text-[#0A0A0A] hover:bg-gray-100 transition-colors shadow-sm"
        >
          <FilePlus className="h-5 w-5" />
        </Link>
      )}
    </nav>
  )
}
