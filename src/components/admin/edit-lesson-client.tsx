"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Wand2, FileText, Loader2, Eye, EyeOff } from "lucide-react"
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { toast } from "sonner"
import { generateMathContent } from "@/actions/ai-content-generator"
import { updateLesson } from "@/actions/content"
import { MOROCCAN_CURRICULUM } from "@/lib/moroccan-curriculum"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { ChapterManager } from "@/components/admin/chapter-manager"
import { EducationalLevel } from "@/lib/enums"
import { createChapter, generateChapterWithAI } from "@/actions/chapters"
import { useSession } from "next-auth/react"
import { DownloadPdfButton } from "@/components/print/download-pdf-button"

import { CHAPTER_EXAMPLE } from "@/lib/content-examples"
import { LessonPreview } from "@/components/admin/lesson-preview"
import { insertAtCursor } from "@/lib/textarea-utils"
import { ReviewSessionDialog } from "@/components/admin/review-session-dialog"

interface EditLessonClientProps {
  lessonId: string
  initialData: {
    titleFr: string
    category: string | null
    level: string
    stream: string
    semester: number
    order: number
    status: string
    contentFr: string | null
    moduleId: string | null
    educationalStreamId: string | null
    slug: string | null
  }
}

export function EditLessonClient({ lessonId, initialData }: EditLessonClientProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    title: initialData.titleFr,
    subject: initialData.category || "Mathematics",
    gradeLevel: initialData.level,
    stream: initialData.stream !== "NONE" ? initialData.stream : "",
    difficulty: "intermediate",
    content: initialData.contentFr || "",
    aiInstructions: "",
    semester: initialData.semester || 1,
    order: initialData.order || 1,
    status: initialData.status,
    mode: "manual" as "manual" | "ai",
    chapterNumber: 1,
    chapterTitle: ""
  })
  const [isCreatingChapter, setIsCreatingChapter] = useState(false)
  const [chapterManagerKey, setChapterManagerKey] = useState(0)
  const lessonModuleId = initialData.moduleId
  const lessonStreamId = initialData.educationalStreamId
  const lessonSlug = initialData.slug

  const handleLineSelected = (lineNumber: number) => {
    if (!textareaRef.current) return;

    const lines = formData.content.split('\n');
    const targetLineIndex = Math.min(Math.max(0, lineNumber - 1), lines.length - 1);

    let charIndex = 0;
    for (let i = 0; i < targetLineIndex; i++) {
      charIndex += lines[i].length + 1;
    }

    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex);

    const lineHeight = 20;
    const textareaHeight = textarea.clientHeight;
    textarea.scrollTop = (targetLineIndex * lineHeight) - (textareaHeight / 2);
  }

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
          let streamKey = ""
          if (formData.stream.includes("MATH")) streamKey = "SC_MATH"
          else if (formData.stream.includes("EXPERIMENTAL") || formData.stream.includes("VIE_TERRE") || formData.stream.includes("PHYSIQUE")) streamKey = "SC_EXP"
          else if (formData.stream.includes("ECONOMIE")) streamKey = "SC_ECO"
          else if (formData.stream.includes("LETTRES")) streamKey = "LETTRES"

          if (formData.gradeLevel === "LYCEE_2BAC") {
            if (formData.stream.includes("PHYSIQUE") || formData.stream.includes("VIE_TERRE")) streamKey = "SC_PHYS_SVT"
          }

          lessons = levelData[streamKey] || []
        }
      }
    }
    return lessons
  }

  const handleGenerate = async () => {
    const isUniversity = formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY

    if (isUniversity) {
      if (!formData.chapterTitle || !formData.chapterNumber) {
        toast.error("Veuillez remplir le numéro et le titre du chapitre")
        return
      }

      setIsGenerating(true)
      try {
        const result = await generateChapterWithAI({
          lessonId: lessonId,
          chapterTitle: formData.chapterTitle,
          chapterNumber: formData.chapterNumber,
          additionalInstructions: formData.aiInstructions,
          modelConfig: {
            provider: 'google',
            modelId: 'gemini-2.5-flash'
          },
          createdById: session?.user?.id,
        })

        if (result.success && result.data) {
          const generatedContent = result.data.contentFr || ""
          setFormData(prev => ({ ...prev, content: generatedContent }))

          if (generatedContent) {
            toast.success("Contenu généré ! Création du chapitre...")
            setIsCreatingChapter(true)
            try {
              const createResult = await createChapter({
                title: formData.chapterTitle,
                lessonId: lessonId,
                chapterNumber: formData.chapterNumber,
                content: generatedContent,
                createdById: session?.user?.id,
              })

              if (createResult.success) {
                toast.success("Chapitre créé avec succès !")
                setFormData(prev => ({ ...prev, chapterTitle: "", chapterNumber: 1, content: "", aiInstructions: "" }))

                if (lessonStreamId && lessonModuleId) {
                  setTimeout(() => {
                    const redirectUrl = `/admin/lessons?cycle=SUPERIEUR&streamId=${lessonStreamId}&moduleId=${lessonModuleId}&lessonId=${lessonId}&t=${Date.now()}`
                    window.location.href = redirectUrl
                  }, 300)
                }
              } else {
                toast.error("Erreur lors de la création: " + createResult.error)
              }
            } catch (error) {
              toast.error("Une erreur est survenue lors de la création du chapitre")
            } finally {
              setIsCreatingChapter(false)
            }
          } else {
            toast.success("Contenu généré avec succès ! Vous pouvez maintenant le modifier puis le sauvegarder.")
          }
        } else {
          toast.error("Erreur lors de la génération: " + result.error)
        }
      } catch (error) {
        toast.error("Une erreur est survenue lors de la génération")
      } finally {
        setIsGenerating(false)
      }
      return
    }

    if (!formData.title) return
    setIsGenerating(true)
    try {
      const result = await generateMathContent({
        contentType: "lesson",
        topic: formData.title,
        difficulty: formData.difficulty,
        gradeLevel: formData.gradeLevel,
        stream: formData.stream,
        additionalInstructions: formData.aiInstructions
      })

      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, content: JSON.stringify(result.data, null, 2) }))
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

  const handleCreateChapter = async () => {
    if (!formData.chapterTitle || !formData.chapterNumber) {
      toast.error("Veuillez remplir le numéro et le titre du chapitre")
      return
    }

    setIsCreatingChapter(true)
    try {
      const result = await createChapter({
        title: formData.chapterTitle,
        lessonId: lessonId,
        chapterNumber: formData.chapterNumber,
        content: formData.content || undefined,
        createdById: session?.user?.id,
      })

      if (result.success) {
        toast.success("Chapitre créé avec succès !")
        setFormData(prev => ({ ...prev, chapterTitle: "", chapterNumber: 1, content: "" }))

        const isUniversity = formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY
        if (isUniversity && lessonStreamId && lessonModuleId) {
          setTimeout(() => {
            const redirectUrl = `/admin/lessons?cycle=SUPERIEUR&streamId=${lessonStreamId}&moduleId=${lessonModuleId}&lessonId=${lessonId}&t=${Date.now()}`
            window.location.href = redirectUrl
          }, 300)
        } else {
          setChapterManagerKey(prev => prev + 1)
          router.refresh()
        }
      } else {
        toast.error("Erreur: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsCreatingChapter(false)
    }
  }

  const handleSave = async () => {
    const isUniversity = formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY

    if (!isUniversity && (!formData.title || !formData.content)) {
      toast.error("Veuillez remplir le titre et le contenu")
      return
    }

    if (isUniversity && !formData.title) {
      toast.error("Veuillez remplir le titre de la leçon")
      return
    }

    setIsSaving(true)
    try {
      const result = await updateLesson(lessonId, {
        title: isUniversity ? undefined : formData.title,
        content: isUniversity ? undefined : formData.content,
        level: formData.gradeLevel as any,
        stream: (formData.stream || "NONE") as any,
        subject: formData.subject,
        status: formData.status as any,
        semester: isUniversity ? undefined : formData.semester,
        order: isUniversity ? undefined : formData.order
      })

      if (result.success) {
        toast.success("Leçon mise à jour avec succès !")

        if (isUniversity && lessonStreamId && lessonModuleId) {
          router.push(`/admin/lessons?cycle=SUPERIEUR&streamId=${lessonStreamId}&moduleId=${lessonModuleId}&lessonId=${lessonId}`)
        } else {
          router.push("/admin/lessons")
        }
      } else {
        toast.error("Erreur lors de la mise à jour: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la mise à jour")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 w-full max-w-[1800px] mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/lessons">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier la Leçon</h1>
            <p className="text-sm text-gray-500">
              Édition du contenu et des métadonnées
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {lessonSlug && (
            <DownloadPdfButton
              url={`/print/lesson/${lessonSlug}`}
              filename={`lecon-${formData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`}
              label="Télécharger PDF"
              variant="outline"
            />
          )}
          <Button
            variant="outline"
            onClick={() => setFormData(prev => ({ ...prev, status: prev.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }))}
          >
            {formData.status === "PUBLISHED" ? "Dépublier" : "Publier"}
          </Button>
          <ReviewSessionDialog
            currentContent={formData.content}
            lessonMetadata={{
              title: formData.title,
              gradeLevel: formData.gradeLevel,
              stream: formData.stream,
              subject: formData.subject
            }}
            onConfirm={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
          />
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-lg mb-4">Informations</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY
                  ? "Titre de la leçon"
                  : "Titre"}
              </label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY
                  ? "Ex: Analyse 1"
                  : ""}
                disabled={formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY}
                className={formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY
                  ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  : ""}
              />
              {(formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY) && (
                <p className="text-xs text-muted-foreground mt-1">
                  Le titre de la leçon ne peut pas être modifié ici.
                </p>
              )}
            </div>

            {/* Chapter fields for UNIVERSITY level */}
            {(formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY) && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Numéro de chapitre</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.chapterNumber || 1}
                    onChange={(e) => setFormData({ ...formData, chapterNumber: parseInt(e.target.value) || 1 })}
                    placeholder="1, 2, 3, 6, 9..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Titre du chapitre</label>
                  <Input
                    value={formData.chapterTitle || ""}
                    onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
                    placeholder="Ex: Les suites numériques"
                  />
                </div>
              </>
            )}

            {/* Hide Niveau, Filière, Semestre, Ordre for SUPERIEUR/UNIVERSITY lessons */}
            {formData.gradeLevel !== "UNIVERSITY" && formData.gradeLevel !== EducationalLevel.UNIVERSITY && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Niveau</label>
                  <Select value={formData.gradeLevel} onValueChange={(v) => setFormData({ ...formData, gradeLevel: v })}>
                    <SelectTrigger>
                      <SelectValue />
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

                {formData.gradeLevel.startsWith("LYCEE") && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Filière</label>
                    <Select value={formData.stream} onValueChange={(v) => setFormData({ ...formData, stream: v })}>
                      <SelectTrigger>
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
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Semestre</label>
                    <Select
                      value={(formData.semester || 1).toString()}
                      onValueChange={(v) => setFormData({ ...formData, semester: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semestre 1</SelectItem>
                        <SelectItem value="2">Semestre 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ordre</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.order || 1}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* AI Assistant for all levels */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-600" />
              Assistant IA
            </h3>
            <div className="space-y-4">
              {/* Mode selector for UNIVERSITY level */}
              {(formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY) && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Créer avec</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.mode === "manual" ? "default" : "outline"}
                      onClick={() => {
                        setFormData({ ...formData, mode: "manual" });
                        if (!formData.content) {
                          setFormData(prev => ({ ...prev, content: CHAPTER_EXAMPLE, mode: "manual" }));
                        }
                      }}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Manuel
                    </Button>
                    <Button
                      type="button"
                      variant={formData.mode === "ai" ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, mode: "ai" })}
                      className="flex-1"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      IA
                    </Button>
                  </div>
                </div>
              )}

              {((formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY)
                ? formData.mode === "ai"
                : true) && (
                  <>
                    <Textarea
                      placeholder="Instructions pour l'IA..."
                      value={formData.aiInstructions || ""}
                      onChange={(e) => setFormData({ ...formData, aiInstructions: e.target.value })}
                      className="text-sm"
                    />
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Générer / Compléter"}
                    </Button>
                    {/* Show create chapter button for UNIVERSITY level in manual mode or if content was manually edited */}
                    {(formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY) && formData.mode === "manual" && formData.content && (
                      <Button
                        onClick={handleCreateChapter}
                        disabled={isCreatingChapter || !formData.chapterTitle || !formData.chapterNumber}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        {isCreatingChapter ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Création...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Créer le chapitre
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              {/* Show create chapter button for manual mode UNIVERSITY level */}
              {(formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY) && formData.mode === "manual" && formData.content && (
                <Button
                  onClick={handleCreateChapter}
                  disabled={isCreatingChapter || !formData.chapterTitle || !formData.chapterNumber}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {isCreatingChapter ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Créer le chapitre
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Editor */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-12rem)]">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col flex-1 overflow-hidden shadow-sm">


            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <span className="font-medium text-sm text-gray-500">
                {formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY
                  ? "Contenu du chapitre (Markdown / LaTeX)"
                  : "Contenu de la leçon (Markdown / LaTeX)"}
              </span>
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
                {/* Show Insert image button for UNIVERSITY level in manual mode */}
                {((formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY)
                  ? formData.mode === "manual"
                  : true) && (
                    <>
                      <VideoUploadManager
                        entityType="lesson"
                        entityId={lessonId}
                        onInsert={(url) => {
                          insertAtCursor(
                            textareaRef.current,
                            "\n[Regarder la vidéo](" + url + ")\n",
                            formData.content,
                            (newValue) => setFormData(prev => ({ ...prev, content: newValue }))
                          );
                          toast.success("Vidéo insérée");
                        }}
                      />
                      <ImageUploadManager
                        entityType="lesson"
                        entityId={lessonId}
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
                    </>
                  )}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={50} minSize={20}>
                  <Textarea
                    ref={textareaRef}
                    className="flex-1 w-full h-full p-6 resize-none border-0 focus-visible:ring-0 font-mono text-sm bg-transparent"
                    placeholder={formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY
                      ? "# Contenu du chapitre..."
                      : "# Contenu de la leçon..."}
                    value={formData.content || ""}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </ResizablePanel>
                {showPreview && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50} minSize={20} className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                      <LessonPreview content={formData.content} onLineSelected={handleLineSelected} />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Section - Only for SUPERIEUR lessons */}
      {(formData.gradeLevel === "UNIVERSITY" || formData.gradeLevel === EducationalLevel.UNIVERSITY) && (
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Gestionnaire de chapitres</h3>
            <p className="text-sm text-muted-foreground">
              Vous pouvez également créer et gérer les chapitres via le gestionnaire ci-dessous, ou utiliser les champs ci-dessus pour créer un chapitre rapidement.
            </p>
          </div>
          <ChapterManager key={chapterManagerKey} lessonId={lessonId} lessonTitle={formData.title} />
        </div>
      )}
    </div>
  )
}
