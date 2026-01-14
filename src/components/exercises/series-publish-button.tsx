"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toggleSeriesVisibility } from "@/actions/series"
import { toast } from "sonner"

interface SeriesPublishButtonProps {
  id: string
  isPublic: boolean
}

export function SeriesPublishButton({ id, isPublic: initialIsPublic }: SeriesPublishButtonProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await toggleSeriesVisibility(id)
      if (result.success) {
        setIsPublic(!isPublic)
        toast.success(isPublic ? "Série dépubliée" : "Série publiée avec succès")
      } else {
        toast.error("Erreur lors de la modification du statut")
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isPublic ? "default" : "secondary"}
      onClick={handleToggle}
      disabled={isLoading}
      className={isPublic ? "bg-green-600 hover:bg-green-700" : ""}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isPublic ? (
        <Eye className="w-4 h-4 mr-2" />
      ) : (
        <EyeOff className="w-4 h-4 mr-2" />
      )}
      {isPublic ? "Publiée" : "Brouillon"}
    </Button>
  )
}
