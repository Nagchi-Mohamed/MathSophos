"use client"

import { CreateFicheInput, FicheContentStep } from "@/actions/fiches"
import { FichePrintContent } from "@/components/fiches/fiche-print-content"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FichePreviewProps {
  metadata: Omit<CreateFicheInput, "content">
  steps: FicheContentStep[]
}

export function FichePreview({ metadata, steps }: FichePreviewProps) {
  // Construct a temporary fiche object from metadata and steps
  const previewFiche = {
    ...metadata,
    content: steps, // Pass array directly, FichePrintContent handles it
    id: "preview",
    userId: "preview",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "DRAFT",
    isPublic: false
  }

  return (
    <div className="space-y-6 mx-auto w-full">
      <Alert className="bg-blue-50 text-blue-800 border-blue-200 max-w-4xl mx-auto">
        <AlertDescription>
          Ceci est un aperçu fidèle du document généré. La mise en page finale (PDF) respectera les marges d'impression.
        </AlertDescription>
      </Alert>

      {/* Render the actual print content component as discrete A4 sheets */}
      <div className="border shadow-inner mx-auto bg-slate-200/90 dark:bg-slate-900/80 p-4 md:p-8 overflow-auto max-h-[850px] rounded-xl flex flex-col items-center">
        <FichePrintContent fiche={previewFiche} />
      </div>
    </div>
  )
}
