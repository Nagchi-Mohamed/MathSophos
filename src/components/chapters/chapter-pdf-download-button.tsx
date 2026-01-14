
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ChapterPdfDownloadButtonProps {
  chapterId: string
  chapterTitle: string
  className?: string
}

import { useSession } from "next-auth/react"

export function ChapterPdfDownloadButton({
  chapterId,
  chapterTitle,
  className
}: ChapterPdfDownloadButtonProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return null
  }

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      toast.info("Génération du PDF du chapitre en cours...")

      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: 'chapter',
          id: chapterId,
          title: chapterTitle
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Erreur lors de la génération");
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `chapitre-${chapterTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success("PDF téléchargé")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Impossible de générer le PDF")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isLoading}
      onClick={handleDownload}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Télécharger PDF
    </Button>
  )
}
