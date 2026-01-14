"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExamType, ControlType, LessonSelection, GenerateExamParams, generateExamFromSeries, GeneratedExam } from "@/actions/exams"
import { Loader2, Plus, Trash2, GraduationCap, BookOpen, FileText, Settings2, Sparkles, AlertCircle, PenTool, Bot, List } from "lucide-react"
import { EDUCATION_SYSTEM, Cycle } from "@/lib/education-system"
import { getPaginatedLessons } from "@/actions/content"
import { getPaginatedSeries } from "@/actions/series"
import { EducationalLevel, Stream } from "@prisma/client"

interface ExamConfigurationFormProps {
  onGenerate: (params: GenerateExamParams, method: "AI" | "MANUAL", preGeneratedExam?: GeneratedExam) => void
  isGenerating: boolean
  initialParams?: {
    cycle?: string
    level?: string
    stream?: string
    semester?: number
    streamId?: string
  }
}

export function ExamConfigurationForm({
  onGenerate,
  isGenerating,
  initialParams
}: ExamConfigurationFormProps) {
  const [method, setMethod] = useState<"AI" | "MANUAL">("AI")
  const [mode, setMode] = useState<"EXAM" | "CONTROL">("EXAM")

  // Common state - initialize from URL params if provided
  const [cycle, setCycle] = useState<Cycle>((initialParams?.cycle as Cycle) || "LYCEE")
  const [level, setLevel] = useState(initialParams?.level || "LYCEE_2BAC")
  const [stream, setStream] = useState(initialParams?.stream || "SC_MATH_A")
  const [streamId, setStreamId] = useState(initialParams?.streamId || "")
  const [moduleId, setModuleId] = useState("")
  const [duration, setDuration] = useState("")
  const [includeAnswerSpace, setIncludeAnswerSpace] = useState(true)

  // Exam state
  const [examType, setExamType] = useState<ExamType>("NATIONAL")
  const [selectedLessons, setSelectedLessons] = useState<LessonSelection[]>([])
  const [currentLessonId, setCurrentLessonId] = useState("")
  const [currentPoints, setCurrentPoints] = useState(5)

  // Control state - initialize from URL params if provided
  const [semester, setSemester] = useState(initialParams?.semester || 1)
  const [controlNumber, setControlNumber] = useState(1)

  // Context/Instructions field
  const [context, setContext] = useState("")

  // Dynamic lesson loading
  const [availableLessons, setAvailableLessons] = useState<any[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)

  // Exercise series loading
  const [availableSeries, setAvailableSeries] = useState<any[]>([])
  const [isLoadingSeries, setIsLoadingSeries] = useState(false)
  const [selectedSeriesId, setSelectedSeriesId] = useState("")
  const [useSeriesMode, setUseSeriesMode] = useState(false)

  // Get available levels based on cycle (memoized to prevent infinite loops)
  const availableLevels = useMemo(() => {
    return cycle !== "SUPERIEUR" ? EDUCATION_SYSTEM[cycle].levels : []
  }, [cycle])

  // Get available streams based on cycle and level (memoized to prevent infinite loops)
  const availableStreams = useMemo(() => {
    return cycle === "LYCEE" && level
      ? EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams || []
      : []
  }, [cycle, level])

  // Track if we've initialized from URL params
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from URL params on mount only
  useEffect(() => {
    if (initialParams && !isInitialized) {
      if (initialParams.cycle) {
        setCycle(initialParams.cycle as Cycle)
      }
      if (initialParams.level) {
        setLevel(initialParams.level)
      }
      if (initialParams.stream) {
        setStream(initialParams.stream)
      }
      if (initialParams.semester) {
        setSemester(initialParams.semester)
      }
      if (initialParams.streamId) {
        setStreamId(initialParams.streamId)
      }
      setIsInitialized(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset level and stream when cycle changes (only if user manually changes it after initialization)
  useEffect(() => {
    // Only reset if we've already initialized and user is changing cycle manually
    if (!isInitialized) return

    if (cycle !== "SUPERIEUR" && availableLevels.length > 0) {
      // Check if the current level is valid for the new cycle
      const isValidLevel = availableLevels.some(l => l.value === level)
      if (!isValidLevel && availableLevels[0]) {
        setLevel(availableLevels[0].value)
        setStream("NONE")
        setSelectedLessons([])
      }
    } else if (cycle === "SUPERIEUR") {
      if (level !== "") {
        setLevel("")
        setStream("NONE")
        setSelectedLessons([])
      }
    }
  }, [cycle, isInitialized, availableLevels, level])

  // Reset stream when level changes (only if user manually changes it after initialization)
  useEffect(() => {
    // Only reset if we've already initialized and user is changing level manually
    if (!isInitialized) return

    if (cycle === "LYCEE" && availableStreams.length > 0) {
      // Check if the current stream is valid for the new level
      const isValidStream = availableStreams.some(s => s.value === stream)
      if (!isValidStream && availableStreams[0]) {
        setStream(availableStreams[0].value)
        setSelectedLessons([])
      }
    } else if (cycle !== "LYCEE" && stream !== "NONE") {
      setStream("NONE")
      setSelectedLessons([])
    }
  }, [level, cycle, isInitialized, availableStreams, stream])

  // Fetch lessons when level or stream changes
  useEffect(() => {
    const fetchLessons = async () => {
      setIsLoadingLessons(true)
      try {
        let filters: any = {}

        if (!level) {
          setAvailableLessons([])
          return
        }

        // Always filter by level for both EXAM and CONTROL modes
        filters = {
          level: level as EducationalLevel,
        }

        // For SUPERIEUR, use streamId and moduleId instead of stream
        if (cycle === "SUPERIEUR") {
          filters.level = EducationalLevel.UNIVERSITY
          if (streamId) {
            filters.educationalStreamId = streamId
          }
          if (moduleId) {
            filters.moduleId = moduleId
          }
        } else {
          // For EXAM mode, also filter by stream for LYCEE cycle
          if (mode === "EXAM" && cycle === "LYCEE" && stream && stream !== "NONE") {
            filters.stream = stream as Stream
          }
        }
        // For CONTROL mode, only filter by level (no stream filtering)

        // For SUPERIEUR, we need streamId and moduleId to fetch lessons
        if (cycle === "SUPERIEUR" && !streamId) {
          setAvailableLessons([])
          setIsLoadingLessons(false)
          return
        }

        const result = await getPaginatedLessons(1000, 0, filters) // Fetch up to 1000 lessons
        if (result.success && result.data) {
          setAvailableLessons(result.data.lessons || [])
        } else {
          setAvailableLessons([])
        }
      } catch (error) {
        console.error("Error fetching lessons:", error)
        setAvailableLessons([])
      } finally {
        setIsLoadingLessons(false)
      }
    }

    fetchLessons()
  }, [level, stream, cycle, mode, streamId, moduleId])

  // Fetch exercise series when level or stream changes
  useEffect(() => {
    const fetchSeries = async () => {
      setIsLoadingSeries(true)
      try {
        if (!level) {
          setAvailableSeries([])
          return
        }

        const filters: any = {
          level: level as EducationalLevel,
        }

        if (cycle === "LYCEE" && stream && stream !== "NONE") {
          filters.stream = stream as Stream
        }

        const result = await getPaginatedSeries(filters, 100, 0)
        if (result.success && result.data) {
          setAvailableSeries(result.data.series || [])
        } else {
          setAvailableSeries([])
        }
      } catch (error) {
        console.error("Error fetching series:", error)
        setAvailableSeries([])
      } finally {
        setIsLoadingSeries(false)
      }
    }

    fetchSeries()
  }, [level, stream, cycle])

  const handleAddLesson = () => {
    if (!currentLessonId) return
    const lesson = availableLessons.find(l => l.id === currentLessonId)
    if (lesson && !selectedLessons.find(l => l.id === lesson.id)) {
      setSelectedLessons([...selectedLessons, { ...lesson, points: currentPoints }])
      setCurrentLessonId("")
    }
  }

  const handleRemoveLesson = (id: string) => {
    setSelectedLessons(selectedLessons.filter(l => l.id !== id))
  }

  const handleGenerate = async () => {
    // If using series mode, generate from series first
    if (useSeriesMode && selectedSeriesId && method === "AI") {
      try {
        const result = await generateExamFromSeries({
          seriesId: selectedSeriesId,
          type: mode,
          cycle,
          level: cycle === "SUPERIEUR" ? EducationalLevel.UNIVERSITY : level,
          stream: cycle === "LYCEE" ? stream : undefined,
          streamId: cycle === "SUPERIEUR" ? streamId : undefined,
          moduleId: cycle === "SUPERIEUR" ? moduleId : undefined,
          examType: mode === "EXAM" ? examType : undefined,
          semester: mode === "CONTROL" && cycle !== "SUPERIEUR" ? semester : undefined,
          controlNumber: mode === "CONTROL" ? controlNumber : undefined,
          includeAnswerSpace
        })

        if (result.success && result.data) {
          // Pass the generated exam directly to preview
          onGenerate({} as GenerateExamParams, "AI", result.data)
          return
        } else {
          alert(result.error || "Erreur lors de la génération depuis la série")
          return
        }
      } catch (error) {
        console.error("Error generating from series:", error)
        alert("Erreur lors de la génération depuis la série")
        return
      }
    }

    const params: GenerateExamParams = {
      type: mode,
      cycle,
      level: cycle === "SUPERIEUR" ? EducationalLevel.UNIVERSITY : level,
      stream: cycle === "LYCEE" ? stream : undefined,
      streamId: cycle === "SUPERIEUR" ? streamId : undefined,
      moduleId: cycle === "SUPERIEUR" ? moduleId : undefined,
      duration: duration || undefined,
      includeAnswerSpace,
      context: context || undefined,
      ...(mode === "EXAM" ? {
        examType,
        lessons: selectedLessons
      } : {
        semester: cycle !== "SUPERIEUR" ? semester : undefined,
        controlNumber,
        lessons: selectedLessons // Controls can also have lesson selection
      })
    }
    onGenerate(params, method)
  }

  const totalPoints = selectedLessons.reduce((acc, l) => acc + l.points, 0)

  return (
    <Card className="w-full max-w-5xl mx-auto border-none shadow-xl bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="text-center pb-8 border-b bg-background/50 backdrop-blur-sm rounded-t-xl">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Générateur d'Évaluations
        </CardTitle>
        <CardDescription className="text-lg max-w-2xl mx-auto mt-2">
          Créez des examens et contrôles sur mesure, générés par IA ou manuellement.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8">
        {/* Method Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-lg inline-flex">
            <button
              onClick={() => setMethod("AI")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${method === "AI"
                ? "bg-background shadow-sm text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Bot className="w-4 h-4" />
              Génération IA
            </button>
            <button
              onClick={() => setMethod("MANUAL")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${method === "MANUAL"
                ? "bg-background shadow-sm text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <PenTool className="w-4 h-4" />
              Création Manuelle
            </button>
          </div>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-xl">
            <TabsTrigger
              value="EXAM"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md py-3 text-base rounded-lg transition-all"
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Examen (National/Régional)
            </TabsTrigger>
            <TabsTrigger
              value="CONTROL"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md py-3 text-base rounded-lg transition-all"
            >
              <FileText className="mr-2 h-5 w-5" />
              Contrôle Continu
            </TabsTrigger>
          </TabsList>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Core Settings */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                  <Settings2 className="h-5 w-5" />
                  <h3>Configuration Niveau</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cycle Scolaire</Label>
                    <Select value={cycle} onValueChange={(v) => setCycle(v as Cycle)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COLLEGE">Collège</SelectItem>
                        <SelectItem value="LYCEE">Lycée</SelectItem>
                        <SelectItem value="SUPERIEUR">Supérieur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {cycle !== "SUPERIEUR" && (
                    <div className="space-y-2">
                      <Label>Niveau</Label>
                      <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLevels.map((lvl) => (
                            <SelectItem key={lvl.value} value={lvl.value}>
                              {lvl.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {cycle === "LYCEE" && availableStreams.length > 0 && (
                    <div className="space-y-2">
                      <Label>Filière</Label>
                      <Select value={stream} onValueChange={setStream}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStreams.map((st) => (
                            <SelectItem key={st.value} value={st.value}>
                              {st.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Mode Specific Settings (Left Column) */}
              <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                  <FileText className="h-5 w-5" />
                  <h3>Détails Épreuve</h3>
                </div>

                <TabsContent value="EXAM" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Type d'examen</Label>
                    <Select value={examType} onValueChange={(v) => setExamType(v as ExamType)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NATIONAL">Examen National</SelectItem>
                        <SelectItem value="REGIONAL">Examen Régional</SelectItem>
                        <SelectItem value="LOCAL">Examen Local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="CONTROL" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Semestre</Label>
                      <Select value={semester.toString()} onValueChange={(v) => setSemester(Number(v))}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Semestre 1</SelectItem>
                          <SelectItem value="2">Semestre 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>N° Contrôle</Label>
                      <Select value={controlNumber.toString()} onValueChange={(v) => setControlNumber(Number(v))}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">N° 1</SelectItem>
                          <SelectItem value="2">N° 2</SelectItem>
                          <SelectItem value="3">N° 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>

            {/* Right Column: Lessons & Context (Only for AI Mode) */}
            {method === "AI" ? (
              <div className="lg:col-span-2 space-y-6">
                {/* Source Selection: Series or Lessons */}
                <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold mb-4">
                    <List className="h-5 w-5" />
                    <h3>Source des exercices</h3>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setUseSeriesMode(false)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${!useSeriesMode
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5" />
                        <span className="font-semibold">Depuis les leçons</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-left">
                        Génération IA à partir de leçons sélectionnées
                      </p>
                    </button>

                    <button
                      onClick={() => setUseSeriesMode(true)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${useSeriesMode
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <List className="h-5 w-5" />
                        <span className="font-semibold">Depuis une série</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-left">
                        Utiliser une série d'exercices existante (qualité garantie)
                      </p>
                    </button>
                  </div>
                </div>

                {/* Series Selection */}
                {useSeriesMode ? (
                  <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <List className="h-5 w-5" />
                      <h3>Sélectionner une série d'exercices</h3>
                    </div>

                    <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId} disabled={isLoadingSeries}>
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue placeholder={isLoadingSeries ? "Chargement..." : "Choisir une série..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingSeries ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p>Chargement des séries...</p>
                          </div>
                        ) : availableSeries.length > 0 ? (
                          availableSeries.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title} ({s.exercises?.length || 0} exercices)
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8 opacity-50" />
                            <p>Aucune série disponible pour ce niveau</p>
                            <p className="text-xs">Créez des séries d'exercices dans l'admin</p>
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    {selectedSeriesId && (
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm text-primary/90">
                          <strong>Avantage :</strong> Les exercices de la série sont déjà validés, progressifs et de haute qualité.
                          L'examen sera généré avec une structure professionnelle.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Lesson Selection */}
                    <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-primary font-semibold">
                          <BookOpen className="h-5 w-5" />
                          <h3>Contenu & Barème</h3>
                        </div>
                        <div className={`text-sm font-bold px-3 py-1 rounded-full ${totalPoints > 20 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          }`}>
                          Total: {totalPoints} / 20 pts
                        </div>
                      </div>

                      <div className="flex gap-3 items-end bg-muted/30 p-4 rounded-lg border border-dashed">
                        <div className="flex-1 space-y-2">
                          <Label>Ajouter une leçon</Label>
                          <Select value={currentLessonId} onValueChange={setCurrentLessonId} disabled={isLoadingLessons}>
                            <SelectTrigger className="h-11 bg-background">
                              <SelectValue placeholder={isLoadingLessons ? "Chargement..." : "Sélectionner une leçon..."} />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingLessons ? (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                  <p>Chargement des leçons...</p>
                                </div>
                              ) : availableLessons.length > 0 ? (
                                availableLessons.map(l => (
                                  <SelectItem key={l.id} value={l.id}>{l.titleFr}</SelectItem>
                                ))
                              ) : (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                  <AlertCircle className="h-8 w-8 opacity-50" />
                                  <p>Aucune leçon disponible pour ce niveau</p>
                                  <p className="text-xs">Ajoutez des leçons dans l'admin</p>
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24 space-y-2">
                          <Label>Points</Label>
                          <Input
                            type="number"
                            value={currentPoints}
                            onChange={(e) => setCurrentPoints(Number(e.target.value))}
                            min={1}
                            max={20}
                            className="h-11 bg-background text-center"
                          />
                        </div>
                        <Button onClick={handleAddLesson} size="icon" className="h-11 w-11 shrink-0">
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    {selectedLessons.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {selectedLessons.map(lesson => (
                          <div key={lesson.id} className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm group hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {lesson.points}
                              </div>
                              <span className="font-medium">{lesson.title}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLesson(lesson.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Aucune leçon sélectionnée</p>
                        <p className="text-sm opacity-70">Ajoutez des leçons pour construire votre évaluation</p>
                      </div>
                    )}

                    {/* Context & Options */}
                    <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="context" className="text-base font-semibold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          Instructions pour l'IA (Prompt)
                        </Label>
                        <Textarea
                          id="context"
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          placeholder="Ex: Utiliser uniquement des nombres entiers, inclure un problème de géométrie, niveau difficile..."
                          className="min-h-[120px] resize-none bg-muted/30 border-border focus:border-primary"
                        />
                        <p className="text-xs text-muted-foreground">
                          Plus vos instructions sont précises, meilleur sera le résultat généré par l'IA.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="duration-input">Durée de l'évaluation</Label>
                          <Input
                            id="duration-input"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="Ex: 1h30min, 2h20min, 1h, 55min"
                            className="bg-muted/30 border-border focus:border-primary"
                          />
                          <p className="text-xs text-muted-foreground">
                            Format flexible : 1h, 1h30min, 2h20min, 55min, etc.
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setIncludeAnswerSpace(!includeAnswerSpace)}>
                          <Checkbox
                            id="answer-space"
                            checked={includeAnswerSpace}
                            onCheckedChange={(c) => setIncludeAnswerSpace(c as boolean)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="answer-space" className="cursor-pointer font-medium">Espace pour les réponses</Label>
                            <p className="text-xs text-muted-foreground">Ajoute des lignes pointillées pour permettre aux élèves de répondre directement sur la feuille.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Options for Series Mode */}
                {useSeriesMode && (
                  <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setIncludeAnswerSpace(!includeAnswerSpace)}>
                        <Checkbox
                          id="answer-space-series"
                          checked={includeAnswerSpace}
                          onCheckedChange={(c) => setIncludeAnswerSpace(c as boolean)}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="answer-space-series" className="cursor-pointer font-medium">Espace pour les réponses</Label>
                          <p className="text-xs text-muted-foreground">Ajoute des lignes pointillées pour permettre aux élèves de répondre directement sur la feuille.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Manual Mode Info
              <div className="lg:col-span-2 flex flex-col items-center justify-center p-12 bg-muted/20 rounded-xl border border-dashed text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <PenTool className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mode Création Manuelle</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Vous allez être redirigé vers l'éditeur manuel où vous pourrez ajouter vos propres exercices, définir le barème et rédiger les solutions.
                </p>
                <div className="grid grid-cols-2 gap-4 text-left max-w-md w-full">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Éditeur LaTeX complet</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Aperçu en temps réel</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Gestion du barème</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Export PDF</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            <Button
              className="w-full text-lg py-8 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                (method === "AI" && !useSeriesMode && mode === "EXAM" && selectedLessons.length === 0) ||
                (method === "AI" && useSeriesMode && !selectedSeriesId)
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Génération de l'évaluation en cours...
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-2 font-bold text-xl">
                    {method === "AI" ? <Sparkles className="h-5 w-5" /> : <PenTool className="h-5 w-5" />}
                    {method === "AI" ? "Générer l'évaluation" : "Créer l'évaluation manuellement"}
                  </span>
                  <span className="text-sm font-normal opacity-90 mt-1">
                    {method === "AI" ? "Crée un document complet prêt à imprimer" : "Ouvrir l'éditeur d'examen"}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card >
  )
}
