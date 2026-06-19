import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { UsuariosManager } from "@/components/usuarios-manager"

export const dynamic = "force-dynamic"

export default async function UsuariosPage() {
  const me = await getCurrentUser()
  if (!me) redirect("/login")
  if (me.rol !== "ADMIN") redirect("/dashboard")

  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true, usuario: true, nombre: true, rol: true, mustChangePassword: true,
      permInicio: true, permClientes: true, permCotizaciones: true, permUsuarios: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#F2F2F2] tracking-tight">Usuarios</h1>
        <p className="text-sm text-[#737373] mt-0.5">Crea cuentas y controla a qué páginas accede cada una.</p>
      </div>
      <UsuariosManager usuariosIniciales={usuarios} miId={me.id} />
    </div>
  )
}
