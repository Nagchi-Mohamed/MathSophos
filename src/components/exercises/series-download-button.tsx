"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, FileDown, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface SeriesDownloadButtonProps {
  seriesId: string
  seriesTitle: string
}

export function SeriesDownloadButton({ seriesId, seriesTitle }: SeriesDownloadButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState({
    exercises: true,
    hints: true,
    solutions: true,
  })

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      toast.info("Génération du PDF en cours...")

      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: 'series',
          id: seriesId,
          title: seriesTitle,
          includeHints: options.hints,
          includeCorrection: options.solutions
        }),
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
      a.download = `${seriesTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success("PDF téléchargé avec succès", {
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      })
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Impossible de générer le PDF. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
          size="sm"
        >
          <FileDown className="w-4 h-4" />
          Télécharger PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Options de téléchargement</DialogTitle>
          <DialogDescription>
            Choisissez les éléments à inclure dans le PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exercises"
              checked={options.exercises}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, exercises: !!checked }))}
            />
            <Label htmlFor="exercises">Énoncés des exercices</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hints"
              checked={options.hints}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, hints: !!checked }))}
            />
            <Label htmlFor="hints">Indices</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="solutions"
              checked={options.solutions}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, solutions: !!checked }))}
            />
            <Label htmlFor="solutions">Solutions détaillées</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isLoading || (!options.exercises && !options.hints && !options.solutions)}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Générer et Télécharger
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
