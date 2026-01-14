"use client"

import { useState } from "react"
import { ExamConfigurationForm } from "./exam-configuration-form"
import { ExamPreview } from "./exam-preview"
import { ManualExamEditor } from "./manual-exam-editor"
import { GenerateExamParams, GeneratedExam, generateExamWithAI, saveExam, updateExam } from "@/actions/exams"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ExamGeneratorProps {
  isAdmin?: boolean
  initialData?: GeneratedExam & { id?: string } // Include id if editing existing exam
  initialStep?: "CONFIG" | "PREVIEW" | "MANUAL_EDITOR"
  initialParams?: {
    cycle?: string
    level?: string
    stream?: string
    semester?: number
    streamId?: string
  }
}

export function ExamGenerator({
  isAdmin = false,
  initialData,
  initialStep = "CONFIG",
  initialParams
}: ExamGeneratorProps) {
  const [step, setStep] = useState<"CONFIG" | "PREVIEW" | "MANUAL_EDITOR">(initialStep)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [examData, setExamData] = useState<GeneratedExam | null>(initialData || null)
  const [currentParams, setCurrentParams] = useState<GenerateExamParams | null>(null)
  const [includeAnswerSpace, setIncludeAnswerSpace] = useState(true)
  const router = useRouter()

  const handleConfigurationSubmit = async (params: GenerateExamParams, method: "AI" | "MANUAL", preGeneratedExam?: GeneratedExam) => {
    setCurrentParams(params)
    setIncludeAnswerSpace(params.includeAnswerSpace ?? true)

    // If exam is already generated (from series), use it directly
    if (preGeneratedExam) {
      setExamData(preGeneratedExam)
      setStep("PREVIEW")
      toast.success("Évaluation générée depuis la série avec succès !")
      return
    }

    if (method === "AI") {
      setIsGenerating(true)
      try {
        const result = await generateExamWithAI(params)

        if (result.success && result.data) {
          setExamData(result.data)
          setStep("PREVIEW")
          toast.success("Évaluation générée avec succès !")
        } else {
          toast.error(result.error || "Erreur lors de la génération")
        }
      } catch (error) {
        console.error(error)
        toast.error("Une erreur inattendue est survenue")
      } finally {
        setIsGenerating(false)
      }
    } else {
      // Manual Mode
      // Initialize exam data with configuration
      const initialExamData: GeneratedExam = {
        title: params.type === "EXAM"
          ? `Examen ${params.examType === "NATIONAL" ? "National" : params.examType === "REGIONAL" ? "Régional" : "Local"}`
          : `Contrôle N°${params.controlNumber} - Semestre ${params.semester}`,
        subtitle: params.type === "EXAM"
          ? `Session ${new Date().getFullYear()}`
          : `${params.cycle} - ${params.level}`,
        duration: "2h",
        totalPoints: 20,
        exercises: []
      }
      setExamData(initialExamData)
      setStep("MANUAL_EDITOR")
    }
  }

  const handleSave = async (data: GeneratedExam) => {
    const examId = initialData?.id
    if (!currentParams && !examId) return

    setIsSaving(true)
    try {
      if (examId) {
        // Editing existing exam
        const result = await updateExam(data, examId)
        if (result.success) {
          toast.success("Examen mis à jour avec succès !")
          router.push("/admin/exams")
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour")
        }
      } else if (currentParams) {
        // Creating new exam
        const result = await saveExam(data, currentParams, tempId)
        if (result.success) {
          toast.success("Examen sauvegardé avec succès !")
          router.push("/admin/exams")
        } else {
          toast.error(result.error || "Erreur lors de la sauvegarde")
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("Impossible de sauvegarder l'examen")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (initialStep === "MANUAL_EDITOR" && step === "MANUAL_EDITOR") {
      router.back()
    } else {
      setStep("CONFIG")
    }
  }

  // Generate a temporary ID for new exams to allow image uploads
  const [tempId] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`)

  return (
    <div className="w-full">
      {step === "CONFIG" && (
        <ExamConfigurationForm
          onGenerate={handleConfigurationSubmit}
          isGenerating={isGenerating}
          initialParams={initialParams}
        />
      )}

      {step === "PREVIEW" && examData && (
        <ExamPreview
          exam={examData}
          onBack={handleBack}
          onSave={isAdmin ? handleSave : undefined}
          isSaving={isSaving}
          includeAnswerSpace={includeAnswerSpace}
        />
      )}

      {step === "MANUAL_EDITOR" && examData && (
        <ManualExamEditor
          initialData={examData}
          examId={initialData?.id || tempId} // Pass exam ID (or temp ID) for image uploads
          cycle={currentParams?.cycle}
          onBack={handleBack}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}
