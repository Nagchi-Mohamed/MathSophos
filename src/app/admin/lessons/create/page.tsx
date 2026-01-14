"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Save, Wand2, FileText, Loader2, CheckCircle2, Upload, Eye, EyeOff, Bot } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { generateMathContent, type ModelConfig } from "@/actions/ai-content-generator"
import { convertLessonJsonToMarkdown } from "@/lib/markdown-converter"
import { createLesson } from "@/actions/content"
import { uploadLessonFile } from "@/actions/upload"
import { MOROCCAN_CURRICULUM } from "@/lib/moroccan-curriculum"
import { LessonPreview } from "@/components/admin/lesson-preview"
import { getStreamById } from "@/actions/streams"
import { getModuleById } from "@/actions/modules"
import { LESSON_EXAMPLE, CHAPTER_EXAMPLE } from "@/lib/content-examples"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { insertAtCursor } from "@/lib/textarea-utils"

export default function CreateLessonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [step, setStep] = useState<"metadata" | "mode" | "create">("metadata")
  const [mode, setMode] = useState<"ai" | "manual">("manual")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [tempId] = useState(() => typeof crypto !== 'undefined' ? crypto.randomUUID() : "temp-" + Date.now())

  // Model selection state
  const [modelProvider, setModelProvider] = useState<string>("google")
  const [modelId, setModelId] = useState<string>("gemini-2.5-flash")

  const [formData, setFormData] = useState({
    title: "",
    subject: "Mathematics",
    gradeLevel: searchParams.get("level") || "",
    stream: searchParams.get("stream") || "",
    difficulty: "intermediate",
    content: "",
    aiInstructions: "",
    semester: Number(searchParams.get("semester")) || 1,
    order: 1,
    isCustomLesson: false,
    educationalStreamId: searchParams.get("streamId") || "",
    moduleId: searchParams.get("moduleId") || "",
    streamName: "",
    moduleName: "",
    cycle: searchParams.get("cycle") || "",
  })

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleLineSelected = (lineNumber: number) => {
    if (!textareaRef.current) return;

    // Find character index
    const lines = formData.content.split('\n');
    // Ensure lineNumber is within bounds
    const targetLineIndex = Math.min(Math.max(0, lineNumber - 1), lines.length - 1);

    let charIndex = 0;
    for (let i = 0; i < targetLineIndex; i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }

    // Focus and set selection
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex);

    // Center the line in the view
    const lineHeight = 20; // ~20px for text-sm
    const textareaHeight = textarea.clientHeight;
    textarea.scrollTop = (targetLineIndex * lineHeight) - (textareaHeight / 2);
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const streamId = searchParams.get("streamId")
    if (streamId) {
      getStreamById(streamId).then(res => {
        if (res.success && res.data) {
          setFormData(prev => ({
            ...prev,
            educationalStreamId: streamId,
            streamName: res.data?.name || '',
          }))
        }
      })
    }
  }, [searchParams])

  // Track if fields are locked from URL params
  const isLevelLocked = !!searchParams.get("level")
  const isStreamLocked = !!searchParams.get("stream")
  const isSemesterLocked = !!searchParams.get("semester")

  // Helper to get available lessons based on selection
  const getAvailableLessons = () => {
    if (!formData.gradeLevel) return []

    let lessons: any[] = []

    if (formData.gradeLevel.startsWith("COLLEGE")) {
      lessons = (MOROCCAN_CURRICULUM.college as any)[formData.gradeLevel] || []
    } else if (formData.gradeLevel.startsWith("LYCEE")) {
      const levelData = (MOROCCAN_CURRICULUM.lycee as any)[formData.gradeLevel]
      if (levelData) {
        if (formData.gradeLevel === "LYCEE_TC") {
          lessons = levelData.common || []
        } else if (formData.stream) {
          // Map stream to curriculum key
          let streamKey = ""
          if (formData.stream.includes("MATH")) streamKey = "SC_MATH"
          else if (formData.stream.includes("EXPERIMENTAL") || formData.stream.includes("VIE_TERRE") || formData.stream.includes("PHYSIQUE")) streamKey = "SC_EXP" // Simplified mapping
          else if (formData.stream.includes("ECONOMIE")) streamKey = "SC_ECO"
          else if (formData.stream.includes("LETTRES")) streamKey = "LETTRES"

          // For 2Bac specific mapping if needed, but let's try to match broadly first
          if (formData.gradeLevel === "LYCEE_2BAC") {
            if (formData.stream.includes("PHYSIQUE") || formData.stream.includes("VIE_TERRE")) streamKey = "SC_PHYS_SVT"
          }

          lessons = levelData[streamKey] || []
        }
      }
    }
    return lessons
  }

  const availableLessons = getAvailableLessons()

  const handleLessonSelect = (value: string) => {
    if (value === "custom") {
      setFormData({ ...formData, isCustomLesson: true, title: "", order: availableLessons.length + 1 })
    } else {
      const lesson = availableLessons.find((l: any) => l.title === value)
      if (lesson) {
        // Find the index to set default order (1-based)
        const index = availableLessons.findIndex((l: any) => l.title === value)
        setFormData({
          ...formData,
          isCustomLesson: false,
          title: lesson.title,
          semester: lesson.semester,
          order: index + 1
        })
      }
    }
  }

  const handleGenerate = async () => {
    if (!formData.title) return
    setIsGenerating(true)
    try {
      const modelConfig: ModelConfig = {
        provider: modelProvider as 'google' | 'openai' | 'deepseek',
        modelId: modelId
      }

      const result = await generateMathContent({
        contentType: "lesson",
        topic: formData.title,
        difficulty: formData.difficulty,
        gradeLevel: formData.gradeLevel,
        stream: formData.stream,
        additionalInstructions: formData.aiInstructions,
        modelConfig
      })

      if (result.success && result.data) {
        // Convert JSON to Markdown
        const markdown = convertLessonJsonToMarkdown(result.data)
        setFormData(prev => ({ ...prev, content: markdown }))
        toast.success("Contenu généré avec succès !")
      } else {
        toast.error("Erreur lors de la génération: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la génération")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("Le titre est obligatoire")
      return
    }

    if (!selectedFile && !formData.content && mode === "manual") {
      toast.error("Veuillez remplir le contenu ou télécharger un fichier")
      return
    }

    setIsSaving(true)
    try {
      let fileUrl: string | undefined

      if (selectedFile) {
        const fd = new FormData()
        fd.append("lessonFile", selectedFile)
        const uploadRes = await uploadLessonFile(fd)
        if (!uploadRes.success) {
          toast.error("Échec du téléchargement du fichier")
          setIsSaving(false)
          return
        }
        fileUrl = uploadRes.url
      }

      // If file is uploaded, include file URL in content or store separately
      let finalContent = formData.content || "{}"
      if (fileUrl && !formData.content) {
        // Store file URL reference in content if no content provided
        finalContent = JSON.stringify({ fileUrl })
      }

      // For SUPERIEUR, ensure level is UNIVERSITY
      const level = formData.cycle === "SUPERIEUR" ? "UNIVERSITY" : formData.gradeLevel

      const result = await createLesson({
        title: formData.title,
        content: finalContent,
        level: level as any,
        stream: (formData.stream || "NONE") as any,
        subject: formData.subject,
        status: "DRAFT",
        semester: formData.semester,
        order: formData.order,
        educationalStreamId: formData.educationalStreamId || undefined,
        moduleId: formData.moduleId || undefined,
      })

      if (result.success) {
        toast.success("Leçon enregistrée avec succès !")
        router.push("/admin/lessons")
      } else {
        toast.error("Erreur lors de l'enregistrement: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  const handleModelChange = (value: string) => {
    const [provider, id] = value.split(':')
    setModelProvider(provider)
    setModelId(id)
  }

  const canUpload = session?.user?.role === "ADMIN"

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/lessons">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle Leçon</h1>
            <p className="text-sm text-gray-500">
              {step === "metadata" && "Étape 1 : Informations"}
              {step === "mode" && "Étape 2 : Méthode de création"}
              {step === "create" && "Étape 3 : Édition du contenu"}
            </p>
          </div>
        </div>
        {step === "create" && (
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer
          </Button>
        )}
      </div>

      {/* Step 1: Metadata */}
      {step === "metadata" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto w-full shadow-sm">
          <div className="space-y-6">
            {/* Show module info for SUPERIEUR */}
            {formData.cycle === "SUPERIEUR" && formData.moduleName && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">Filière:</span> {formData.streamName} |
                  <span className="font-semibold ml-2">Module:</span> {formData.moduleName} |
                  <span className="font-semibold ml-2">Niveau:</span> Supérieur (Université)
                </p>
              </div>
            )}
            <div className={`grid gap-6 ${formData.cycle === "SUPERIEUR" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {/* Hide Niveau Scolaire for SUPERIEUR */}
              {formData.cycle !== "SUPERIEUR" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Niveau Scolaire
                    {isLevelLocked && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Pré-sélectionné)</span>}
                  </label>
                  <Select
                    value={formData.gradeLevel}
                    onValueChange={(v) => setFormData({ ...formData, gradeLevel: v, stream: "", title: "", isCustomLesson: false })}
                    disabled={isLevelLocked}
                  >
                    <SelectTrigger className={isLevelLocked ? "opacity-75 cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Collège</SelectLabel>
                        <SelectItem value="COLLEGE_1AC">1ère Année (1AC)</SelectItem>
                        <SelectItem value="COLLEGE_2AC">2ème Année (2AC)</SelectItem>
                        <SelectItem value="COLLEGE_3AC">3ème Année (3AC)</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Lycée</SelectLabel>
                        <SelectItem value="LYCEE_TC">Tronc Commun</SelectItem>
                        <SelectItem value="LYCEE_1BAC">1ère Bac</SelectItem>
                        <SelectItem value="LYCEE_2BAC">2ème Bac</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.gradeLevel.startsWith("LYCEE") || formData.educationalStreamId) && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Filière
                    {(isStreamLocked || formData.educationalStreamId) && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Pré-sélectionnée)</span>}
                  </label>
                  {formData.educationalStreamId ? (
                    <Input value={formData.streamName} disabled className="bg-gray-100 dark:bg-gray-800" />
                  ) : (
                    <Select
                      value={formData.stream}
                      onValueChange={(v) => setFormData({ ...formData, stream: v, title: "", isCustomLesson: false })}
                      disabled={isStreamLocked}
                    >
                      <SelectTrigger className={isStreamLocked ? "opacity-75 cursor-not-allowed" : ""}>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.gradeLevel === "LYCEE_TC" && (
                          <>
                            <SelectItem value="TC_SCIENCES">Sciences</SelectItem>
                            <SelectItem value="TC_LETTRES">Lettres</SelectItem>
                            <SelectItem value="TC_TECHNOLOGIE">Technologie</SelectItem>
                          </>
                        )}
                        {formData.gradeLevel === "LYCEE_1BAC" && (
                          <>
                            <SelectItem value="SC_MATH_A">Sc. Math A</SelectItem>
                            <SelectItem value="SC_MATH_B">Sc. Math B</SelectItem>
                            <SelectItem value="SC_EXPERIMENTAL">Sc. Expérimentales</SelectItem>
                            <SelectItem value="SC_ECONOMIE">Sc. Économiques</SelectItem>
                            <SelectItem value="LETTRES_HUMAINES">Lettres</SelectItem>
                          </>
                        )}
                        {formData.gradeLevel === "LYCEE_2BAC" && (
                          <>
                            <SelectItem value="SC_MATH_A">Sc. Math A</SelectItem>
                            <SelectItem value="SC_MATH_B">Sc. Math B</SelectItem>
                            <SelectItem value="SC_PHYSIQUE">Sc. Physiques (PC)</SelectItem>
                            <SelectItem value="SC_VIE_TERRE">SVT</SelectItem>
                            <SelectItem value="SC_ECONOMIE">Sc. Économiques</SelectItem>
                            <SelectItem value="LETTRES_HUMAINES">Lettres</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>

            {/* Lesson Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Leçon
                {formData.cycle === "SUPERIEUR" && formData.moduleName && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Générée automatiquement)</span>
                )}
              </label>
              {formData.cycle === "SUPERIEUR" && formData.moduleName ? (
                // For SUPERIEUR: Auto-generated lesson title based on module + semester
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value, isCustomLesson: true })}
                  placeholder={`${formData.moduleName} ${formData.semester}`}
                  className="bg-gray-50 dark:bg-gray-900/50"
                />
              ) : (
                <Select
                  value={formData.isCustomLesson ? "custom" : formData.title}
                  onValueChange={handleLessonSelect}
                  disabled={!formData.gradeLevel || (formData.gradeLevel.startsWith("LYCEE") && !formData.stream)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une leçon ou créer une nouvelle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom" className="font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                      ✨ Nouveau - Créer une leçon personnalisée
                    </SelectItem>
                    {availableLessons.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Leçons du programme
                        </div>
                        {availableLessons.map((lesson: any, index: number) => (
                          <SelectItem key={index} value={lesson.title}>
                            {index + 1}. {lesson.title} (S{lesson.semester})
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Custom Lesson Details - Only show for non-SUPERIEUR or when explicitly custom */}
            {formData.isCustomLesson && formData.cycle !== "SUPERIEUR" && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium mb-2">Titre de la leçon</label>
                  <Input
                    placeholder="Ex: Les Équations du Second Degré"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Order and Semester (Always visible/editable) */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Semestre
                  {isSemesterLocked && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Pré-sélectionné)</span>}
                </label>
                <Select
                  value={formData.semester.toString()}
                  onValueChange={(v) => {
                    const newSemester = parseInt(v)
                    // For SUPERIEUR, update lesson title when semester changes
                    if (formData.cycle === "SUPERIEUR" && formData.moduleName) {
                      setFormData({
                        ...formData,
                        semester: newSemester,
                        title: `${formData.moduleName} ${newSemester}`,
                      })
                    } else {
                      setFormData({ ...formData, semester: newSemester })
                    }
                  }}
                  disabled={isSemesterLocked}
                >
                  <SelectTrigger className={isSemesterLocked ? "opacity-75 cursor-not-allowed" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semestre 1</SelectItem>
                    <SelectItem value="2">Semestre 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Numéro (Ordre)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setStep("mode")}
                disabled={!formData.gradeLevel || !formData.title || (formData.gradeLevel.startsWith("LYCEE") && !formData.stream)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Suivant
              </Button>
            </div>
          </div>
        </div >
      )
      }

      {/* Step 2: Mode Selection */}
      {
        step === "mode" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mt-10">
            <div
              onClick={() => { setMode("ai"); setStep("create"); }}
              className="cursor-pointer group bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-sm hover:shadow-md text-center"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Générer avec l'IA</h3>
              <p className="text-gray-500 dark:text-gray-400">Laissez l'intelligence artificielle créer une structure complète et du contenu pour vous.</p>
            </div>

            <div
              onClick={() => {
                setMode("manual");
                setStep("create");
                // Pre-fill with example if content is empty
                if (!formData.content) {
                  const exampleContent = formData.cycle === "SUPERIEUR" ? CHAPTER_EXAMPLE : LESSON_EXAMPLE;
                  setFormData(prev => ({ ...prev, content: exampleContent }));
                }
              }}
              className="cursor-pointer group bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md text-center"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Éditeur Manuel</h3>
              <p className="text-gray-500 dark:text-gray-400">Commencez avec un exemple complet et modifiez-le selon vos besoins.</p>
            </div>
          </div>
        )
      }

      {/* Step 3: Creation */}
      {
        step === "create" && (
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden shadow-sm">
            {mode === "ai" && !formData.content && (
              <div className="p-8 max-w-2xl mx-auto w-full text-center my-auto">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Génération IA</h2>
                <p className="text-gray-500 mb-8">
                  Nous allons générer une leçon sur <strong>"{formData.title}"</strong> pour le niveau <strong>{formData.gradeLevel}</strong>.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Instructions supplémentaires (Optionnel)</label>
                  <Textarea
                    placeholder="Ex: Focus sur les applications pratiques..."
                    value={formData.aiInstructions}
                    onChange={(e) => setFormData({ ...formData, aiInstructions: e.target.value })}
                  />
                </div>


                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-6 text-lg bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Génération en cours...
                    </>
                  ) : (
                    "Lancer la génération"
                  )}
                </Button>
              </div>
            )}

            {(mode === "manual" || formData.content) && (
              <div className="flex-1 flex flex-col">
                <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-900 dark:text-white">{formData.title}</span>
                    <span>•</span>
                    <span>{formData.gradeLevel}</span>
                    <span>•</span>
                    <span>Semestre {formData.semester}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="gap-2"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPreview ? "Masquer" : "Afficher"} l'aperçu
                    </Button>
                    <ImageUploadManager
                      entityType="lesson"
                      entityId={tempId}
                      onInsert={(latex) => {
                        insertAtCursor(
                          textareaRef.current,
                          "\n" + latex + "\n",
                          formData.content,
                          (newValue) => setFormData(prev => ({ ...prev, content: newValue }))
                        );
                        toast.success("Image insérée");
                      }}
                    />
                    {mode === "ai" && (
                      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                        <Wand2 className="w-3 h-3 mr-2" />
                        Régénérer
                      </Button>
                    )}
                  </div>
                </div>

                {/* File Upload Section (Only for OWNER/ADMIN) */}
                {canUpload && (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Fichier de la leçon (PDF, DOCX, etc.)
                    </label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={handleFileChange}
                        className="max-w-md bg-white dark:bg-gray-900"
                      />
                      {selectedFile && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {selectedFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Si un fichier est téléchargé, le contenu ci-dessous sera optionnel.
                    </p>
                  </div>
                )}

                {/* Split Panel: Editor and Preview */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Editor */}
                  <div className={showPreview ? "w-1/2 border-r border-gray-200 dark:border-gray-700" : "w-full"}>
                    <Textarea
                      ref={textareaRef}
                      className="w-full h-full p-6 resize-none border-0 focus-visible:ring-0 font-mono text-sm bg-transparent"
                      placeholder={mode === "manual" ? "# Titre de la leçon\n\nCommencez à écrire ici..." : ""}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                  </div>

                  {/* Preview */}
                  {showPreview && (
                    <div className="w-1/2 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                      <LessonPreview content={formData.content} onLineSelected={handleLineSelected} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      }
    </div >
  )
}

