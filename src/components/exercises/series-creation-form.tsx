"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { generateSeriesWithAI } from "@/actions/series"
import { toast } from "sonner"

interface SeriesCreationFormProps {
  lessons: any[]
  chapters?: any[]
  cycle: string
  level: string
  stream?: string | null
  semester: string
  educationalStreamId?: string
  lessonId?: string
}

export function SeriesCreationForm({ lessons, chapters = [], cycle, level, stream, semester, educationalStreamId, lessonId }: SeriesCreationFormProps) {
  const router = useRouter()
  const [selectedLesson, setSelectedLesson] = React.useState<string>(lessonId || "")
  const [selectedChapter, setSelectedChapter] = React.useState<string>("")
  const [mode, setMode] = React.useState<'ai' | 'manual'>('manual')
  const [exerciseCount, setExerciseCount] = React.useState(20)
  const [additionalInstructions, setAdditionalInstructions] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isMounted, setIsMounted] = React.useState(false)

  const isSuperieur = cycle === "SUPERIEUR"
  const items = isSuperieur ? chapters : lessons
  const selectedItem = isSuperieur ? selectedChapter : selectedLesson

  const handleItemChange = (value: string) => {
    if (isSuperieur) {
      setSelectedChapter(value)
    } else {
      setSelectedLesson(value)
    }
  }

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCreate = async () => {
    if (!selectedItem) return;

    setError(null); // Clear previous errors

    if (mode === 'ai') {
      setIsGenerating(true)
      try {
        // Call AI generation endpoint
        const result = await generateSeriesWithAI({
          lessonId: isSuperieur ? lessonId! : selectedLesson,
          chapterId: isSuperieur ? selectedChapter : undefined,
          cycle,
          level,
          stream,
          semester,
          exerciseCount,
          additionalInstructions,
          educationalStreamId,
        });
        // After creation, redirect to the new series page
        router.push(`/admin/exercises/series/${result.id}`);
      } catch (error: any) {
        console.error("Error generating series:", error)
        setError(error.message || "Une erreur s'est produite lors de la génération de la série. Veuillez réessayer.")
        setIsGenerating(false)
      }
    } else {
      // Manual mode – redirect to a manual builder page
      const query = new URLSearchParams({
        lessonId: isSuperieur ? lessonId! : selectedLesson,
        ...(isSuperieur && selectedChapter ? { chapterId: selectedChapter } : {}),
        cycle,
        level,
        semester,
        ...(stream ? { stream } : {}),
        ...(educationalStreamId ? { educationalStreamId } : {}),
      }).toString();
      router.push(`/admin/exercises/series/create?${query}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label>{isSuperieur ? "Chapitre associé" : "Leçon associée"}</Label>
        {isMounted ? (
          <Select value={selectedItem} onValueChange={handleItemChange}>
            <SelectTrigger>
              <SelectValue placeholder={isSuperieur ? "Choisir un chapitre" : "Choisir une leçon"} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {isSuperieur ? `Chapitre ${item.chapterNumber}: ${item.titleFr}` : item.titleFr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="h-10 border rounded-md bg-muted animate-pulse" />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
          <input
            type="radio"
            name="mode"
            value="manual"
            checked={mode === 'manual'}
            onChange={() => setMode('manual')}
            className="w-4 h-4"
          />
          <div className="flex flex-col flex-1">
            <span className="font-medium">Manuel (Exercise par exercice)</span>
            <span className="text-xs text-muted-foreground">Créer chaque exercice individuellement</span>
          </div>
        </label>

        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
          <input
            type="radio"
            name="mode"
            value="ai"
            checked={mode === 'ai'}
            onChange={() => setMode('ai')}
            className="w-4 h-4"
          />
          <div className="flex flex-col flex-1">
            <span className="font-medium">IA (Automatique)</span>
            <span className="text-xs text-muted-foreground">Génération automatique par l'IA</span>
          </div>
        </label>
      </div>

      {mode === 'ai' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre d'exercices</Label>
            <Input
              type="number"
              min={5}
              max={50}
              value={exerciseCount}
              onChange={(e) => setExerciseCount(parseInt(e.target.value) || 20)}
            />
          </div>

          <div className="space-y-2">
            <Label>Instructions supplémentaires (Optionnel)</Label>
            <Textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Ex: Concentrez-vous sur les fonctions trigonométriques, ajoutez plus de géométrie..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              L'IA générera une série complète de {exerciseCount} exercices structurés (Application, Problèmes, Synthèse).
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
          <p className="text-sm text-destructive font-medium">Erreur</p>
          <p className="text-sm text-destructive/90 mt-1">{error}</p>
        </div>
      )}

      <Button onClick={handleCreate} disabled={!selectedItem || isGenerating} className="w-full">
        {isGenerating ? "Génération en cours..." : `Créer la série ${mode === 'ai' ? '(IA)' : '(Manuel)'}`}
      </Button>
    </div>
  )
}
