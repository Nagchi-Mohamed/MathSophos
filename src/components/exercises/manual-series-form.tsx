"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash, Save, ArrowLeft, FileText, FileJson, LayoutList, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createSeriesWithExercises } from "@/actions/series"
import { toast } from "sonner"
import { SERIES_EXAMPLE_JSON, SUPERIEUR_SERIES_EXAMPLE_JSON } from "@/lib/content-examples"
import { SeriesJsonPreview } from "@/components/exercises/series-json-preview"
import dynamic from "next/dynamic"

const AIPromptGenerator = dynamic(
  () => import("@/components/exercises/ai-prompt-generator").then(mod => ({ default: mod.AIPromptGenerator })),
  { ssr: false }
)

interface ManualSeriesFormProps {
  context: {
    lessonId: string
    cycle: string
    level: string
    stream?: string | null
    semester: string
    educationalStreamId?: string
  }
  lesson: {
    id: string
    titleFr: string
    slug: string
    contentFr?: string | null
  }
}

interface ExerciseDraft {
  id: string
  problemTextFr: string
  solutionFr: string
  hints: string[]
}

export function ManualSeriesForm({ context, lesson }: ManualSeriesFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [mode, setMode] = React.useState<'form' | 'json'>('form')
  const [showPreview, setShowPreview] = React.useState(true)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleTextSelected = (text: string) => {
    if (!textareaRef.current || !jsonContent) return;

    const index = jsonContent.indexOf(text);
    if (index !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + text.length);

      const textarea = textareaRef.current;
      const textBefore = jsonContent.substring(0, index);
      const linesBefore = textBefore.split('\n').length;
      const lineHeight = 20;
      const textareaHeight = textarea.clientHeight;
      textarea.scrollTop = (linesBefore * lineHeight) - (textareaHeight / 2);
    } else {
      toast.info("Texte non trouvé exactement dans la source JSON (peut-être échappé)");
    }
  }

  // Auto-generate title from lesson name
  const seriesTitle = `Série d'exercices - ${lesson.titleFr}`

  // Form Mode State
  const [description, setDescription] = React.useState("")
  const [exercises, setExercises] = React.useState<ExerciseDraft[]>([
    {
      id: crypto.randomUUID(),
      problemTextFr: "",
      solutionFr: "",
      hints: [""]
    }
  ])

  // JSON Mode State
  const [jsonType, setJsonType] = React.useState<'college' | 'superieur'>('college')
  const [jsonContent, setJsonContent] = React.useState("")
  const [jsonStatus, setJsonStatus] = React.useState<'idle' | 'valid' | 'error'>('idle')
  const [jsonErrorMsg, setJsonErrorMsg] = React.useState<string>("")

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

  const updateExercise = (id: string, field: keyof ExerciseDraft, value: any) => {
    setExercises(exercises.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ))
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

  const loadExample = () => {
    try {
      const exampleData = JSON.parse(SERIES_EXAMPLE_JSON)
      setDescription("Série d'exercices couvrant les fonctions polynomiales, les suites et l'analyse fonctionnelle")
      setExercises(exampleData.map((ex: any) => ({
        id: crypto.randomUUID(),
        problemTextFr: ex.problemTextFr,
        solutionFr: ex.solutionFr,
        hints: ex.hints || [""]
      })))
      toast.success("Exemple chargé avec succès")
    } catch (error) {
      toast.error("Erreur lors du chargement de l'exemple")
    }
  }

  const handleFormSubmit = async () => {
    setIsSubmitting(true)
    try {
      const result = await createSeriesWithExercises({
        ...context,
        title: seriesTitle,
        description,
        exercises: exercises.map(e => ({
          problemTextFr: e.problemTextFr,
          solutionFr: e.solutionFr,
          hints: e.hints.filter(h => h.trim() !== "")
        }))
      })

      if (result.success) {
        toast.success("Série créée avec succès")
        router.push(`/admin/exercises/series/${result.data?.id}`)
      } else {
        toast.error("Erreur lors de la création: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- JSON Mode Logic ---

  // Helper to try extracting JSON from potential text/markdown
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

    // If we have both, take the earliest one
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

  // Helper to fix common JSON escaping issues in Latex content
  // Now simpler: we rely on a robust state machine to handle quotes and control chars
  const sanitizeJsonString = (str: string) => {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (inString) {
        if (char === '\\') {
          // We might be looking at a single backslash that should be double
          // Look ahead to see if it's a valid escape char
          const nextChar = str[i + 1];
          const validEscapes = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];

          if (!escaped) {
            // Starting an escape sequence
            escaped = true;
            result += char;

            if (nextChar && !validEscapes.includes(nextChar)) {
              // Invalid escape sequence start, so this backslash is likely a literal backslash. Double it.
              result += '\\'; // result is now \\
              escaped = false; // We consumed this backslash as a literal
            }
          } else {
            // Previous char was backslash, so this is the escaped char.
            result += char;
            escaped = false;
          }
        } else if (char === '"' && !escaped) {
          inString = false;
          result += char;
        } else if (char === '\n') {
          // Real newline inside string -> escape it
          result += '\\n';
          escaped = false;
        } else if (char === '\r') {
          escaped = false;
        } else if (char === '\t') {
          result += '\\t';
          escaped = false;
        } else {
          result += char;
          escaped = false;
        }
      } else {
        // Not in string
        if (char === '"') {
          inString = true;
        }
        result += char;
      }
    }
    return result;
  }

  // Validate JSON whenever content changes
  React.useEffect(() => {
    if (!jsonContent.trim()) {
      setJsonStatus('idle')
      setJsonErrorMsg("")
      return
    }

    try {
      let cleanedContent = extractJson(jsonContent)
      let parsed;
      try {
        parsed = JSON.parse(cleanedContent)
      } catch (e) {
        // Use our robust sanitizer
        try {
          const fixed = sanitizeJsonString(cleanedContent)
          parsed = JSON.parse(fixed)
        } catch (e2) {
          throw e;
        }
      }

      if (jsonType === 'college') {
        if (!Array.isArray(parsed)) throw new Error("Le format doit être un tableau d'exercices [...]")
        // Basic validation
        parsed.forEach((ex, i) => {
          if (!ex.problemTextFr) throw new Error(`Exercice ${i + 1}: 'problemTextFr' manquant`)
          if (!ex.solutionFr) throw new Error(`Exercice ${i + 1}: 'solutionFr' manquant`)
        })
      } else {
        // Supérieur
        if (!parsed.title) throw new Error("Champ 'title' manquant pour la série")
        if (!Array.isArray(parsed.exercises)) throw new Error("Le format doit inclure un tableau 'exercises'")
        parsed.exercises.forEach((ex: any, i: number) => {
          if (!ex.title) throw new Error(`Exercice ${i + 1}: 'title' manquant`)
          if (!Array.isArray(ex.questions)) throw new Error(`Exercice ${i + 1}: tableau 'questions' manquant`)
        })
      }

      setJsonStatus('valid')
      setJsonErrorMsg("")
    } catch (e: any) {
      setJsonStatus('error')
      setJsonErrorMsg(e.message)
    }
  }, [jsonContent, jsonType])

  const loadJsonExample = () => {
    if (jsonType === 'college') {
      setJsonContent(SERIES_EXAMPLE_JSON)
    } else {
      setJsonContent(SUPERIEUR_SERIES_EXAMPLE_JSON)
    }
  }

  const handleJsonSubmit = async () => {
    if (jsonStatus !== 'valid') return

    setIsSubmitting(true)
    try {
      let cleanedContent = extractJson(jsonContent)
      let parsed;
      try {
        parsed = JSON.parse(cleanedContent)
      } catch (e) {
        const fixed = sanitizeJsonString(cleanedContent)
        parsed = JSON.parse(fixed)
      }

      let seriesPayload: any;

      if (jsonType === 'college') {
        // Use auto-generated title from lesson
        seriesPayload = {
          ...context,
          title: seriesTitle,
          description,
          exercises: parsed.map((e: any) => ({
            problemTextFr: e.problemTextFr,
            solutionFr: e.solutionFr,
            hints: (e.hints || []).filter((h: string) => h.trim() !== "")
          }))
        }
      } else {
        // Supérieur: JSON contains Series info
        const exercisesMapped = parsed.exercises.map((ex: any) => {
          // Format flattened text
          const problemText = `**${ex.title}**\n\n` +
            ex.questions.map((q: any, i: number) => `${i + 1}. ${q.question}`).join('\n\n')

          const solutionText = ex.questions.map((q: any, i: number) => `**${i + 1}.**\n${q.solution}`).join('\n\n')

          const allHints = ex.questions.flatMap((q: any) => q.hints || [])

          return {
            problemTextFr: problemText,
            solutionFr: solutionText,
            hints: allHints
          }
        })

        seriesPayload = {
          ...context,
          title: parsed.title,
          description: parsed.description || "",
          exercises: exercisesMapped
        }
      }

      const result = await createSeriesWithExercises(seriesPayload)

      if (result.success) {
        toast.success("Série créée avec succès")
        router.push(`/admin/exercises/series/${result.data?.id}`)
      } else {
        toast.error("Erreur lors de la création: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors du traitement")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Mode Toggle */}
      <div className="flex justify-center pb-4">
        <Tabs value={mode} onValueChange={(v) => {
          const newMode = v as 'form' | 'json'
          setMode(newMode)
          if (newMode === 'json' && !jsonContent) {
            setJsonContent(jsonType === 'college' ? SERIES_EXAMPLE_JSON : SUPERIEUR_SERIES_EXAMPLE_JSON)
          }
        }} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">
              <LayoutList className="w-4 h-4 mr-2" /> Mode Formulaire
            </TabsTrigger>
            <TabsTrigger value="json">
              <FileJson className="w-4 h-4 mr-2" /> Mode JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* AI Prompt Generator */}
      <AIPromptGenerator lesson={lesson} context={context} />

      {mode === 'form' ? (
        // --- FORM MODE UI ---
        <>
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
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
                <Button onClick={loadExample} variant="secondary">
                  <FileText className="w-4 h-4 mr-2" /> Charger un exemple
                </Button>
                <Button onClick={addExercise} variant="outline">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter un exercice
                </Button>
              </div>
            </div>

            {exercises.map((exercise, index) => (
              <Card key={exercise.id} className="relative">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    Exercice {index + 1}
                  </CardTitle>
                  {exercises.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90"
                      onClick={() => removeExercise(exercise.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Énoncé *</Label>
                    <Textarea
                      placeholder="Énoncé de l'exercice..."
                      className="min-h-[100px]"
                      value={exercise.problemTextFr}
                      onChange={(e) => updateExercise(exercise.id, "problemTextFr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Solution détaillée *</Label>
                    <Textarea
                      placeholder="Solution détaillée étape par étape..."
                      className="min-h-[100px]"
                      value={exercise.solutionFr}
                      onChange={(e) => updateExercise(exercise.id, "solutionFr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <Label className="text-base font-semibold">Indices</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Les indices apparaissent progressivement. Ils doivent aider sans donner la réponse.
                    </p>
                    {exercise.hints.map((hint, hintIndex) => (
                      <div key={hintIndex} className="flex gap-2 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm">
                          {hintIndex + 1}
                        </div>
                        <Input
                          placeholder={`Indice ${hintIndex + 1}`}
                          value={hint}
                          onChange={(e) => updateHint(exercise.id, hintIndex, e.target.value)}
                          className="flex-1"
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
                  <Save className="w-4 h-4 mr-2" /> Enregistrer la série
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        // --- JSON MODE UI ---
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Import JSON</span>
                <Select value={jsonType} onValueChange={(v) => {
                  const newType = v as 'college' | 'superieur'
                  setJsonType(newType)
                  setJsonContent(newType === 'college' ? SERIES_EXAMPLE_JSON : SUPERIEUR_SERIES_EXAMPLE_JSON)
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Type de JSON" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="college">Standard (College/Lycée)</SelectItem>
                    <SelectItem value="superieur">Complexe (Supérieur)</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
              <CardDescription>
                {jsonType === 'college'
                  ? "Collez un simple tableau d'exercices. Le titre et la description doivent être renseignés ci-dessous."
                  : "Collez une structure complète incluant titre, description et exercices imbriqués."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="flex justify-end gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showPreview ? "Masquer" : "Afficher"} l'aperçu
                </Button>
                <Button variant="secondary" size="sm" onClick={loadJsonExample}>
                  <FileText className="w-4 h-4 mr-2" /> Charger un exemple {jsonType === 'college' ? 'Standard' : 'Complexe'}
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
                      <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Valide
                      </span>
                    </div>
                  )}
                  {jsonStatus === 'error' && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold">
                        <AlertCircle className="w-3 h-3 mr-1" /> Invalide
                      </span>
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
                  <AlertTitle>Erreur de format</AlertTitle>
                  <AlertDescription>
                    {jsonErrorMsg}
                  </AlertDescription>
                </Alert>
              )}

              {jsonStatus === 'valid' && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-400">JSON Valide</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    La structure est correcte et prête à être importée.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 bg-background/80 backdrop-blur-sm p-4 border rounded-lg shadow-lg">
            <Button variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button
              onClick={handleJsonSubmit}
              disabled={isSubmitting || jsonStatus !== 'valid'}
              className={jsonStatus === 'valid' ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            >
              {isSubmitting ? (
                <>Importation...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Créer la série depuis JSON
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
