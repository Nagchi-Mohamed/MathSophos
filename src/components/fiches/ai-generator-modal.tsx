'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateFicheInternal } from "@/actions/ai-fiche"
import { toast } from "sonner"
import { Loader2, Sparkles, FileText, Upload } from "lucide-react"

// Create a server action wrapper for the client to call
// We can't import the server action directly if it returns rich objects sometimes without careful serialization?
// Actually we can.

import { FicheContentStep, CreateFicheInput } from "@/actions/fiches"

interface AiGeneratorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerated: (steps: FicheContentStep[]) => void
  metadata: Omit<CreateFicheInput, "content">
}

export function AiGeneratorModal({ open, onOpenChange, onGenerated, metadata }: AiGeneratorModalProps) {
  const [prompt, setPrompt] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast.error("Fichier trop volumineux (Max 4MB)")
        return
      }
      setUploadedFile(file)
      toast.success(`Fichier "${file.name}" chargé`)
    }
  }

  const handleGenerateFromFile = async () => {
    if (!uploadedFile) return

    setIsGenerating(true)
    try {
      // Read file as base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          // Remove data:application/pdf;base64, prefix
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(uploadedFile)
      })

      const base64Data = await base64Promise

      const context = `
        Metadata:
        Teacher: ${metadata.teacherName}
        Level: ${metadata.gradeLevel}
        Stream: ${metadata.stream || "N/A"}
        Lesson: ${metadata.lessonTitle || "N/A"}
        Duration: ${metadata.duration}
        
        File uploaded: ${uploadedFile.name}
        Note: The user has uploaded a file (PDF or Image) containing the source material. Use this content to generate the fiche.
      `

      const filePrompt = `Génère une fiche pédagogique complète pour le niveau ${metadata.gradeLevel} en utilisant le contenu du fichier fourni. 
      Inclus des activités d'initiation, des définitions, des théorèmes, des exemples et des exercices.
      Si des figures sont nécessaires, fournis le code GeoGebra.`

      // Call action with 4 arguments: prompt, context, fileData, mimeType
      const response = await generateFicheWithAIAction(filePrompt, context, base64Data, uploadedFile.type)

      if (response && response.content) {
        const newSteps: FicheContentStep[] = response.content.map((item: any) => ({
          id: crypto.randomUUID(),
          type: item.type,
          duration: item.duration,
          content: item.content,
          observations: item.observations
        }))

        onGenerated(newSteps)
        toast.success("Contenu généré avec succès !")
        setUploadedFile(null)
      }

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erreur lors de la génération")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // Construct a context prompt based on metadata
      const context = `
        Metadata:
        Teacher: ${metadata.teacherName}
        Level: ${metadata.gradeLevel}
        Subject: Math
        Duration: ${metadata.duration}
        Guidelines: ${metadata.pedagogicalGuidelines}
      `

      // We need a specific server action that can accept this and return the object
      // For now, let's assume we use a server action linked here.
      // Since generateFicheInternal is internal, we need an exported action for the client.
      // I'll assume we can call an action that calls generateFicheInternal.

      // Let's create a Client-safe action wrapper in the modal file? No, must be in separate file.
      // I will implement the logic here using a placeholder fetch or action call

      const response = await generateFicheWithAIAction(prompt, context)

      if (response && response.content) {
        // Map response content to FicheContentStep
        const newSteps: FicheContentStep[] = response.content.map((item: any) => ({
          id: crypto.randomUUID(),
          type: item.type,
          duration: item.duration,
          content: item.content, // This might need LaTeX cleanup
          observations: item.observations
        }))

        onGenerated(newSteps)
        toast.success("Contenu généré avec succès !")
      }

    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la génération")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Générateur IA
          </DialogTitle>
          <DialogDescription>
            Décrivez ce que vous voulez ou uploadez un document source.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="prompt">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompt">Instruction</TabsTrigger>
            <TabsTrigger value="file">Fichier (Bientôt)</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4">
            <Textarea
              placeholder="Ex: Génère une activité d'introduction sur les nombres premiers pour des élèves de tronc commun..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[150px]"
            />
            <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full bg-gradient-to-r from-purple-500 to-blue-600 border-0">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Générer
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">Cliquez pour uploader un fichier</p>
                <p className="text-xs text-center mt-1">PDF, Image (PNG, JPG)</p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf, .docx, .jpg, .jpeg, .png, .webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              {uploadedFile && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                    ×
                  </Button>
                </div>
              )}
              <Button
                onClick={handleGenerateFromFile}
                disabled={isGenerating || !uploadedFile}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 border-0"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Générer depuis le fichier
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Temporary Action defined in file? No, Next.js doesn't like that.
// I need to update src/actions/ai-fiche.ts to export a client-callable action.
import { generateFicheAction as generateFicheWithAIAction } from "@/actions/ai-fiche"
