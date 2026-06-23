"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { FilePlus, Settings, BookOpen, LogOut, Sun, Moon } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GlobalSearch } from "@/components/global-search"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Perms { inicio: boolean; cotizaciones: boolean; clientes: boolean; usuarios: boolean }

export function DashboardHeader({
  nombre, usuario, rol, canCotizar, perms, fotoUrl,
}: { nombre: string; usuario: string; rol: string; canCotizar: boolean; perms: Perms; fotoUrl?: string | null }) {
  const router = useRouter()
  const inicial = (nombre || usuario || "?").trim().charAt(0).toUpperCase()

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || theme !== "light"

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }

  return (
    <header className="shrink-0 z-10 flex items-center gap-4 h-14 px-5 border-b border-border bg-background">
      <SidebarTrigger className="hidden md:flex h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground transition-colors" />

      <div className="flex-1 flex justify-center">
        <GlobalSearch rol={rol} perms={perms} />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {canCotizar && (
          <Link
            href="/cotizaciones/nueva"
            aria-label="Nueva cotización"
            className="hidden sm:flex items-center gap-2 h-9 pl-3 pr-4 rounded-full bg-[#00B4C5] text-white text-sm font-semibold hover:bg-[#009aaa] transition-colors shadow-sm"
          >
            <FilePlus className="h-4 w-4" />
            <span className="hidden lg:inline">Nueva cotización</span>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#00B4C5]/40 transition-transform hover:scale-105">
            <Avatar className="h-9 w-9">
              {fotoUrl && <AvatarImage src={fotoUrl} alt={nombre} className="object-cover" />}
              <AvatarFallback className="bg-[#1A2035] text-[#00B4C5] text-sm font-bold">{inicial}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-52 bg-popover border-border text-popover-foreground"
          >
            <div className="flex flex-col gap-0.5 px-1.5 py-1.5">
              <span className="text-sm font-medium text-foreground">{nombre}</span>
              <span className="text-[11px] text-muted-foreground">{rol === "ADMIN" ? "Administrador" : "Usuario"}</span>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem render={<Link href="/perfil" />} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Configuración
            </DropdownMenuItem>
            {rol === "ADMIN" && (
              <DropdownMenuItem render={<Link href="/bitacora" />} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Bitácora
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => setTheme(isDark ? "light" : "dark")}
              closeOnClick={false}
              className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
            >
              {isDark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              {isDark ? "Tema claro" : "Tema oscuro"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
