"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react"
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
import { createExercise, getLessons } from "@/actions/content"
import { AiGeneratorModal } from "@/components/admin/ai-generator-modal"
import { ImageUploadButton } from "@/components/admin/image-upload-button"
import { getAiContexts } from "@/actions/ai-context"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"

export default function CreateExercisePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [lessons, setLessons] = useState<any[]>([])
  const [aiContexts, setAiContexts] = useState<{ id: string; name: string }[]>([])
  const [hints, setHints] = useState<string[]>([""])

  const [formData, setFormData] = useState({
    problemTextFr: "",
    solutionFr: "",

    lessonId: "none"
  })

  useEffect(() => {
    const fetchData = async () => {
      const lessonsResult = await getLessons()
      if (lessonsResult.success && lessonsResult.data) {
        setLessons(lessonsResult.data)
      }

      const contextsResult = await getAiContexts()
      if (contextsResult.success && contextsResult.data) {
        setAiContexts(contextsResult.data)
      }
    }
    fetchData()
  }, [])

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

  const handleSave = async () => {
    if (!formData.problemTextFr || !formData.solutionFr) {
      toast.error("Veuillez remplir l'énoncé et la solution")
      return
    }

    setIsSaving(true)
    try {
      const result = await createExercise({
        problemTextFr: formData.problemTextFr,
        solutionFr: formData.solutionFr,
        hints: hints.filter(h => h.trim() !== ""),

        lessonId: formData.lessonId === "none" ? undefined : formData.lessonId
      })

      if (result.success) {
        toast.success("Exercice créé avec succès !")
        router.push("/admin/exercises")
      } else {
        toast.error("Erreur lors de la création: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la création")
    } finally {
      setIsSaving(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvel Exercice</h1>
            <p className="text-sm text-gray-500">Créer un nouvel exercice pour la banque de problèmes</p>
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Énoncé (Markdown / LaTeX)</label>
            <AiGeneratorModal
              mode="EXERCISE"
              contexts={aiContexts}
              onGenerate={(data) => {
                if (data.problemText) {
                  setFormData({ ...formData, problemTextFr: data.problemText, solutionFr: data.solution || "" })
                }
              }}
            />
          </div>
          <Textarea
            className="min-h-[150px] font-mono text-sm"
            placeholder="Énoncé de l'exercice..."
            value={formData.problemTextFr}
            onChange={(e) => setFormData({ ...formData, problemTextFr: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Solution (Markdown / LaTeX)</label>
            <ImageUploadButton
              folder="exercises"
              onImageUploaded={(latexCode) => {
                setFormData(prev => ({ ...prev, solutionFr: prev.solutionFr + "\n" + latexCode }));
                toast.success("Image ajoutée à la solution");
              }}
            />
          </div>
          <Textarea
            className="min-h-[150px] font-mono text-sm"
            placeholder="Solution détaillée..."
            value={formData.solutionFr}
            onChange={(e) => setFormData({ ...formData, solutionFr: e.target.value })}
          />
        </div>

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
