import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PerfilForm } from "@/components/perfil-form"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">Mi perfil</h1>
        <p className="text-sm text-[#737373] mt-0.5">Gestiona tu cuenta y contraseña.</p>
      </div>

      <div className="rounded-xl border border-[#222222] bg-[#1C1C1C] p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[#737373]">Usuario</span>
          <span className="text-[#F2F2F2] font-medium">{user.usuario}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#737373]">Nombre</span>
          <span className="text-[#F2F2F2] font-medium">{user.nombre || "—"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#737373]">Rol</span>
          <span className="text-[#F2F2F2] font-medium">{user.rol === "ADMIN" ? "Administrador" : "Usuario"}</span>
        </div>
      </div>

      <PerfilForm debeCambiar={user.mustChangePassword} isAdmin={user.rol === "ADMIN"} />
    </div>
  )
}
