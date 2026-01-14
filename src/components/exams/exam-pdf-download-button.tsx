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

interface ExamPdfDownloadButtonProps {
  examId: string
  examTitle: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

import { useSession } from "next-auth/react"

export function ExamPdfDownloadButton({
  examId,
  examTitle,
  className,
  variant = "secondary",
  size = "default"
}: ExamPdfDownloadButtonProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Default options for exams: usually we print the subject (exercises) or the correction
  // Unlike series where hints are common, exams usually just have Subject vs Correction
  const [options, setOptions] = useState({
    exercises: true,   // Sujet (Énoncé)
    solutions: false   // Correction (Solution)
  })

  // Hide button for non-admin/editor users
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return null
  }

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      setIsOpen(false)
      toast.info("Génération du PDF de l'examen en cours...")

      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: 'exam',
          id: examId,
          title: examTitle,
          includeCorrection: options.solutions,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du PDF")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      // Construct filename based on mode
      const mode = options.solutions ? "correction" : "sujet"
      a.download = `examen-${mode}-${examTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
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

  // Toggle helpers
  const toggleSubject = () => {
    if (options.exercises && !options.solutions) {
      return
    }
    setOptions(prev => ({ ...prev, exercises: !prev.exercises }))
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isLoading}
          className={className}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">PDF</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <div className="p-2">
          <div className="mb-3">
            <h4 className="font-medium text-sm mb-1">Options d'impression</h4>
            <p className="text-xs text-muted-foreground">
              Choisissez le format du document
            </p>
          </div>

          <div className="space-y-2 mb-3">
            {/* Option: SUJET (Exercises) */}
            <div className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-accent cursor-pointer"
              onClick={() => setOptions({ exercises: true, solutions: false })}
            >
              <Checkbox
                id="opt-subject"
                checked={options.exercises && !options.solutions}
                onCheckedChange={() => setOptions({ exercises: true, solutions: false })}
                onClick={(e) => e.stopPropagation()}
              />
              <Label htmlFor="opt-subject" className="text-sm font-normal cursor-pointer flex-1">
                Sujet d'examen (Élève)
              </Label>
            </div>

            {/* Option: CORRIGÉ (Solutions + Exercises usually) */}
            <div className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-accent cursor-pointer"
              onClick={() => setOptions({ exercises: true, solutions: true })}
            >
              <Checkbox
                id="opt-correction"
                checked={options.solutions}
                onCheckedChange={() => setOptions({ exercises: true, solutions: true })}
                onClick={(e) => e.stopPropagation()}
              />
              <Label htmlFor="opt-correction" className="text-sm font-normal cursor-pointer flex-1">
                Corrigé détaillé (Prof)
              </Label>
            </div>
          </div>

          <DropdownMenuSeparator className="my-2" />

          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="w-full"
            size="sm"
          >
            {isLoading ? "Génération..." : "Télécharger"}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
