"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { generateLessonContent, generateExerciseContent } from "@/actions/ai-generate"
import { extractTextFromFile } from "@/actions/extract-text"
import { toast } from "sonner"

type AiGeneratorModalProps = {
  mode: "LESSON" | "EXERCISE"
  onGenerate: (data: any) => void
  contexts?: { id: string; name: string }[]
}

export function AiGeneratorModal({ mode, onGenerate, contexts = [] }: AiGeneratorModalProps) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Common fields
  const [topic, setTopic] = useState("")
  const [contextId, setContextId] = useState("")

  // Lesson specific
  const [level, setLevel] = useState("")
  const [instructions, setInstructions] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState("")

  // Exercise specific (difficulty removed)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      const formData = new FormData()
      formData.append("file", selectedFile)

      const result = await extractTextFromFile(formData)
      if (result.text) {
        setExtractedText(result.text)
        setInstructions((prev) => prev + "\n[Document chargé avec succès]")
        toast.success("Document analysé avec succès")
      } else {
        toast.error("Erreur lors de la lecture du fichier")
      }
    }
  }

  const handleGenerate = async () => {
    if (!topic && !extractedText) {
      toast.error("Veuillez fournir un sujet ou un document")
      return
    }

    if (!contextId && contexts.length > 0) {
      toast.error("Veuillez sélectionner un contexte IA")
      return
    }

    setIsGenerating(true)
    try {
      let result

      if (mode === "LESSON") {
        if (!level) {
          toast.error("Veuillez sélectionner un niveau")
          setIsGenerating(false)
          return
        }
        result = await generateLessonContent(topic, level, contextId, instructions, extractedText)
      } else {
        result = await generateExerciseContent(topic, contextId)
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        onGenerate(result)
        setOpen(false)
        toast.success("Contenu généré avec succès")
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-purple-800 dark:hover:bg-purple-900/20 dark:text-purple-300">
          <Wand2 className="h-4 w-4" />
          Générer avec l'IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Générateur {mode === "LESSON" ? "de Leçon" : "d'Exercice"}
          </DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour créer du contenu éducatif rapidement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Sujet</Label>
            <Input
              placeholder={mode === "LESSON" ? "ex: Le Théorème de Pythagore" : "ex: Équations du second degré"}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {mode === "LESSON" && (
            <>
              <div className="space-y-2">
                <Label>Document Source (Optionnel)</Label>
                <Input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                />
                {extractedText && <p className="text-xs text-green-600">Document analysé</p>}
              </div>

              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select onValueChange={setLevel} value={level}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1ère Année Collège">1ère Année Collège</SelectItem>
                    <SelectItem value="2ème Année Collège">2ème Année Collège</SelectItem>
                    <SelectItem value="3ème Année Collège">3ème Année Collège</SelectItem>
                    <SelectItem value="Tronc Commun">Tronc Commun</SelectItem>
                    <SelectItem value="1ère Bac">1ère Bac</SelectItem>
                    <SelectItem value="2ème Bac">2ème Bac</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Contexte IA</Label>
            <Select onValueChange={setContextId} value={contextId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un prompt système" />
              </SelectTrigger>
              <SelectContent>
                {contexts.map((ctx) => (
                  <SelectItem key={ctx.id} value={ctx.id}>{ctx.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "LESSON" && (
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                placeholder="Instructions spécifiques..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
