"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always true for forced dark mode
  const isDark = true
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Force dark mode class
    document.documentElement.classList.add('dark')
  }, [])

  // Toggle does nothing now
  const toggleTheme = () => { }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
