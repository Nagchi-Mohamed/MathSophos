"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DownloadPdfButtonProps {
  url: string
  filename: string
  label?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
}

export function DownloadPdfButton({
  url,
  filename,
  label = "Télécharger PDF",
  variant = "outline",
  className
}: DownloadPdfButtonProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  if (session?.user?.role !== "ADMIN") {
    return null
  }

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      toast.info("Génération du PDF en cours...")

      // Construct full URL if it's relative
      const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: fullUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("PDF generation failed:", errorData)
        throw new Error(errorData.details || errorData.error || "Erreur lors de la génération du PDF")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success("PDF téléchargé avec succès")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de générer le PDF")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      onClick={handleDownload}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  )
}
