"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Save, Loader2, Plus, X, Upload, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateExercise, getExerciseById, getLessons } from "@/actions/content"
import { uploadExerciseCorrection } from "@/actions/upload"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { AiGeneratorModal } from "@/components/admin/ai-generator-modal"
import { getAiContexts } from "@/actions/ai-context"
import { insertAtCursor } from "@/lib/textarea-utils"

export default function EditExercisePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lessons, setLessons] = useState<any[]>([])
  const [aiContexts, setAiContexts] = useState<{ id: string; name: string }[]>([])
  const [hints, setHints] = useState<string[]>([""])
  const [correctionFile, setCorrectionFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    problemTextFr: "",
    solutionFr: "",
    difficulty: "INTERMEDIATE",
    lessonId: "none",
    correctionFileUrl: ""
  })

  const problemTextareaRef = useRef<HTMLTextAreaElement>(null)
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exerciseResult, lessonsResult, contextsResult] = await Promise.all([
          getExerciseById(params.id),
          getLessons(),
          getAiContexts()
        ])

        if (lessonsResult.success && lessonsResult.data) {
          setLessons(lessonsResult.data)
        }

        if (contextsResult.success && contextsResult.data) {
          setAiContexts(contextsResult.data)
        }

        if (exerciseResult.success && exerciseResult.data) {
          const exercise = exerciseResult.data
          setFormData({
            problemTextFr: exercise.problemTextFr,
            solutionFr: exercise.solutionFr,
            difficulty: exercise.difficulty,
            lessonId: exercise.lessonId || "none",
            correctionFileUrl: exercise.correctionFileUrl || ""
          })
          setHints(exercise.hints && exercise.hints.length > 0 ? exercise.hints : [""])
        } else {
          toast.error("Erreur lors du chargement de l'exercice")
          router.push("/admin/exercises")
        }
      } catch (error) {
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router])

  const handleAddHint = () => {
    setHints([...hints, ""])
  }

  const handleRemoveHint = (index: number) => {
    const newHints = [...hints]
    newHints.splice(index, 1)
    setHints(newHints)
  }

  const handleHintChange = (index: number, value: string) => {
    const newHints = [...hints]
    newHints[index] = value
    setHints(newHints)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorrectionFile(e.target.files?.[0] ?? null)
  }

  const handleSave = async () => {
    if (!formData.problemTextFr || !formData.solutionFr) {
      toast.error("Veuillez remplir l'énoncé et la solution")
      return
    }

    setIsSaving(true)
    try {
      let correctionFileUrl = formData.correctionFileUrl

      if (correctionFile) {
        const fd = new FormData()
        fd.append("correctionFile", correctionFile)
        const uploadRes = await uploadExerciseCorrection(fd)
        if (!uploadRes.success) {
          toast.error("Échec du téléchargement de la correction")
          setIsSaving(false)
          return
        }
        correctionFileUrl = uploadRes.url
      }

      const updateData = {
        problemTextFr: formData.problemTextFr,
        solutionFr: formData.solutionFr,
        hints: hints.filter(h => h.trim() !== ""),
        difficulty: formData.difficulty as any,
        lessonId: formData.lessonId === "none" ? undefined : formData.lessonId,
        correctionFileUrl
      }

      const result = await updateExercise(params.id, updateData)

      if (result.success) {
        toast.success("Exercice mis à jour avec succès !")
        router.push("/admin/exercises")
      } else {
        toast.error("Erreur lors de la mise à jour: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la mise à jour")
    } finally {
      setIsSaving(false)
    }
  }

  const canUpload = session?.user?.role === "ADMIN"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/exercises">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier l'Exercice</h1>
            <p className="text-sm text-gray-500">Modifier le contenu et les paramètres de l'exercice</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer
        </Button>
      </div>

      <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Difficulté</label>
            <Select
              value={formData.difficulty}
              onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Débutant</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermédiaire</SelectItem>
                <SelectItem value="ADVANCED">Avancé</SelectItem>
                <SelectItem value="CHALLENGE">Challenge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Leçon Liée (Optionnel)</label>
            <Select
              value={formData.lessonId}
              onValueChange={(v) => setFormData({ ...formData, lessonId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une leçon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.titleFr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Énoncé (Markdown / LaTeX)</label>
            <div className="flex items-center gap-2">
              <AiGeneratorModal
                mode="EXERCISE"
                contexts={aiContexts}
                onGenerate={(data) => {
                  if (data.problemText) {
                    setFormData(prev => ({ ...prev, problemTextFr: data.problemText, solutionFr: data.solution || "" }))
                    if (data.hints && Array.isArray(data.hints)) {
                      setHints(data.hints)
                    }
                  }
                }}
              />
              <VideoUploadManager
                entityType="exercise"
                entityId={params.id}
                onInsert={(url) => {
                  insertAtCursor(
                    problemTextareaRef.current,
                    "\n[Regarder la vidéo](" + url + ")\n",
                    formData.problemTextFr,
                    (newValue) => setFormData(prev => ({ ...prev, problemTextFr: newValue }))
                  );
                  toast.success("Vidéo insérée");
                }}
              />
              <ImageUploadManager
                entityType="exercise"
                entityId={params.id}
                onInsert={(latex) => {
                  insertAtCursor(
                    problemTextareaRef.current,
                    "\n" + latex + "\n",
                    formData.problemTextFr,
                    (newValue) => setFormData(prev => ({ ...prev, problemTextFr: newValue }))
                  );
                  toast.success("Image ajoutée à l'énoncé");
                }}
              />
            </div>
          </div>
          <Textarea
            ref={problemTextareaRef}
            className="min-h-[150px] font-mono text-sm"
            placeholder="Énoncé de l'exercice..."
            value={formData.problemTextFr}
            onChange={(e) => setFormData({ ...formData, problemTextFr: e.target.value })}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Solution (Markdown / LaTeX)</label>
            <div className="flex items-center gap-2">
              <VideoUploadManager
                entityType="exercise"
                entityId={params.id}
                onInsert={(url) => {
                  insertAtCursor(
                    solutionTextareaRef.current,
                    "\n[Regarder la vidéo](" + url + ")\n",
                    formData.solutionFr,
                    (newValue) => setFormData(prev => ({ ...prev, solutionFr: newValue }))
                  );
                  toast.success("Vidéo insérée");
                }}
              />
              <ImageUploadManager
                entityType="exercise"
                entityId={params.id}
                onInsert={(latex) => {
                  insertAtCursor(
                    solutionTextareaRef.current,
                    "\n" + latex + "\n",
                    formData.solutionFr,
                    (newValue) => setFormData(prev => ({ ...prev, solutionFr: newValue }))
                  );
                  toast.success("Image ajoutée à la solution");
                }}
              />
            </div>
          </div>
          <Textarea
            ref={solutionTextareaRef}
            className="min-h-[150px] font-mono text-sm"
            placeholder="Solution détaillée..."
            value={formData.solutionFr}
            onChange={(e) => setFormData({ ...formData, solutionFr: e.target.value })}
          />
        </div>

        {/* Correction File Upload */}
        {canUpload && (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Fichier de Correction (PDF, DOCX)
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="max-w-md bg-white dark:bg-gray-900"
              />
              {correctionFile ? (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {correctionFile.name}
                </span>
              ) : formData.correctionFileUrl ? (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Fichier actuel disponible
                </span>
              ) : null}
            </div>
            {formData.correctionFileUrl && (
              <p className="text-xs text-muted-foreground mt-1">
                Un fichier est déjà associé. Télécharger un nouveau fichier le remplacera.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Indices</label>
          <div className="space-y-3">
            {hints.map((hint, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Indice ${index + 1}`}
                  value={hint}
                  onChange={(e) => handleHintChange(index, e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveHint(index)} disabled={hints.length === 1}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddHint} className="mt-2">
              <Plus className="w-4 h-4 mr-2" /> Ajouter un indice
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
