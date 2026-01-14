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
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Wand2, Check, AlertTriangle, FileJson, ArrowRight } from "lucide-react"
import { reviewSeriesContent } from "@/actions/ai-reviewer"
import { toast } from "sonner"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface Exercise {
  id: string
  problemTextFr: string
  solutionFr: string
  hints: string[]
}

interface ReviewSeriesDialogProps {
  currentExercises: Exercise[]
  lessonId: string
  onConfirm: (newExercises: Exercise[]) => void
}

export function ReviewSeriesDialog({ currentExercises, lessonId, onConfirm }: ReviewSeriesDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"input" | "processing" | "review">("input")

  // Input State
  const [guidelines, setGuidelines] = useState("")
  const [userInstructions, setUserInstructions] = useState("")

  // Result State
  const [refinedExercises, setRefinedExercises] = useState<Exercise[]>([])
  const [changesReport, setChangesReport] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const startReview = async () => {
    if (!lessonId) {
      toast.error("Impossible de lancer la révision : Leçon parente introuvable.")
      return;
    }

    setStep("processing")
    setError(null)

    try {
      const result = await reviewSeriesContent({
        exercises: currentExercises,
        lessonId: lessonId,
        guidelines,
        userInstructions
      })

      if (result.success && result.data) {
        setRefinedExercises(result.data.refinedExercises)
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
    // Preserve IDs from original if AI removed them (though AI is instructed not to)
    // We trust AI output mostly, but just in case of slight shifts, we take the new list fully.
    onConfirm(refinedExercises)
    setIsOpen(false)
    toast.success("Série mise à jour avec les corrections de l'IA")

    setTimeout(() => {
      setStep("input")
      setRefinedExercises([])
      setChangesReport([])
      setGuidelines("")
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-900/20">
          <Wand2 className="w-4 h-4 text-indigo-600" />
          Révision Série (IA)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wand2 className="w-5 h-5 text-indigo-600" />
            Révision de Série par IA
          </DialogTitle>
          <DialogDescription>
            Vérifiez l'alignement des exercices avec la leçon et corrigez les erreurs mathématiques.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-0 bg-gray-50/50 dark:bg-gray-950/50">
          {step === "input" && (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6 max-w-2xl mx-auto">
                <Alert className="bg-indigo-50/50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-900 dark:text-indigo-300">
                  <AlertTitle>Contexte d'Analyse</AlertTitle>
                  <AlertDescription>
                    L'IA va lire le contenu complet de la leçon associée (depuis la base de données) pour vérifier que ces {currentExercises.length} exercices sont pertinents et corrects.
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
                    <Label className="text-base font-semibold">1. Instructions Spécifiques</Label>
                    <p className="text-sm text-gray-500">Ex: "Vérifie surtout le calcul de la dérivée dans l'exercice 3"</p>
                    <Textarea
                      placeholder="Instructions pour l'IA..."
                      className="min-h-[100px]"
                      value={userInstructions}
                      onChange={(e) => setUserInstructions(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-base font-semibold">2. Directives Générales (Optionnel)</Label>
                    <Textarea
                      placeholder="Ex: Utiliser telle notation pour les vecteurs..."
                      value={guidelines}
                      onChange={(e) => setGuidelines(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {step === "processing" && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                <Loader2 className="w-16 h-16 animate-spin text-indigo-600 relative z-10" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-semibold">Analyse Mathématique en cours...</h3>
                <p className="text-gray-500">
                  L'IA vérifie la cohérence Leçon-Exercices et recalcule les solutions.
                </p>
                <div className="text-xs text-gray-400 pt-4">
                  Modèle: Gemini 2.5 Flash
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                  {/* Left: Report */}
                  <ResizablePanel defaultSize={30} minSize={20} className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                    <div className="h-full flex flex-col">
                      <div className="p-4 border-b bg-indigo-50/50 dark:bg-indigo-900/10">
                        <h4 className="font-semibold flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                          <FileJson className="w-4 h-4" />
                          Rapport d'analyse
                        </h4>
                      </div>
                      <ScrollArea className="flex-1 p-4">
                        <ul className="space-y-3">
                          {changesReport.map((change, i) => (
                            <li key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                              <div className="mt-0.5 min-w-5">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                                  {i + 1}
                                </span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{change}</span>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle />

                  {/* Right: JSON Diff Preview */}
                  <ResizablePanel defaultSize={70}>
                    <div className="h-full flex flex-col">
                      <Tabs defaultValue="refined" className="flex-1 flex flex-col">
                        <div className="border-b px-4 flex items-center justify-between bg-white dark:bg-gray-900">
                          <TabsList className="my-2">
                            <TabsTrigger value="refined" className="gap-2">
                              <Wand2 className="w-3 h-3" />
                              Exercices Révisés (JSON)
                            </TabsTrigger>
                            <TabsTrigger value="original" className="gap-2 text-gray-500">
                              Original
                            </TabsTrigger>
                          </TabsList>
                        </div>
                        <TabsContent value="refined" className="flex-1 p-0 m-0 relative overflow-hidden">
                          <Textarea
                            className="h-full w-full p-4 resize-none border-0 focus-visible:ring-0 font-mono text-xs"
                            readOnly
                            value={JSON.stringify(refinedExercises, null, 2)}
                          />
                        </TabsContent>
                        <TabsContent value="original" className="flex-1 p-0 m-0 relative overflow-hidden">
                          <Textarea
                            className="h-full w-full p-4 resize-none border-0 focus-visible:ring-0 font-mono text-xs bg-gray-50/50"
                            readOnly
                            value={JSON.stringify(currentExercises, null, 2)}
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
            <Button onClick={startReview} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
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
