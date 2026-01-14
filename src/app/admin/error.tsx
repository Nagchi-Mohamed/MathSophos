"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Une erreur est survenue</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Impossible de charger le tableau de bord. Veuillez réessayer.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Réessayer
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          Recharger la page
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-900 rounded text-left w-full max-w-2xl overflow-auto">
          <p className="font-mono text-xs text-red-500">{error.message}</p>
          <pre className="mt-2 text-xs text-muted-foreground">{error.stack}</pre>
        </div>
      )}
    </div>
  )
}
