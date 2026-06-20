import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PerfilForm } from "@/components/perfil-form"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">Mi perfil</h1>
        <p className="text-sm text-[#737373] mt-0.5">Gestiona tu cuenta, foto y contraseña.</p>
      </div>

      <PerfilForm
        debeCambiar={user.mustChangePassword}
        isAdmin={user.rol === "ADMIN"}
        usuario={user.usuario}
        nombre={user.nombre || ""}
        rol={user.rol}
        fotoUrl={user.fotoUrl}
      />
    </div>
  )
}
