"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"
import { LanguageProvider } from "@/contexts/language-context"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress auth errors in console during development
    const originalError = console.error
    console.error = (...args) => {
      if (
        args[0]?.toString().includes("ClientFetchError") ||
        args[0]?.toString().includes("Unexpected token '<'") ||
        args[0]?.toString().includes("autherror")
      ) {
        // Silently ignore auth fetch errors during initial load
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SessionProvider>
  )
}
