import { ExamGenerator } from "@/components/exams/exam-generator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getExamById } from "@/actions/exams"
import { notFound } from "next/navigation"
import { DownloadPdfButton } from "@/components/print/download-pdf-button"

export const dynamic = 'force-dynamic'

interface AdminEditExamPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminEditExamPage({ params }: AdminEditExamPageProps) {
  const { id } = await params
  const result = await getExamById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const exam = result.data
  // Extract the exam content (stored as JSON in the content field)
  const examContent = exam.content as any || {}
  
  // Build the initial data structure for ExamGenerator
  const initialData = {
    id: exam.id,
    title: exam.title || examContent.title || "",
    subtitle: exam.subtitle || examContent.subtitle || "",
    duration: examContent.duration || "2h",
    totalPoints: examContent.totalPoints || 20,
    exercises: examContent.exercises || []
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/exams">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">Éditer l'examen</h1>
            <p className="text-muted-foreground">
              Modifiez le contenu de l'examen.
            </p>
          </div>
        </div>
        <DownloadPdfButton
          url={`/print/exams/${exam.id}`}
          filename={`examen-${(exam.title || 'examen').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`}
          label="Télécharger PDF"
          variant="outline"
        />
      </div>

      <ExamGenerator
        isAdmin={true}
        initialData={initialData}
        initialStep="MANUAL_EDITOR"
      />
    </div>
  )
}
