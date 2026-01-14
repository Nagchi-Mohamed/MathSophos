"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash, Save, ChevronUp, ChevronDown, FileText, FileJson, LayoutList, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { updateSeries } from "@/actions/series"
import { toast } from "sonner"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { SeriesJsonPreview } from "@/components/exercises/series-json-preview"
import { insertAtCursor } from "@/lib/textarea-utils"
import { ReviewSeriesDialog } from "@/components/admin/review-series-dialog"

interface Exercise {
  id: string
  problemTextFr: string
  solutionFr: string
  hints: string[]
}

interface SeriesEditFormProps {
  series: {
    id: string
    title: string
    description: string | null
    cycle: string
    semester: number | null
    exercises: Exercise[]
    lessonId?: string // Optional because potentially not all series are linked to lesson in legacy data, though mostly yes
  }
}

export function SeriesEditForm({ series }: SeriesEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [mode, setMode] = React.useState<'form' | 'json'>('form')
  const [showPreview, setShowPreview] = React.useState(true)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const exerciseRefsMap = React.useRef<Map<string, { problem: HTMLTextAreaElement | null, solution: HTMLTextAreaElement | null }>>(new Map())

  const setExerciseRef = (exerciseId: string, type: 'problem' | 'solution', ref: HTMLTextAreaElement | null) => {
    const current = exerciseRefsMap.current.get(exerciseId) || { problem: null, solution: null };
    current[type] = ref;
    exerciseRefsMap.current.set(exerciseId, current);
  };

  const handleTextSelected = (text: string) => {
    if (!textareaRef.current || !jsonContent) return;

    // Simple substring search
    // We try to find the text. If it is short, it might differ due to whitespace.
    // We clean up newlines in both for matching if needed, but 'indexOf' is safest start.
    const index = jsonContent.indexOf(text);
    if (index !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + text.length);

      // Scroll adjustment
      const textarea = textareaRef.current;
      const textBefore = jsonContent.substring(0, index);
      const linesBefore = textBefore.split('\n').length;
      const lineHeight = 20; // Approx
      const textareaHeight = textarea.clientHeight;
      textarea.scrollTop = (linesBefore * lineHeight) - (textareaHeight / 2);
    } else {
      // Try fallback: escape the text (simple check)
      // If content is in JSON string, it might be escaped.
      // This is a simplified check.
      toast.info("Texte non trouvé exactement dans la source JSON (peut-être échappé)");
    }
  }

  // Form Mode State
  const [title, setTitle] = React.useState(series.title)
  const [description, setDescription] = React.useState(series.description || "")
  const [semester, setSemester] = React.useState(series.semester?.toString() || "1")
  const [exercises, setExercises] = React.useState<Exercise[]>(series.exercises)

  // JSON Mode State
  const [jsonContent, setJsonContent] = React.useState("")
  const [jsonStatus, setJsonStatus] = React.useState<'idle' | 'valid' | 'error'>('idle')
  const [jsonErrorMsg, setJsonErrorMsg] = React.useState<string>("")

  // Convert exercises to JSON when switching to JSON mode
  React.useEffect(() => {
    if (mode === 'json' && !jsonContent) {
      const exercisesJson = exercises.map(e => ({
        problemTextFr: e.problemTextFr,
        solutionFr: e.solutionFr,
        hints: e.hints.filter(h => h.trim() !== "")
      }))
      setJsonContent(JSON.stringify(exercisesJson, null, 2))
    }
  }, [mode, exercises, jsonContent])

  // --- Form Mode Logic ---

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: crypto.randomUUID(),
        problemTextFr: "",
        solutionFr: "",
        hints: [""]
      }
    ])
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id))
  }

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(exercises.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ))
  }

  const moveExerciseUp = (index: number) => {
    if (index === 0) return
    const newExercises = [...exercises]
      ;[newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]]
    setExercises(newExercises)
  }

  const moveExerciseDown = (index: number) => {
    if (index === exercises.length - 1) return
    const newExercises = [...exercises]
      ;[newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]]
    setExercises(newExercises)
  }

  const updateHint = (exerciseId: string, hintIndex: number, value: string) => {
    setExercises(exercises.map(e => {
      if (e.id !== exerciseId) return e
      const newHints = [...e.hints]
      newHints[hintIndex] = value
      return { ...e, hints: newHints }
    }))
  }

  const addHint = (exerciseId: string) => {
    setExercises(exercises.map(e => {
      if (e.id !== exerciseId) return e
      return { ...e, hints: [...e.hints, ""] }
    }))
  }

  const removeHint = (exerciseId: string, hintIndex: number) => {
    setExercises(exercises.map(e => {
      if (e.id !== exerciseId) return e
      return { ...e, hints: e.hints.filter((_, i) => i !== hintIndex) }
    }))
  }

  const handleFormSubmit = async () => {
    if (!title) {
      toast.error("Veuillez donner un titre à la série")
      return
    }

    setIsSubmitting(true)
    try {
      const initialIds = new Set(series.exercises.map(e => e.id))

      const exercisesPayload = exercises.map(e => {
        const isNew = !initialIds.has(e.id)
        return {
          id: isNew ? undefined : e.id,
          problemTextFr: e.problemTextFr,
          solutionFr: e.solutionFr,
          hints: e.hints.filter(h => h.trim() !== "")
        }
      })

      const result = await updateSeries(series.id, {
        title,
        description,
        semester: parseInt(semester),
        exercises: exercisesPayload
      })

      if (result.success) {
        toast.success("Série mise à jour avec succès")
        router.push(`/admin/exercises/series/${series.id}`)
        router.refresh()
      } else {
        toast.error("Erreur lors de la mise à jour: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- JSON Mode Logic ---

  // Helper to extract JSON from potential text/markdown
  const extractJson = (input: string) => {
    let clean = input.trim()
    // Try to find markdown code blocks
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (match) {
      return match[1]
    }
    // Try to find start of JSON array or object
    const startObj = clean.indexOf('{')
    const startArr = clean.indexOf('[')

    let start = -1
    if (startObj !== -1 && startArr !== -1) start = Math.min(startObj, startArr)
    else if (startObj !== -1) start = startObj
    else if (startArr !== -1) start = startArr

    if (start !== -1) {
      const lastObj = clean.lastIndexOf('}')
      const lastArr = clean.lastIndexOf(']')
      const end = Math.max(lastObj, lastArr)
      if (end > start) {
        return clean.substring(start, end + 1)
      }
    }

    return clean
  }

  // Helper to fix common JSON escaping issues in LaTeX content
  const sanitizeJsonString = (str: string) => {
    // Simple approach: double-escape single backslashes that are NOT valid JSON escapes
    return str.replace(/\\([a-zA-Z])/g, (match, letter) => {
      const validEscapes = ['n', 't', 'r', 'b', 'f', 'u']
      if (validEscapes.includes(letter)) {
        return match
      }
      return '\\\\' + letter
    })
  }

  // Validate JSON in real-time
  React.useEffect(() => {
    if (!jsonContent.trim()) {
      setJsonStatus('idle')
      setJsonErrorMsg("")
      return
    }

    try {
      let cleanedContent = extractJson(jsonContent)
      let parsed
      try {
        parsed = JSON.parse(cleanedContent)
      } catch (e) {
        const fixed = sanitizeJsonString(cleanedContent)
        parsed = JSON.parse(fixed)
      }

      if (!Array.isArray(parsed)) {
        setJsonStatus('error')
        setJsonErrorMsg("Le JSON doit être un tableau d'exercices")
        return
      }

      // Validate structure
      for (let i = 0; i < parsed.length; i++) {
        const ex = parsed[i]
        if (!ex.problemTextFr || !ex.solutionFr) {
          setJsonStatus('error')
          setJsonErrorMsg(`Exercice ${i + 1}: problemTextFr et solutionFr sont requis`)
          return
        }
      }

      setJsonStatus('valid')
      setJsonErrorMsg("")
    } catch (error: any) {
      setJsonStatus('error')
      setJsonErrorMsg(error.message || "JSON invalide")
    }
  }, [jsonContent])

  const handleJsonSubmit = async () => {
    if (jsonStatus !== 'valid') return

    setIsSubmitting(true)
    try {
      let cleanedContent = extractJson(jsonContent)
      let parsed
      try {
        parsed = JSON.parse(cleanedContent)
      } catch (e) {
        const fixed = sanitizeJsonString(cleanedContent)
        parsed = JSON.parse(fixed)
      }

      const initialIds = new Set(series.exercises.map(e => e.id))

      // Try to match exercises by index to preserve IDs where possible
      const exercisesPayload = parsed.map((e: any, index: number) => {
        const existingExercise = series.exercises[index]
        const isNew = !existingExercise || index >= series.exercises.length

        return {
          id: isNew ? undefined : existingExercise.id,
          problemTextFr: e.problemTextFr,
          solutionFr: e.solutionFr,
          hints: (e.hints || []).filter((h: string) => h.trim() !== "")
        }
      })

      const result = await updateSeries(series.id, {
        title,
        description,
        semester: parseInt(semester),
        exercises: exercisesPayload
      })

      if (result.success) {
        toast.success("Série mise à jour avec succès")
        router.push(`/admin/exercises/series/${series.id}`)
        router.refresh()
      } else {
        toast.error("Erreur lors de la mise à jour: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors du traitement")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Ensure component only renders on client to avoid hydration mismatch with Radix Tabs
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-8">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'form' | 'json')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <LayoutList className="w-4 h-4" />
            Mode Formulaire
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <FileJson className="w-4 h-4" />
            Mode JSON
          </TabsTrigger>
        </TabsList>

        {/* FORM MODE */}
        <TabsContent value="form" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre de la série</Label>
                <Input
                  placeholder="Ex: Série 1 - Limites et Continuité"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Semestre</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="1">Semestre 1</option>
                  <option value="2">Semestre 2</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description (optionnel)</Label>
                  <VideoUploadManager
                    entityType="series"
                    entityId={series.id}
                    onInsert={(url) => {
                      setDescription(prev => prev + "\n[Regarder la vidéo](" + url + ")\n");
                      toast.success("Lien vidéo ajouté");
                    }}
                  />
                </div>
                <Textarea
                  placeholder="Description ou consignes particulières..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Exercices</h2>
              <div className="flex gap-2">
                {series.lessonId && (
                  <ReviewSeriesDialog
                    currentExercises={exercises}
                    lessonId={series.lessonId}
                    onConfirm={(newExercises) => {
                      // Map new exercises to preserve old IDs if possible or create new ones
                      // But ReviewSeriesDialog is instructed to keep IDs.
                      setExercises(newExercises)
                    }}
                  />
                )}
                <Button onClick={addExercise} variant="outline">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter un exercice
                </Button>
              </div>
            </div>

            {exercises.map((exercise, index) => (
              <Card key={exercise.id} className="relative">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveExerciseUp(index)}
                        disabled={index === 0}
                        title="Monter"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveExerciseDown(index)}
                        disabled={index === exercises.length - 1}
                        title="Descendre"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg font-medium">
                      Exercice {index + 1}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => removeExercise(exercise.id)}
                    title="Supprimer"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Énoncé</Label>
                      <div className="flex gap-2">
                        <VideoUploadManager
                          entityType="exercise"
                          entityId={exercise.id}
                          onInsert={(url) => {
                            toast.success("Vidéo pour l'exercice prête");
                          }}
                        />
                        <ImageUploadManager
                          entityType="series"
                          entityId={series.id}
                          onInsert={(latex) => {
                            const refs = exerciseRefsMap.current.get(exercise.id);
                            insertAtCursor(
                              refs?.problem || null,
                              "\n" + latex + "\n",
                              exercise.problemTextFr,
                              (newValue) => updateExercise(exercise.id, "problemTextFr", newValue)
                            );
                            toast.success("Image ajoutée à l'énoncé");
                          }}
                        />
                      </div>
                    </div>
                    <Textarea
                      ref={(el) => setExerciseRef(exercise.id, 'problem', el)}
                      placeholder="Énoncé de l'exercice..."
                      className="min-h-[100px]"
                      value={exercise.problemTextFr}
                      onChange={(e) => updateExercise(exercise.id, "problemTextFr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Solution</Label>
                      <div className="flex gap-2">
                        <VideoUploadManager
                          entityType="exercise"
                          entityId={exercise.id}
                          onInsert={(url) => {
                            toast.success("Vidéo pour la solution prête");
                          }}
                        />
                        <ImageUploadManager
                          entityType="series"
                          entityId={series.id}
                          onInsert={(latex) => {
                            const refs = exerciseRefsMap.current.get(exercise.id);
                            insertAtCursor(
                              refs?.solution || null,
                              "\n" + latex + "\n",
                              exercise.solutionFr,
                              (newValue) => updateExercise(exercise.id, "solutionFr", newValue)
                            );
                            toast.success("Image ajoutée à la solution");
                          }}
                        />
                      </div>
                    </div>
                    <Textarea
                      ref={(el) => setExerciseRef(exercise.id, 'solution', el)}
                      placeholder="Solution détaillée..."
                      className="min-h-[100px]"
                      value={exercise.solutionFr}
                      onChange={(e) => updateExercise(exercise.id, "solutionFr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Indices</Label>
                    {exercise.hints.map((hint, hintIndex) => (
                      <div key={hintIndex} className="flex gap-2 mb-2">
                        <Input
                          placeholder={`Indice ${hintIndex + 1}`}
                          value={hint}
                          onChange={(e) => updateHint(exercise.id, hintIndex, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHint(exercise.id, hintIndex)}
                          disabled={exercise.hints.length === 1 && hintIndex === 0}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="link" onClick={() => addHint(exercise.id)} className="px-0">
                      + Ajouter un indice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-4 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 border rounded-lg shadow-lg">
            <Button variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Mettre à jour la série
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* JSON MODE */}
        <TabsContent value="json" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Éditer en JSON</CardTitle>
              <CardDescription>
                Modifiez les exercices directement en JSON. Le format doit être un tableau d'objets avec problemTextFr, solutionFr, et hints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="flex justify-end mb-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showPreview ? "Masquer" : "Afficher"} l'aperçu
                </Button>
              </div>

              <div className="flex h-[600px] border rounded-md overflow-hidden">
                <div className={`${showPreview ? 'w-1/2 border-r' : 'w-full'} relative h-full flex flex-col`}>
                  <Textarea
                    ref={textareaRef}
                    placeholder="Collez votre JSON ici..."
                    className="font-mono text-xs flex-1 border-0 resize-none p-4 focus-visible:ring-0 rounded-none h-full"
                    value={jsonContent}
                    onChange={(e) => setJsonContent(e.target.value)}
                  />
                  {jsonStatus === 'valid' && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  {jsonStatus === 'error' && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>

                {showPreview && (
                  <div className="w-1/2 h-full bg-gray-50 dark:bg-gray-900 border-l overflow-hidden">
                    <SeriesJsonPreview jsonContent={jsonContent} onTextSelected={handleTextSelected} />
                  </div>
                )}
              </div>

              {jsonStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur JSON</AlertTitle>
                  <AlertDescription>{jsonErrorMsg}</AlertDescription>
                </Alert>
              )}

              {jsonStatus === 'valid' && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">JSON valide</AlertTitle>
                  <AlertDescription className="text-green-600">
                    Le JSON est correctement formaté et prêt à être enregistré.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 border rounded-lg shadow-lg">
            <Button variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button onClick={handleJsonSubmit} disabled={isSubmitting || jsonStatus !== 'valid'}>
              {isSubmitting ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Mettre à jour la série
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div >
  )
}
