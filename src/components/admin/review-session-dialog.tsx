"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Wand2, Check, X, FileText, Image as ImageIcon, AlertTriangle, ArrowRight } from "lucide-react"
import { reviewLessonContent } from "@/actions/ai-reviewer"
import { toast } from "sonner"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface ReviewSessionDialogProps {
  currentContent: string
  lessonMetadata: {
    title: string
    gradeLevel: string
    stream?: string
    subject?: string
  }
  onConfirm: (newContent: string) => void
}

export function ReviewSessionDialog({ currentContent, lessonMetadata, onConfirm }: ReviewSessionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"input" | "processing" | "review">("input")

  // Input State
  const [guidelines, setGuidelines] = useState("")
  const [userInstructions, setUserInstructions] = useState("")
  const [selectedImages, setSelectedImages] = useState<string[]>([]) // Base64 strings

  // Result State
  const [refinedContent, setRefinedContent] = useState("")
  const [changesReport, setChangesReport] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedImages(prev => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const startReview = async () => {
    setStep("processing")
    setError(null)

    try {
      const result = await reviewLessonContent({
        currentContent,
        metadata: lessonMetadata,
        guidelines,
        guidelinesImages: selectedImages,
        userInstructions
      })

      if (result.success && result.data) {
        setRefinedContent(result.data.refinedContent)
        setChangesReport(result.data.changesReport)
        setStep("review")
      } else {
        setError(result.error || "Une erreur inconnue est survenue.")
        setStep("input")
      }
    } catch (e) {
      setError("Erreur critique lors de la communication avec le serveur.")
      setStep("input")
    }
  }

  const handleConfirm = () => {
    onConfirm(refinedContent)
    setIsOpen(false)
    toast.success("Contenu mis à jour avec les corrections de l'IA")

    // Reset state after close
    setTimeout(() => {
      setStep("input")
      setRefinedContent("")
      setChangesReport([])
      setGuidelines("")
      setSelectedImages([])
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-800 dark:hover:bg-purple-900/20">
          <Wand2 className="w-4 h-4 text-purple-600" />
          Révision IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wand2 className="w-5 h-5 text-purple-600" />
            Révision Pédagogique Assistée par IA
          </DialogTitle>
          <DialogDescription>
            Analysez et validez la conformité de la leçon avec les Orientations Pédagogiques.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-0 bg-gray-50/50 dark:bg-gray-950/50">
          {step === "input" && (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <Alert className="bg-blue-50/50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-300">
                  <AlertTitle>Configuration de la révision</AlertTitle>
                  <AlertDescription>
                    L'IA agira comme un inspecteur pédagogique. Fournissez autant de contexte que possible pour garantir la conformité.
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-base font-semibold">1. Orientations Pédagogiques</Label>
                    <p className="text-sm text-gray-500">Copiez-collez les extraits pertinents des directives officielles pour ce niveau/chapitre.</p>
                    <Textarea
                      placeholder="Ex: Pour le niveau 1ère Bac Sc. Math, l'introduction des limites doit se faire par..."
                      className="min-h-[150px]"
                      value={guidelines}
                      onChange={(e) => setGuidelines(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-base font-semibold">2. Documents de référence (Images)</Label>
                    <p className="text-sm text-gray-500">Vous pouvez aussi uploader des captures d'écran des programmes officiels.</p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="w-full"
                      />
                    </div>
                    {selectedImages.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-2">
                        {selectedImages.map((img, idx) => (
                          <div key={idx} className="relative group flex-shrink-0">
                            <img src={img} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-base font-semibold">3. Instructions Spécifiques</Label>
                    <Textarea
                      placeholder="Ex: Vérifie surtout que la définition de la continuité est bien celle du programme..."
                      value={userInstructions}
                      onChange={(e) => setUserInstructions(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {step === "processing" && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                <Loader2 className="w-16 h-16 animate-spin text-purple-600 relative z-10" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-semibold">Analyse en cours...</h3>
                <p className="text-gray-500">
                  L'IA "Inspecteur" analyse votre leçon et la compare aux orientations fournies. Cette opération peut prendre jusqu'à 60 secondes.
                </p>
                <div className="text-xs text-gray-400 pt-4">
                  Modèle: Gemini 2.5 Flash (Multimodal)
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                  {/* Left: Report & Controls */}
                  <ResizablePanel defaultSize={30} minSize={20} className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                    <div className="h-full flex flex-col">
                      <div className="p-4 border-b bg-purple-50/50 dark:bg-purple-900/10">
                        <h4 className="font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300">
                          <FileText className="w-4 h-4" />
                          Rapport de modifications
                        </h4>
                      </div>
                      <ScrollArea className="flex-1 p-4">
                        {changesReport.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            Aucune modification nécessaire détectée. Votre leçon semble conforme !
                          </div>
                        ) : (
                          <ul className="space-y-3">
                            {changesReport.map((change, i) => (
                              <li key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <div className="mt-0.5 min-w-5">
                                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                                    {i + 1}
                                  </span>
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">{change}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </ScrollArea>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle />

                  {/* Right: Content Comparison (Simple View for now) */}
                  <ResizablePanel defaultSize={70}>
                    <div className="h-full flex flex-col">
                      <Tabs defaultValue="refined" className="flex-1 flex flex-col">
                        <div className="border-b px-4 flex items-center justify-between bg-white dark:bg-gray-900">
                          <TabsList className="my-2">
                            <TabsTrigger value="refined" className="gap-2">
                              <Wand2 className="w-3 h-3" />
                              Contenu Révisé
                            </TabsTrigger>
                            <TabsTrigger value="original" className="gap-2 text-gray-500">
                              Original
                            </TabsTrigger>
                          </TabsList>
                          <div className="text-xs text-muted-foreground">
                            Vérifiez le formatage LaTeX dans l'aperçu avant de confirmer.
                          </div>
                        </div>
                        <TabsContent value="refined" className="flex-1 p-0 m-0 relative">
                          <Textarea
                            className="h-full w-full p-4 resize-none border-0 focus-visible:ring-0 font-mono text-sm"
                            readOnly
                            value={refinedContent}
                          />
                        </TabsContent>
                        <TabsContent value="original" className="flex-1 p-0 m-0 relative">
                          <Textarea
                            className="h-full w-full p-4 resize-none border-0 focus-visible:ring-0 font-mono text-sm bg-gray-50/50"
                            readOnly
                            value={currentContent}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          {step === "input" && (
            <Button onClick={startReview} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
              <Wand2 className="w-4 h-4 mr-2" />
              Lancer l'analyse (IA)
            </Button>
          )}

          {step === "review" && (
            <div className="flex w-full justify-between items-center">
              <Button variant="ghost" onClick={() => setStep("input")}>
                Retour
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white">
                  <Check className="w-4 h-4 mr-2" />
                  Confirmer et Appliquer
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
