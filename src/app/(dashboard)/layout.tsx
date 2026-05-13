import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-[#141414]">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center h-12 px-5 border-b border-[#1E1E1E] bg-[#141414]/95 backdrop-blur-sm">
          <SidebarTrigger className="h-7 w-7 text-[#4A4A4A] hover:text-[#C0C0C0] transition-colors" />
        </header>
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </SidebarProvider>
  )
}
