import { ExamPdfView } from "@/components/admin/exam-pdf-view"
import { getExamById } from "@/actions/exams"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

interface AdminExamPdfPageProps {
  params: {
    id: string
  }
}

export default async function AdminExamPdfPage({ params }: AdminExamPdfPageProps) {
  const { id } = params
  const result = await getExamById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print:bg-white">
      <ExamPdfView exam={result.data as any} />
    </div>
  )
}
