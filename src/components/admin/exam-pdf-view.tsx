"use client"

import { ExamPreview } from "@/components/exams/exam-preview"
import { GeneratedExam } from "@/actions/exams"
import { useRouter } from "next/navigation"

import { PrintOptimizer } from "@/components/print/print-optimizer"

interface ExamPdfViewProps {
  exam: GeneratedExam
}

export function ExamPdfView({ exam }: ExamPdfViewProps) {
  const router = useRouter()

  // Determine if answer space was included by checking if any exercise has spaceLines > 0
  const includeAnswerSpace = exam.exercises?.some(ex => (ex.spaceLines || 0) > 0) ?? true

  return (
    <>
      <PrintOptimizer />
      <ExamPreview
        exam={exam}
        onBack={() => router.push("/admin/exams")}
        isSaving={false}
        includeAnswerSpace={includeAnswerSpace}
      />
    </>
  )
}
