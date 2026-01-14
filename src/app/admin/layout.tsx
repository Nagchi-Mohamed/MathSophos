import { AdminSidebar } from "@/components/admin/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <main className="pl-16 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
