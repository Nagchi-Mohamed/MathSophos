"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ExamPreview } from "./exam-preview"
import { ManualExamEditor } from "./manual-exam-editor"
import { GenerateExamParams, GeneratedExam, generateExamWithAI, saveExam } from "@/actions/exams"
import { EducationalLevel } from "@/lib/enums"
import { Loader2, Plus, Trash2, Sparkles, PenTool, Bot, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ChapterSelection {
  id: string
  title: string
  chapterNumber: number
  points: number
}

interface SuperieurExamGeneratorProps {
  lesson: {
    id: string
    titleFr: string
  }
  chapters: Array<{
    id: string
    titleFr: string
    chapterNumber: number
  }>
  streamId: string
  moduleId: string
  moduleName: string
  streamName: string
}

export function SuperieurExamGenerator({
  lesson,
  chapters,
  streamId,
  moduleId,
  moduleName,
  streamName
}: SuperieurExamGeneratorProps) {
  const [step, setStep] = useState<"CONFIG" | "PREVIEW" | "MANUAL_EDITOR">("CONFIG")
  const [method, setMethod] = useState<"AI" | "MANUAL">("AI")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [examData, setExamData] = useState<GeneratedExam | null>(null)
  const [currentParams, setCurrentParams] = useState<GenerateExamParams | null>(null)
  const router = useRouter()

  // Chapter selection state
  const [selectedChapters, setSelectedChapters] = useState<ChapterSelection[]>([])
  const [currentChapterId, setCurrentChapterId] = useState("")
  const [currentPoints, setCurrentPoints] = useState(5)
  const [context, setContext] = useState("")
  const [duration, setDuration] = useState("2h")
  const [includeAnswerSpace, setIncludeAnswerSpace] = useState(true)

  const handleAddChapter = () => {
    if (!currentChapterId) return
    const chapter = chapters.find(c => c.id === currentChapterId)
    if (chapter && !selectedChapters.find(c => c.id === chapter.id)) {
      setSelectedChapters([...selectedChapters, {
        id: chapter.id,
        title: chapter.titleFr,
        chapterNumber: chapter.chapterNumber,
        points: currentPoints
      }])
      setCurrentChapterId("")
      setCurrentPoints(5)
    }
  }

  const handleRemoveChapter = (id: string) => {
    setSelectedChapters(selectedChapters.filter(c => c.id !== id))
  }

  const handleUpdatePoints = (id: string, points: number) => {
    setSelectedChapters(selectedChapters.map(c =>
      c.id === id ? { ...c, points } : c
    ))
  }

  const handleGenerate = async () => {
    if (selectedChapters.length === 0) {
      toast.error("Veuillez sélectionner au moins un chapitre")
      return
    }

    const totalPoints = selectedChapters.reduce((acc, c) => acc + c.points, 0)
    if (totalPoints !== 20) {
      toast.error(`Le total des points doit être exactement 20. Actuellement: ${totalPoints}`)
      return
    }

    const params: GenerateExamParams = {
      type: "EXAM", // Only exams for Supérieur
      cycle: "SUPERIEUR",
      level: EducationalLevel.UNIVERSITY,
      streamId,
      moduleId,
      examType: "LOCAL", // Default for Supérieur
      lessons: selectedChapters.map(c => ({
        id: c.id,
        title: `Chapitre ${c.chapterNumber}: ${c.title}`,
        points: c.points
      })),
      context: context || undefined,
      includeAnswerSpace
    }

    setCurrentParams(params)

    if (method === "AI") {
      setIsGenerating(true)
      try {
        const result = await generateExamWithAI(params)

        if (result.success && result.data) {
          // Override duration with user input
          const examWithDuration = { ...result.data, duration }
          setExamData(examWithDuration)
          setStep("PREVIEW")
          toast.success("Examen généré avec succès !")
        } else {
          toast.error(result.error || "Erreur lors de la génération")
        }
      } catch (error) {
        console.error(error)
        toast.error("Une erreur inattendue est survenue")
      } finally {
        setIsGenerating(false)
      }
    } else {
      // Manual Mode
      const initialExamData: GeneratedExam = {
        title: `Examen - ${lesson.titleFr}`,
        subtitle: `${streamName} - ${moduleName}`,
        duration,
        totalPoints: 20,
        exercises: []
      }
      setExamData(initialExamData)
      setStep("MANUAL_EDITOR")
    }
  }

  const handleSave = async (data: GeneratedExam) => {
    if (!currentParams) return

    setIsSaving(true)
    try {
      const result = await saveExam(data, currentParams)
      if (result.success) {
        toast.success("Examen sauvegardé avec succès !")
        router.push("/admin/exams")
      } else {
        toast.error(result.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error(error)
      toast.error("Impossible de sauvegarder l'examen")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    setStep("CONFIG")
  }

  const totalPoints = selectedChapters.reduce((acc, c) => acc + c.points, 0)

  return (
    <div className="w-full">
      {step === "CONFIG" && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration de l'Examen</CardTitle>
            <CardDescription>
              Sélectionnez les chapitres et leurs points pour générer un examen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Method Selection */}
            <Tabs value={method} onValueChange={(v) => setMethod(v as "AI" | "MANUAL")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="AI" className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Génération IA
                </TabsTrigger>
                <TabsTrigger value="MANUAL" className="flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Création Manuelle
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Chapter Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Sélection des Chapitres</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez les chapitres à inclure dans l'examen et attribuez des points (total: 20)
                </p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="chapter-select">Chapitre</Label>
                  <select
                    id="chapter-select"
                    value={currentChapterId}
                    onChange={(e) => setCurrentChapterId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Sélectionnez un chapitre</option>
                    {chapters
                      .filter(c => !selectedChapters.find(sc => sc.id === c.id))
                      .map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          Chapitre {chapter.chapterNumber}: {chapter.titleFr}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-32">
                  <Label htmlFor="points-input">Points</Label>
                  <Input
                    id="points-input"
                    type="number"
                    min="1"
                    max="20"
                    value={currentPoints}
                    onChange={(e) => setCurrentPoints(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddChapter} disabled={!currentChapterId}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>

              {/* Selected Chapters */}
              {selectedChapters.length > 0 && (
                <div className="space-y-2">
                  <Label>Chapitres sélectionnés</Label>
                  <div className="space-y-2 border rounded-lg p-4">
                    {selectedChapters.map((chapter) => (
                      <div key={chapter.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            Chapitre {chapter.chapterNumber}: {chapter.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={chapter.points}
                            onChange={(e) => handleUpdatePoints(chapter.id, Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">points</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveChapter(chapter.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-medium">
                      Total: {totalPoints} / 20 points
                    </span>
                    {totalPoints !== 20 && (
                      <span className="text-sm text-destructive">
                        {totalPoints < 20
                          ? `Il manque ${20 - totalPoints} point(s)`
                          : `Il y a ${totalPoints - 20} point(s) en trop`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Duration and Answer Space */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Durée de l'examen</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 1h30min, 2h20min, 1h, 55min"
                  className="w-full h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Format: 1h, 1h30min, 2h20min, 55min, etc.
                </p>
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAnswerSpace"
                    checked={includeAnswerSpace}
                    onCheckedChange={(checked) => setIncludeAnswerSpace(checked as boolean)}
                  />
                  <Label htmlFor="includeAnswerSpace" className="cursor-pointer">
                    Inclure un espace pour les réponses
                  </Label>
                </div>
              </div>
            </div>

            {/* Context/Instructions */}
            <div className="space-y-2">
              <Label htmlFor="context">Instructions supplémentaires (optionnel)</Label>
              <Textarea
                id="context"
                placeholder="Ajoutez des instructions spécifiques pour la génération de l'examen..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
              />
            </div>

            {/* Generate Button */}
            <div className="flex justify-end gap-4">
              <Button
                onClick={handleGenerate}
                disabled={selectedChapters.length === 0 || totalPoints !== 20 || isGenerating}
                className="min-w-[200px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : method === "AI" ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer avec l'IA
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4 mr-2" />
                    Créer manuellement
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "PREVIEW" && examData && (
        <ExamPreview
          exam={examData}
          onBack={handleBack}
          onSave={handleSave}
          isSaving={isSaving}
          metadata={{
            streamName,
            moduleName,
            lessonName: lesson.titleFr
          }}
          includeAnswerSpace={includeAnswerSpace}
        />
      )}

      {step === "MANUAL_EDITOR" && examData && (
        <ManualExamEditor
          initialData={examData}
          examId={examData.id} // Pass exam ID if available (for image uploads)
          onBack={handleBack}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

