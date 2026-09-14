'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateFicheAction } from "@/actions/ai-fiche"
import { toast } from "sonner"
import { Loader2, FileText, Upload, Sparkles } from "lucide-react"
import { MathSophosIcon } from "@/components/ui/math-sophos-logo"
import { CreateFicheInput } from "@/actions/fiches"

interface AiGeneratorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerated: (result: {
    metadata: Partial<Omit<CreateFicheInput, "content">>
    sessions: any[]
  }) => void
  metadata: Omit<CreateFicheInput, "content">
}

export function AiGeneratorModal({ open, onOpenChange, onGenerated, metadata }: AiGeneratorModalProps) {
  const [prompt, setPrompt] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 8 * 1024 * 1024) { // 8MB limit
        toast.error("Fichier trop volumineux (Max 8MB)")
        return
      }
      setUploadedFile(file)
      toast.success(`Fichier "${file.name}" prêt`)
    }
  }

  const processAiResponse = (response: any) => {
    if (!response) {
      toast.error("Aucune réponse générée")
      return
    }

    const updatedMetadata: Partial<Omit<CreateFicheInput, "content">> = {
      lessonTitle: response.lessonTitle || metadata.lessonTitle,
      duration: response.duration || metadata.duration,
      capacities: response.capacities || metadata.capacities,
      programContents: response.programContents || metadata.programContents,
      pedagogicalGuidelines: response.pedagogicalGuidelines || metadata.pedagogicalGuidelines,
      prerequisites: response.prerequisites || metadata.prerequisites,
      extensions: response.extensions || metadata.extensions,
      didacticTools: response.didacticTools || metadata.didacticTools,
      bilanSequence: response.bilanSequence || metadata.bilanSequence,
      difficultiesObserved: response.difficultiesObserved || metadata.difficultiesObserved,
      remediationProposed: response.remediationProposed || metadata.remediationProposed,
      observations: response.observations || metadata.observations,
    }

    const sessions = (response.content || []).map((s: any, i: number) => ({
      id: crypto.randomUUID(),
      title: s.title || `Séance ${i + 1}`,
      duration: s.duration || "2 h",
      demarche: s.demarche || s.content || "",
      traceEcrite: s.traceEcrite || s.content || "",
      evaluation: s.evaluation || s.observations || ""
    }))

    onGenerated({ metadata: updatedMetadata, sessions })
    toast.success("Fiche Pédagogique générée avec succès !")
    onOpenChange(false)
  }

  const handleGenerateFromFile = async () => {
    if (!uploadedFile) return

    setIsGenerating(true)
    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(uploadedFile)
      })

      const base64Data = await base64Promise

      const context = `
        Fiche Context:
        Professeur: ${metadata.teacherName}
        Établissement: ${metadata.schoolName}
        Niveau: ${metadata.gradeLevel}
        Filière: ${metadata.stream || "Tronc Commun"}
        Matière: ${metadata.subject || "Mathématiques"}
        
        Source file: ${uploadedFile.name}
      `

      const filePrompt = `Transforme le contenu du fichier uploadé en une Fiche Pédagogique complète conforme au standard du Ministère du Maroc.`

      const response = await generateFicheAction(filePrompt, context, base64Data, uploadedFile.type)
      processAiResponse(response)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erreur lors de la génération")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateFromPrompt = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const context = `
        Fiche Context:
        Professeur: ${metadata.teacherName}
        Établissement: ${metadata.schoolName}
        Niveau: ${metadata.gradeLevel}
        Filière: ${metadata.stream || "Tronc Commun"}
        Matière: ${metadata.subject || "Mathématiques"}
        Titre de la leçon: ${metadata.lessonTitle || "Algèbre et Analyse"}
      `

      const response = await generateFicheAction(prompt, context)
      processAiResponse(response)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erreur lors de la génération")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Générateur de Fiche Pédagogique IA
          </DialogTitle>
          <DialogDescription>
            Uploadez un document source (PDF, Word, Image) ou décrivez votre sujet. L'IA transformera le tout au format LaTeX officiel.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="file">Uploader un Document</TabsTrigger>
            <TabsTrigger value="prompt">Instruction Textuelle</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer border-purple-500/30"
              onClick={() => document.getElementById('fiche-file-upload')?.click()}
            >
              <Upload className="h-10 w-10 text-purple-600 mb-2" />
              <p className="text-sm font-semibold text-foreground text-center">Cliquez pour importer un document</p>
              <p className="text-xs text-muted-foreground text-center mt-1">PDF, Word (.docx), Image (.png, .jpg)</p>
              <input
                id="fiche-file-upload"
                type="file"
                accept=".pdf, .docx, .jpg, .jpeg, .png, .webp"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {uploadedFile && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{uploadedFile.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                  ×
                </Button>
              </div>
            )}

            <Button
              onClick={handleGenerateFromFile}
              disabled={isGenerating || !uploadedFile}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md hover:opacity-95"
              size="lg"
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Transformer en Fiche Pédagogique
            </Button>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4">
            <Textarea
              placeholder="Ex: Génère une fiche pédagogique complète sur l'Arithmétique dans ℕ pour le Tronc Commun Scientifique (durée 7 heures)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[140px]"
            />
            <Button
              onClick={handleGenerateFromPrompt}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md hover:opacity-95"
              size="lg"
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MathSophosIcon size={18} className="mr-2" />}
              Générer la Fiche Pédagogique
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
