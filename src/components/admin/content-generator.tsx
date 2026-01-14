"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TiptapEditor } from "@/components/admin/tiptap-editor"
import { generateLessonContent, type ModelConfig } from "@/actions/ai-generate"
import { extractTextFromFile } from "@/actions/extract-text"
import { Loader2, Sparkles, Bot } from "lucide-react"
import { toast } from "sonner"
import { ImageUploadButton } from "@/components/admin/image-upload-button"

export default function ContentGenerator({ contexts }: { contexts: { id: string, name: string }[] }) {
  const [topic, setTopic] = useState("")
  const [level, setLevel] = useState("")
  const [contextId, setContextId] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState("")

  // Model selection state
  const [modelProvider, setModelProvider] = useState<string>("google")
  const [modelId, setModelId] = useState<string>("gemini-2.5-flash")

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
    if ((!topic && !extractedText) || !level || !contextId) {
      toast.error("Veuillez remplir les champs obligatoires (Sujet ou Document, Niveau, Contexte).")
      return
    }

    setIsGenerating(true)
    try {
      const modelConfig: ModelConfig = {
        provider: modelProvider as 'google' | 'openai' | 'anthropic',
        modelId: modelId
      }

      const result = await generateLessonContent(topic, level, contextId, instructions, extractedText, modelConfig)

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setContent(result.data)
        toast.success("Contenu généré avec succès")
      }
    } catch (e) {
      toast.error("Une erreur est survenue.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleModelChange = (value: string) => {
    const [provider, id] = value.split(':')
    setModelProvider(provider)
    setModelId(id)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de Génération</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modèle IA</Label>
            <Select onValueChange={handleModelChange} defaultValue="google:gemini-2.5-flash">
              <SelectTrigger>
                <SelectValue placeholder="Choisir un modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google:gemini-2.5-flash">Google Gemini 2.5 Flash (Rapide & Stable)</SelectItem>
                <SelectItem value="openai:gpt-4o">OpenAI GPT-4o (Puissant)</SelectItem>
                <SelectItem value="openai:gpt-4o-mini">OpenAI GPT-4o Mini (Économique)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sujet de la leçon</Label>
            <Input
              placeholder="ex: Le Théorème de Pythagore"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Document Source (Optionnel)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && <span className="text-xs text-green-600 font-medium">Chargé</span>}
            </div>
            <p className="text-xs text-muted-foreground">PDF ou TXT pour baser la leçon sur un document.</p>
          </div>

          <div className="space-y-2">
            <Label>Niveau Scolaire</Label>
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

          <div className="space-y-2">
            <Label>Instructions Supplémentaires</Label>
            <Textarea
              placeholder="ex: Inclure beaucoup d'exemples pratiques..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer le contenu
              </>
            )}
          </Button>
        </CardContent >
      </Card >

      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Éditeur de Contenu</CardTitle>
          <ImageUploadButton
            folder="generated"
            onImageUploaded={(latexCode) => {
              setContent(prev => prev + "\n" + latexCode);
              toast.success("Image ajoutée");
            }}
          />
        </CardHeader>
        <CardContent className="flex-1 min-h-[500px]">
          <TiptapEditor content={content} onChange={setContent} />
        </CardContent>
      </Card>
    </div >
  )
}
