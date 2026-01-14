"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ModeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {isDark ? (
        <Moon className="h-5 w-5 text-purple-400" />
      ) : (
        <Sun className="h-5 w-5 text-purple-600" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
