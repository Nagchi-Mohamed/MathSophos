"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import { markReportResolved } from "@/actions/reports"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface MarkReportResolvedButtonProps {
  reportId: string
}

export function MarkReportResolvedButton({ reportId }: MarkReportResolvedButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleMarkResolved = async () => {
    try {
      setIsLoading(true)
      const result = await markReportResolved(reportId)
      
      if (result.success) {
        toast.success("Signalement marqué comme résolu")
        router.refresh()
      } else {
        toast.error("Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Error marking report as resolved:", error)
      toast.error("Une erreur s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleMarkResolved}
      size="sm"
      variant="outline"
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Traitement...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          Marquer comme résolu
        </>
      )}
    </Button>
  )
}

