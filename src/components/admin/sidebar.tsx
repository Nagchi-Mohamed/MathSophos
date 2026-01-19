"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  FileText,
  Users,
  Settings,
  BarChart3,
  ChevronRight,
  Mail,
  Megaphone,
  MessageSquare,
  Video
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ReportsBadge } from "./reports-badge"

const navigation = [
  { name: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
  { name: "Leçons", href: "/admin/lessons", icon: BookOpen },
  { name: "Exercices", href: "/admin/exercises", icon: Dumbbell },
  { name: "Examens", href: "/admin/exams", icon: FileText },
  { name: "Utilisateurs", href: "/admin/users", icon: Users },
  { name: "Analytique", href: "/admin/analytics", icon: BarChart3 },
  { name: "Paramètres", href: "/admin/settings", icon: Settings },
  { name: "Annonces", href: "/admin/announcements", icon: Megaphone },
  { name: "Forum", href: "/admin/forum", icon: MessageSquare },
  { name: "Signalements", href: "/admin/reports", icon: Mail },
  { name: "Tutoriels", href: "/admin/tutorials", icon: Video },
  { name: "Fiches Pédago", href: "/admin/fiches", icon: FileText },
  { name: "Documents de Référence", href: "/admin/references", icon: BookOpen },
  { name: "Générateur PDF", href: "/admin/pdf-playground", icon: FileText },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="group/sidebar w-16 hover:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col fixed left-0 top-0 transition-all duration-300 ease-in-out z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 overflow-hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            M
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            MathSophos
          </span>
        </Link>
        <div className="mt-2 text-xs font-medium text-gray-500 uppercase tracking-wider opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          Administration
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative group/item",
                isActive
                  ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              )}
              title={item.name}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-400"
              )} />
              <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                {item.name}
              </span>
              {item.href === "/admin/reports" && (
                <ReportsBadge />
              )}
              {isActive && (
                <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400 ml-auto opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300" />
              )}
            </Link>
          )
        })}
      </nav>


    </div>
  )
}
