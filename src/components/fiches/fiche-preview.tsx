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

      {/* Render the actual print content component scaled down slightly if needed, or full width */}
      <div className="border shadow-lg mx-auto bg-gray-100 p-8 overflow-auto max-h-[800px]">
        <div className="bg-white mx-auto shadow-sm origin-top transform scale-100" style={{ width: '210mm', minHeight: '297mm' }}>
          <FichePrintContent fiche={previewFiche} />
        </div>
      </div>
    </div>
  )
}
