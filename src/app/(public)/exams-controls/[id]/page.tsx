import { getExamById, getRelatedExams } from "@/actions/exams"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Download, Clock, Calendar, GraduationCap, BookOpen, FileText } from "lucide-react"
import { ExerciseContentRenderer } from "@/components/exercises/exercise-content-renderer"
import { ExamCard } from "@/components/ui/exam-card"
import { formatLevel, formatStream } from "@/utils/formatters"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { ExamPdfDownloadButton } from "@/components/exams/exam-pdf-download-button"
import { ExamHeaderVideoButton } from "@/components/exams/exam-header-video-button"

export const revalidate = 60

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ download?: string }>
}

export default async function ExamDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { download } = await searchParams

  const examResult = await getExamById(id)

  if (!examResult.success || !examResult.data) {
    notFound()
  }

  const exam = examResult.data
  const content = exam.content as any

  // Extract metadata from content (for Supérieur exams)
  const metadata = content?.metadata || {}
  const streamName = metadata.streamName
  const moduleName = metadata.moduleName
  const lessonName = metadata.lessonName

  // Get related exams
  const relatedResult = await getRelatedExams(id)
  const relatedExams = relatedResult.success ? relatedResult.data : []

  const getTypeLabel = () => {
    if (exam.type === "EXAM") {
      if (exam.examType === "NATIONAL") return "Examen National"
      if (exam.examType === "REGIONAL") return "Examen Régional"
      if (exam.examType === "LOCAL") return "Examen Local"
      return "Examen"
    }
    return `Contrôle Continu N°${exam.controlNumber || 1}`
  }

  const getTypeBadgeVariant = () => {
    if (exam.type === "EXAM") {
      if (exam.examType === "NATIONAL") return "default"
      if (exam.examType === "REGIONAL") return "secondary"
      return "outline"
    }
    return "outline"
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/exams-controls" className="hover:text-primary transition-colors">
            Examens et Contrôles
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{exam.title}</span>
        </div>

        {/* Professional Exam Header - Matching Lesson Header Design */}
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-8 mb-8 shadow-lg">
          {/* Top Section - Branding & Professor */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-md">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary">MathSophos</h3>
                <p className="text-sm text-muted-foreground">Plateforme d'apprentissage des mathématiques</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-background/80 px-6 py-3 rounded-lg border border-primary/30 shadow-sm">
              <GraduationCap className="w-6 h-6 text-primary" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Professeur</p>
                <p className="font-bold text-lg text-foreground">{process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi"}</p>
              </div>
            </div>
          </div>

          {/* Exam Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {streamName && (
              <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Filière</p>
                <p className="font-semibold text-base">{streamName}</p>
              </div>
            )}
            {(lessonName || moduleName) && (
              <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Module</p>
                <p className="font-semibold text-base">{lessonName || moduleName}</p>
              </div>
            )}
            {content?.duration && (
              <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Durée</p>
                <p className="font-semibold text-base">{content.duration}</p>
              </div>
            )}
          </div>

          {/* Exam Type Badge */}
          <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-md">
            {streamName && lessonName ? (
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                Examen {streamName} {lessonName}
              </h1>
            ) : null}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {exam.cycle !== "SUPERIEUR" && (
                  <>
                    <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                      {formatLevel(exam.level)}
                    </Badge>
                    {exam.stream && exam.stream !== 'NONE' && (
                      <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                        {formatStream(exam.stream)}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                      Semestre {exam.semester}
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <ExamHeaderVideoButton
                  examId={exam.id}
                  examTitle={exam.title}
                />
                <Link href="/exams-controls">
                  <Button variant="secondary" size="sm" className="gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </Button>
                </Link>
                <ExamPdfDownloadButton
                  examId={exam.id}
                  examTitle={exam.title}
                  variant="secondary"
                  size="sm"
                  className="gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Exam Content */}
        <Card className="mb-8">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-2xl">Contenu de l'examen</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-8">
              {content?.exercises?.map((exercise: any, index: number) => {
                return (
                  <div key={index} className="border-l-4 border-slate-300 dark:border-slate-600 pl-6 py-4 rounded-r-lg bg-slate-50 dark:bg-slate-800/50 border-b-0 last:border-0 pb-8 last:pb-0">
                    <div className="flex justify-between items-baseline mb-4 flex-wrap gap-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{exercise.title}</h3>
                      <div className="flex gap-2 items-center">
                        <Badge variant="secondary" className="text-sm bg-blue-700 text-white dark:bg-blue-800 dark:text-blue-100">
                          {exercise.points} points
                        </Badge>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none dark:prose-invert mb-6 text-slate-800 dark:text-slate-200">
                      <ExerciseContentRenderer content={exercise.problem} />
                    </div>

                    {exercise.solution && (
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                            <span className="font-medium">Voir la solution</span>
                            <span className="transform group-open:rotate-180 transition-transform">▼</span>
                          </div>
                        </summary>
                        <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border-l-4 border-green-500">
                          <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3">Solution :</h4>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ExerciseContentRenderer content={exercise.solution} />
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Related Exams */}
        {relatedExams && relatedExams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Examens similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedExams.map((relatedExam: any) => (
                <ExamCard key={relatedExam.id} exam={relatedExam} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 20mm;
            size: A4;
          }
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          header, footer, nav {
            display: none !important;
          }
          details {
            display: none !important;
          }
        }
      `}} />
    </div>
  )
}
