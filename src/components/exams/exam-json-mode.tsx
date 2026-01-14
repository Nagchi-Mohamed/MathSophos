"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, FileText, Download, Upload } from "lucide-react"
import {
  validateExamOrControlJson,
  formatValidationErrors,
  isValidJsonSyntax,
} from "@/lib/exam-json-schemas"
import {
  getAllTemplates,
  getTemplateById,
} from "@/lib/exam-templates"
import { GeneratedExam } from "@/actions/exams"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"

interface ExamJsonModeProps {
  initialJson?: string
  examType: "EXAM" | "CONTROL"
  examId?: string
  onValidJsonChange?: (exam: GeneratedExam) => void
}

export function ExamJsonMode({
  initialJson = "",
  examType,
  examId,
  onValidJsonChange
}: ExamJsonModeProps) {
  const templates = getAllTemplates()
  const availableTemplates = examType === "EXAM" ? templates.exams : templates.controls

  // Initialize with template if no initial content
  const getInitialContent = () => {
    if (!initialJson || initialJson.trim() === "" || initialJson === "{}") {
      // Load default template based on exam type
      const defaultTemplate = examType === "EXAM"
        ? templates.exams[0].template // National exam
        : templates.controls[0].template // S1C1
      return JSON.stringify(defaultTemplate, null, 2)
    }

    // Check if initialJson has empty exercises
    try {
      const parsed = JSON.parse(initialJson)
      if (!parsed.exercises || parsed.exercises.length === 0) {
        const defaultTemplate = examType === "EXAM"
          ? templates.exams[0].template
          : templates.controls[0].template
        return JSON.stringify(defaultTemplate, null, 2)
      }
    } catch {
      // If parsing fails, use the initialJson as-is
    }

    return initialJson
  }

  const [jsonContent, setJsonContent] = React.useState(getInitialContent())
  const [validationStatus, setValidationStatus] = React.useState<'idle' | 'valid' | 'error'>('idle')
  const [validationErrors, setValidationErrors] = React.useState<string>("")
  const [syntaxError, setSyntaxError] = React.useState<string>("")

  // Use ref to avoid infinite loop with callback in useEffect
  const onValidJsonChangeRef = React.useRef(onValidJsonChange)
  React.useEffect(() => {
    onValidJsonChangeRef.current = onValidJsonChange
  }, [onValidJsonChange])

  // Validate JSON whenever content changes
  React.useEffect(() => {
    if (!jsonContent.trim()) {
      setValidationStatus('idle')
      setValidationErrors("")
      setSyntaxError("")
      return
    }

    // First check JSON syntax
    const syntaxCheck = isValidJsonSyntax(jsonContent)
    if (!syntaxCheck.valid) {
      setValidationStatus('error')
      setSyntaxError(syntaxCheck.error || "Invalid JSON syntax")
      setValidationErrors("")
      return
    }

    setSyntaxError("")

    // Then validate schema
    try {
      const parsed = JSON.parse(jsonContent)
      const result = validateExamOrControlJson(parsed)

      if (result.success) {
        setValidationStatus('valid')
        setValidationErrors("")

        // Convert to GeneratedExam format and notify parent
        if (onValidJsonChangeRef.current && result.data) {
          const exam = convertToGeneratedExam(result.data)
          onValidJsonChangeRef.current(exam)
        }
      } else {
        // Check if this is just an empty initial state (no exercises)
        const hasNoExercises = !parsed.exercises || parsed.exercises.length === 0
        const isEmptyInitial = hasNoExercises && !parsed.title && !parsed.duration

        if (isEmptyInitial) {
          // Don't show validation errors for completely empty state
          setValidationStatus('idle')
          setValidationErrors("")
        } else {
          // Show validation errors for partial/invalid content
          setValidationStatus('error')
          setValidationErrors(formatValidationErrors(result.errors || []))
        }
      }
    } catch (error: any) {
      setValidationStatus('error')
      setSyntaxError(error.message)
    }
  }, [jsonContent])

  const loadTemplate = (templateId: string) => {
    const template = getTemplateById(templateId)
    if (template) {
      setJsonContent(JSON.stringify(template, null, 2))
    }
  }

  const handleExport = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${examType.toLowerCase()}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setJsonContent(content)
      }
      reader.readAsText(file)
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonContent)
      setJsonContent(JSON.stringify(parsed, null, 2))
    } catch (error) {
      // If JSON is invalid, don't format
    }
  }

  const insertAtCursor = (text: string) => {
    // Escape backslashes for JSON strings
    // When inserting into a JSON string value, backslashes need to be double escaped
    const escapedText = text.replace(/\\/g, "\\\\")

    setJsonContent(prev => prev + "\n" + escapedText)
  }

  return (
    <div className="space-y-4">
      {/* Template and Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mode JSON</CardTitle>
              <CardDescription>
                Importez ou créez un {examType === "EXAM" ? "examen" : "contrôle"} au format JSON
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select onValueChange={loadTemplate}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Charger un modèle..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map(({ info }) => (
                    <SelectItem key={info.id} value={info.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{info.name}</span>
                        <span className="text-xs text-muted-foreground">{info.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={formatJson}>
              <FileText className="w-4 h-4 mr-2" />
              Formater JSON
            </Button>

            {examId && (
              <ImageUploadManager
                entityType="exam"
                entityId={examId}
                onInsert={insertAtCursor}
              />
            )}

            <Button variant="outline" size="sm" onClick={handleExport} disabled={validationStatus !== 'valid'}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label>
                <Upload className="w-4 h-4 mr-2" />
                Importer
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* JSON Editor */}
      <div className="relative">
        <Label className="mb-2 block">Éditeur JSON</Label>
        <Textarea
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          className="font-mono text-xs min-h-[500px] resize-none"
          placeholder={`Collez votre JSON ici ou chargez un modèle...

Exemple de structure:
{
  "title": "EXAMEN DE MATHÉMATIQUES",
  "subtitle": "Session 2024",
  "duration": "2h",
  "totalPoints": 20,
  "instructions": "- Durée : 2h\\n- Barème : 20 points",
  "exercises": [
    {
      "title": "Exercice 1 (5 points) : Calcul",
      "problem": "Énoncé avec LaTeX: $f(x) = x^2$",
      "solution": "Solution détaillée",
      "points": 5,
      "spaceLines": 10
    }
  ]
}`}
        />

        {/* Validation Status Indicator */}
        <div className="absolute bottom-3 right-3">
          {validationStatus === 'valid' && (
            <span className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              JSON Valide
            </span>
          )}
          {validationStatus === 'error' && (
            <span className="flex items-center text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              JSON Invalide
            </span>
          )}
        </div>
      </div>

      {/* Syntax Error Alert */}
      {syntaxError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de syntaxe JSON</AlertTitle>
          <AlertDescription className="font-mono text-xs">
            {syntaxError}
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors Alert */}
      {validationErrors && !syntaxError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreurs de validation</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
            {validationErrors}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {validationStatus === 'valid' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-400">JSON Valide</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            La structure est correcte et prête à être utilisée. Vous pouvez basculer en mode visuel pour prévisualiser.
          </AlertDescription>
        </Alert>
      )}

      {/* JSON Schema Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aide - Structure JSON</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>
            <strong>Champs requis:</strong>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              <li><code>title</code>: Titre de l'examen/contrôle</li>
              <li><code>duration</code>: Durée (format: "2h", "1h30min", "55min")</li>
              <li><code>totalPoints</code>: Total des points (nombre)</li>
              <li><code>exercises</code>: Tableau d'exercices</li>
            </ul>
          </div>
          <div>
            <strong>Structure d'un exercice:</strong>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              <li><code>title</code>: Titre de l'exercice</li>
              <li><code>problem</code>: Énoncé (Markdown/LaTeX)</li>
              <li><code>solution</code>: Solution détaillée</li>
              <li><code>points</code>: Points de l'exercice</li>
              <li><code>spaceLines</code>: Lignes pour la réponse (optionnel)</li>
            </ul>
          </div>
          {examType === "CONTROL" && (
            <div>
              <strong>Champs spécifiques aux contrôles:</strong>
              <ul className="list-disc list-inside ml-2 text-muted-foreground">
                <li><code>semester</code>: Numéro du semestre (1 ou 2)</li>
                <li><code>controlNumber</code>: Numéro du contrôle (1, 2, ou 3)</li>
              </ul>
            </div>
          )}
          <div className="pt-2 border-t">
            <strong>LaTeX:</strong>
            <p className="text-muted-foreground">
              Utilisez <code>$...$</code> pour les formules inline et <code>$$...$$</code> pour les formules display.
              N'oubliez pas d'échapper les backslashes dans le JSON: <code>\\frac</code> devient <code>"\\\\frac"</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Convert validated JSON to GeneratedExam format
 */
function convertToGeneratedExam(data: any): GeneratedExam {
  // Handle both exam and control formats
  const isControl = 'semester' in data && 'controlNumber' in data

  const title = isControl
    ? `CONTRÔLE CONTINU N°${data.controlNumber} - SEMESTRE ${data.semester}`
    : data.title

  return {
    title,
    subtitle: data.subtitle || "",
    duration: data.duration,
    instructions: data.instructions || "",
    totalPoints: data.totalPoints,
    exercises: data.exercises.map((ex: any) => ({
      title: ex.title,
      problem: ex.problem,
      solution: ex.solution,
      points: ex.points,
      spaceLines: ex.spaceLines || 0,
    })),
  }
}
