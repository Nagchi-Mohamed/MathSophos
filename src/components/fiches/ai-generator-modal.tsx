'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, FileText, Upload, X } from "lucide-react"
import { MathSophosIcon, MathSophosAiBadge } from "@/components/ui/math-sophos-logo"
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
  const [activeTab, setActiveTab] = useState<"file" | "prompt">("file")
  const [prompt, setPrompt] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Fichier trop volumineux (Max 10MB)")
        return
      }
      setUploadedFile(file)
      toast.success(`Fichier "${file.name}" prêt pour analyse`)
    }
  }

  const triggerFileInput = () => {
    const input = document.getElementById('fiche-file-upload') as HTMLInputElement
    if (input) {
      input.value = ''
      input.click()
    }
  }

  const processAiResponse = (response: any) => {
    if (!response) {
      toast.error("Aucune réponse générée par l'IA")
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
    toast.success("Fiche Pédagogique générée et chargée avec succès !")
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

      const res = await fetch('/api/fiches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: filePrompt,
          context,
          fileData: base64Data,
          mimeType: uploadedFile.type
        })
      })

      const response = await res.json().catch(() => null)
      if (!res.ok || !response?.success || !response?.data) {
        toast.error(response?.error || `Erreur (${res.status}) lors de la génération`)
        return
      }
      processAiResponse(response.data)
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

      const res = await fetch('/api/fiches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context
        })
      })

      const response = await res.json().catch(() => null)
      if (!res.ok || !response?.success || !response?.data) {
        toast.error(response?.error || `Erreur (${res.status}) lors de la génération`)
        return
      }
      processAiResponse(response.data)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erreur lors de la génération")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="ai-generator-modal-description" className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <MathSophosAiBadge size="sm" animate={false} />
            Assistant Fiche Pédagogique MathSophos
          </DialogTitle>
          <DialogDescription id="ai-generator-modal-description" className="text-xs text-muted-foreground mt-1">
            Uploadez un document source (PDF, Word, Image) ou saisissez vos instructions/code LaTeX. L'assistant transformera le tout au format officiel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[calc(90vh-140px)]">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="file" className="text-xs font-semibold">Uploader un Document</TabsTrigger>
              <TabsTrigger value="prompt" className="text-xs font-semibold">Instruction / Code LaTeX</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-0">
              <div
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/30 hover:bg-muted/60 transition-all cursor-pointer border-blue-500/30 hover:border-blue-500/60"
                onClick={triggerFileInput}
              >
                <Upload className="h-9 w-9 text-blue-600 mb-2" />
                <p className="text-sm font-semibold text-foreground text-center">Cliquez pour importer un document</p>
                <p className="text-xs text-muted-foreground text-center mt-1">PDF, Word (.docx), Image (.png, .jpg, .webp)</p>
                <input
                  id="fiche-file-upload"
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {uploadedFile && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs font-medium truncate text-foreground">{uploadedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setUploadedFile(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="prompt" className="space-y-3 mt-0">
              <label className="text-xs font-semibold text-muted-foreground block">
                Instructions ou Code LaTeX brut :
              </label>
              <Textarea
                placeholder="Ex: Génère une fiche pédagogique complète sur l'Arithmétique dans ℕ ou collez un code LaTeX brut..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[160px] max-h-[300px] overflow-y-auto font-mono text-xs p-3 leading-relaxed border-muted-foreground/20"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky Action Footer Bar */}
        <div className="p-4 border-t bg-muted/40 flex justify-end items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>

          {activeTab === "file" ? (
            <Button
              onClick={handleGenerateFromFile}
              disabled={isGenerating || !uploadedFile}
              className="bg-primary text-white shadow-md hover:bg-primary/90 min-w-[200px]"
              size="sm"
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MathSophosIcon size={18} className="mr-2" />}
              Transformer en Fiche
            </Button>
          ) : (
            <Button
              onClick={handleGenerateFromPrompt}
              disabled={isGenerating || !prompt.trim()}
              className="bg-primary text-white shadow-md hover:bg-primary/90 min-w-[200px]"
              size="sm"
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MathSophosIcon size={18} className="mr-2" />}
              Générer la Fiche
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
