"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GeneratedExam, GeneratedExercise } from "@/actions/exams"
import { Plus, Trash2, Save, ArrowLeft, Eye, Edit, FileJson, LayoutList, Download } from "lucide-react"
import MarkdownRenderer from "@/components/markdown-renderer"
import { toast } from "sonner"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { ExamJsonMode } from "@/components/exams/exam-json-mode"
import dynamic from "next/dynamic"

const AIPromptGenerator = dynamic(
  () => import("@/components/exercises/ai-prompt-generator").then(mod => ({ default: mod.AIPromptGenerator })),
  { ssr: false }
)

interface ManualExamEditorProps {
  initialData?: Partial<GeneratedExam>
  examId?: string // Add examId for image uploads
  cycle?: string
  examType?: "EXAM" | "CONTROL" // Add exam type for JSON mode
  onSave: (exam: GeneratedExam) => void
  onBack: () => void
  isSaving: boolean
}

export function ManualExamEditor({
  initialData,
  examId,
  cycle,
  examType = "EXAM",
  onSave,
  onBack,
  isSaving
}: ManualExamEditorProps) {
  const [exam, setExam] = useState<GeneratedExam>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    duration: initialData?.duration || "2h",
    instructions: initialData?.instructions || "",
    totalPoints: initialData?.totalPoints || 20,
    exercises: initialData?.exercises || []
  })

  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null)
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual')

  const handleUpdateExam = (field: keyof GeneratedExam, value: any) => {
    setExam(prev => ({ ...prev, [field]: value }))
  }

  const handleAddExercise = () => {
    const newExercise: GeneratedExercise = {
      title: `Exercice ${exam.exercises.length + 1}`,
      problem: "",
      solution: "",
      points: 0,
      spaceLines: 5
    }
    setExam(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
    setActiveExerciseIndex(exam.exercises.length)
  }

  const handleUpdateExercise = (index: number, field: keyof GeneratedExercise, value: any) => {
    const newExercises = [...exam.exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExam(prev => ({ ...prev, exercises: newExercises }))
  }

  const handleRemoveExercise = (index: number) => {
    const newExercises = exam.exercises.filter((_, i) => i !== index)
    setExam(prev => ({ ...prev, exercises: newExercises }))
    if (activeExerciseIndex === index) {
      setActiveExerciseIndex(null)
    } else if (activeExerciseIndex !== null && activeExerciseIndex > index) {
      setActiveExerciseIndex(activeExerciseIndex - 1)
    }
  }

  const calculateTotalPoints = () => {
    return exam.exercises.reduce((acc, ex) => acc + (Number(ex.points) || 0), 0)
  }

  const handleJsonChange = (updatedExam: GeneratedExam) => {
    setExam(updatedExam)
  }

  const exportToJson = () => {
    const jsonData = {
      title: exam.title,
      subtitle: exam.subtitle,
      duration: exam.duration,
      instructions: exam.instructions,
      totalPoints: exam.totalPoints,
      exercises: exam.exercises.map(ex => ({
        title: ex.title,
        problem: ex.problem,
        solution: ex.solution,
        points: ex.points,
        spaceLines: ex.spaceLines || 0,
      })),
    }
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${examType.toLowerCase()}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getInitialJson = () => {
    return JSON.stringify({
      title: exam.title,
      subtitle: exam.subtitle,
      duration: exam.duration,
      instructions: exam.instructions,
      totalPoints: exam.totalPoints,
      exercises: exam.exercises.map(ex => ({
        title: ex.title,
        problem: ex.problem,
        solution: ex.solution,
        points: ex.points,
        spaceLines: ex.spaceLines || 0,
      })),
    }, null, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">
            Total Points: <span className={calculateTotalPoints() !== exam.totalPoints ? "text-amber-500" : "text-green-500"}>
              {calculateTotalPoints()} / {exam.totalPoints}
            </span>
          </div>
          {editorMode === 'visual' && (
            <Button variant="outline" size="sm" onClick={exportToJson}>
              <Download className="mr-2 h-4 w-4" />
              Exporter JSON
            </Button>
          )}
          <Button onClick={() => onSave(exam)} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder l'examen"}
          </Button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as 'visual' | 'json')} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual">
              <LayoutList className="w-4 h-4 mr-2" /> Mode Visuel
            </TabsTrigger>
            <TabsTrigger value="json">
              <FileJson className="w-4 h-4 mr-2" /> Mode JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {editorMode === 'json' ? (
        <ExamJsonMode
          initialJson={getInitialJson()}
          examType={examType}
          examId={examId}
          onValidJsonChange={handleJsonChange}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Exam Structure */}
          <div className="lg:col-span-4 space-y-6">
            <AIPromptGenerator
              contentType="exam"
              context={{
                cycle: cycle || "LYCEE",
                level: "UNKNOWN", // We don't distinctly have level here, maybe infer or leave generic
                stream: null,
                semester: "UNKNOWN"
              }}
              lesson={{
                id: examId || "exam",
                titleFr: exam.title || "Nouvel Examen",
                contentFr: exam.instructions
              }}
            />
            <Card>
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={exam.title}
                    onChange={(e) => handleUpdateExam("title", e.target.value)}
                    placeholder="Ex: Examen National 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sous-titre</Label>
                  <Input
                    value={exam.subtitle}
                    onChange={(e) => handleUpdateExam("subtitle", e.target.value)}
                    placeholder="Ex: Session Normale"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durée</Label>
                    <Input
                      value={exam.duration}
                      onChange={(e) => handleUpdateExam("duration", e.target.value)}
                      placeholder="Ex: 1h30min, 2h20min, 1h, 55min"
                      className="w-full h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: 1h, 1h30min, 2h20min, 55min, etc.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Points</Label>
                    <Input
                      type="number"
                      value={exam.totalPoints}
                      onChange={(e) => handleUpdateExam("totalPoints", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Instructions Générales (Format Marocain)</Label>
                    {examId && (
                      <div className="flex gap-2">
                        <VideoUploadManager
                          entityType="exam"
                          entityId={examId}
                          onInsert={(url) => {
                            handleUpdateExam("instructions", (exam.instructions || "") + "\n[Regarder la vidéo](" + url + ")\n");
                            toast.success("Vidéo insérée");
                          }}
                        />
                        <ImageUploadManager
                          entityType="exam"
                          entityId={examId}
                          onInsert={(latex) => {
                            handleUpdateExam("instructions", (exam.instructions || "") + "\n" + latex);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <Textarea
                    value={exam.instructions || ""}
                    onChange={(e) => handleUpdateExam("instructions", e.target.value)}
                    placeholder="Ex: - Durée : 2h&#10;- Barème : 20 points&#10;- La présentation, la rédaction et l'orthographe seront prises en compte&#10;- Toute réponse doit être justifiée"
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Instructions qui apparaîtront en haut de l'examen pour les élèves
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Exercices</CardTitle>
                <Button size="sm" onClick={handleAddExercise}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-y-auto pr-4">
                  <div className="space-y-2">
                    {exam.exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${activeExerciseIndex === index
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent"
                          }`}
                        onClick={() => setActiveExerciseIndex(index)}
                      >
                        <div className="truncate font-medium">
                          {exercise.title || `Exercice ${index + 1}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {exercise.points} pts
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveExercise(index)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {exam.exercises.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Aucun exercice. Cliquez sur + pour commencer.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Exercise Editor */}
          <div className="lg:col-span-8">
            {activeExerciseIndex !== null && exam.exercises[activeExerciseIndex] ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Input
                      value={exam.exercises[activeExerciseIndex].title}
                      onChange={(e) => handleUpdateExercise(activeExerciseIndex, "title", e.target.value)}
                      className="font-bold text-lg"
                      placeholder="Titre de l'exercice"
                    />
                    <div className="w-32 flex items-center gap-2">
                      <Label className="whitespace-nowrap">Points :</Label>
                      <Input
                        type="number"
                        value={exam.exercises[activeExerciseIndex].points}
                        onChange={(e) => handleUpdateExercise(activeExerciseIndex, "points", Number(e.target.value))}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* PROBLEM SECTION */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-primary">Énoncé de l'exercice</Label>
                        {examId && (
                          <div className="flex gap-2">
                            <VideoUploadManager
                              entityType="exam"
                              entityId={examId}
                              onInsert={(url) => {
                                handleUpdateExercise(activeExerciseIndex, "problem", exam.exercises[activeExerciseIndex].problem + "\n[Regarder la vidéo](" + url + ")\n");
                                toast.success("Vidéo insérée");
                              }}
                            />
                            <ImageUploadManager
                              entityType="exam"
                              entityId={examId}
                              onInsert={(latex) => {
                                handleUpdateExercise(activeExerciseIndex, "problem", exam.exercises[activeExerciseIndex].problem + "\n" + latex);
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-muted-foreground">Éditeur (Markdown/LaTeX)</Label>
                          <Textarea
                            value={exam.exercises[activeExerciseIndex].problem}
                            onChange={(e) => handleUpdateExercise(activeExerciseIndex, "problem", e.target.value)}
                            className="flex-1 font-mono text-sm resize-y min-h-[300px]"
                            placeholder="Écrivez votre énoncé ici..."
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-muted-foreground">Aperçu en direct</Label>
                          <div className="flex-1 border rounded-md p-4 overflow-y-auto bg-card min-h-[300px] max-h-[500px]">
                            <MarkdownRenderer content={exam.exercises[activeExerciseIndex].problem || "*L'aperçu s'affichera ici*"} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-border my-6" />

                    {/* SOLUTION SECTION */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-primary">Solution détaillée</Label>
                        {examId && (
                          <div className="flex gap-2">
                            <VideoUploadManager
                              entityType="exam"
                              entityId={examId}
                              onInsert={(url) => {
                                handleUpdateExercise(activeExerciseIndex, "solution", exam.exercises[activeExerciseIndex].solution + "\n[Regarder la vidéo](" + url + ")\n");
                                toast.success("Vidéo insérée");
                              }}
                            />
                            <ImageUploadManager
                              entityType="exam"
                              entityId={examId}
                              onInsert={(latex) => {
                                handleUpdateExercise(activeExerciseIndex, "solution", exam.exercises[activeExerciseIndex].solution + "\n" + latex);
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-muted-foreground">Éditeur (Markdown/LaTeX)</Label>
                          <Textarea
                            value={exam.exercises[activeExerciseIndex].solution}
                            onChange={(e) => handleUpdateExercise(activeExerciseIndex, "solution", e.target.value)}
                            className="flex-1 font-mono text-sm resize-y min-h-[300px]"
                            placeholder="Écrivez la solution ici..."
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-muted-foreground">Aperçu en direct</Label>
                          <div className="flex-1 border rounded-md p-4 overflow-y-auto bg-card min-h-[300px] max-h-[500px]">
                            <MarkdownRenderer content={exam.exercises[activeExerciseIndex].solution || "*L'aperçu s'affichera ici*"} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed rounded-xl p-12 text-muted-foreground bg-muted/30">
                <div className="text-center">
                  <Edit className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">Sélectionnez un exercice</h3>
                  <p>Ou créez-en un nouveau pour commencer l'édition</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
