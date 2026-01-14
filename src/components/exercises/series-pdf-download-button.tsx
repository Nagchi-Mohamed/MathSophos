"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SeriesPdfDownloadButtonProps {
  seriesId: string
  seriesTitle: string
  className?: string
}

import { useSession } from "next-auth/react"

export function SeriesPdfDownloadButton({
  seriesId,
  seriesTitle,
  className
}: SeriesPdfDownloadButtonProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const [options, setOptions] = useState({
    exercises: true,  // Énoncé
    hints: true,      // Indices
    solutions: true   // Solution
  })

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return null
  }

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      setIsOpen(false)
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
        const errorData = await response.json().catch(() => ({}));
        console.error("PDF generation failed:", errorData)
        throw new Error(errorData.details || errorData.error || "Erreur lors de la génération du PDF")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `serie-${seriesTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success("PDF téléchargé avec succès")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Impossible de générer le PDF")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          disabled={isLoading}
          className={className}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Télécharger PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="p-2">
          <div className="mb-3">
            <h4 className="font-medium text-sm mb-1">Options du PDF</h4>
            <p className="text-xs text-muted-foreground">
              Sélectionnez les éléments à inclure
            </p>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-accent cursor-pointer"
              onClick={() => setOptions({ ...options, exercises: !options.exercises })}
            >
              <Checkbox
                id="exercises"
                checked={options.exercises}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, exercises: checked === true })
                }
                onClick={(e) => e.stopPropagation()}
              />
              <Label
                htmlFor="exercises"
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Énoncé
              </Label>
            </div>

            <div className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-accent cursor-pointer"
              onClick={() => setOptions({ ...options, hints: !options.hints })}
            >
              <Checkbox
                id="hints"
                checked={options.hints}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, hints: checked === true })
                }
                onClick={(e) => e.stopPropagation()}
              />
              <Label
                htmlFor="hints"
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Indices
              </Label>
            </div>

            <div className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-accent cursor-pointer"
              onClick={() => setOptions({ ...options, solutions: !options.solutions })}
            >
              <Checkbox
                id="solutions"
                checked={options.solutions}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, solutions: checked === true })
                }
                onClick={(e) => e.stopPropagation()}
              />
              <Label
                htmlFor="solutions"
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Solution
              </Label>
            </div>
          </div>

          <DropdownMenuSeparator className="my-2" />

          <Button
            onClick={handleDownload}
            disabled={isLoading || (!options.exercises && !options.hints && !options.solutions)}
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </>
            )}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

