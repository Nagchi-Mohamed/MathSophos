import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ExamPdfDownloadButton } from "@/components/exams/exam-pdf-download-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, Download, Eye, Calendar, Award, BookOpen } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface ExamCardProps {
  exam: {
    id: string
    title: string
    subtitle: string | null
    type: string
    examType: string | null
    controlNumber: number | null
    semester: number
    createdAt: Date
    content?: any
  }
  showAdminActions?: boolean
}

export function ExamCard({ exam, showAdminActions = false }: ExamCardProps) {
  const getTypeLabel = () => {
    if (exam.type === "EXAM") {
      if (exam.examType === "NATIONAL") return "Examen National"
      if (exam.examType === "REGIONAL") return "Examen Régional"
      if (exam.examType === "LOCAL") return "Examen Local"
      return "Examen"
    }
    return `Contrôle N°${exam.controlNumber || 1}`
  }

  const getTypeBadgeVariant = () => {
    if (exam.type === "EXAM") {
      if (exam.examType === "NATIONAL") return "default"
      if (exam.examType === "REGIONAL") return "secondary"
      return "outline"
    }
    return "outline"
  }

  const getTypeStyles = () => {
    if (exam.type === "EXAM") {
      if (exam.examType === "NATIONAL") return {
        card: "bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950 border-blue-200 dark:border-blue-800",
        badge: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400"
      }
      if (exam.examType === "REGIONAL") return {
        card: "bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/40 dark:to-slate-950 border-purple-200 dark:border-purple-800",
        badge: "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300",
        icon: "text-purple-600 dark:text-purple-400"
      }
      return {
        card: "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-950 border-emerald-200 dark:border-emerald-800",
        badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300",
        icon: "text-emerald-600 dark:text-emerald-400"
      }
    }
    return {
      card: "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-950 border-amber-200 dark:border-amber-800",
      badge: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300",
      icon: "text-amber-600 dark:text-amber-400"
    }
  }

  const styles = getTypeStyles()

  // Extract exercise count and total points from content if available
  const exerciseCount = exam.content?.exercises?.length || 0
  const totalPoints = exam.content?.totalPoints || 20
  const duration = exam.content?.duration || "2h"

  // Determine the view link based on admin or public context
  const viewLink = showAdminActions ? `/admin/exams/${exam.id}/edit` : `/exams-controls/${exam.id}`
  const downloadLink = showAdminActions ? `/api/exams/${exam.id}/pdf` : `/exams-controls/${exam.id}?download=true`

  return (
    <Card className={`group flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border ${styles.card}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge className={`font-semibold border-none ${styles.badge}`}>
            {getTypeLabel()}
          </Badge>
          <Badge variant="outline" className="text-xs bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            Semestre {exam.semester}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
          {exam.title}
        </CardTitle>
        {exam.subtitle && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{exam.subtitle}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <BookOpen className={`h-4 w-4 flex-shrink-0 ${styles.icon}`} />
            <span className="truncate font-medium">{exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Award className={`h-4 w-4 flex-shrink-0 ${styles.icon}`} />
            <span className="truncate font-medium">{totalPoints} points</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Clock className={`h-4 w-4 flex-shrink-0 ${styles.icon}`} />
            <span className="truncate font-medium">{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Calendar className={`h-4 w-4 flex-shrink-0 ${styles.icon}`} />
            <span className="truncate text-xs font-medium">
              {formatDistanceToNow(new Date(exam.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="flex gap-2 w-full">
          {showAdminActions ? (
            <>
              <Link href={`/admin/exams/${exam.id}`} className="flex-1">
                <Button className="w-full gap-2 shadow-sm group-hover:shadow-md transition-all bg-white text-slate-900 border hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700">
                  <Eye className={`h-4 w-4 ${styles.icon}`} />
                  Voir
                </Button>
              </Link>
              <Link href={`/admin/exams/${exam.id}/edit`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <FileText className={`h-4 w-4 ${styles.icon}`} />
                  Modifier
                </Button>
              </Link>
            </>
          ) : (
            <Link href={viewLink} className="flex-1">
              <Button className="w-full gap-2 shadow-sm group-hover:shadow-md transition-all bg-white text-slate-900 border hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700">
                <Eye className={`h-4 w-4 ${styles.icon}`} />
                Consulter
              </Button>
            </Link>
          )}
          {showAdminActions && (
            <div className="ml-1">
              <ExamPdfDownloadButton
                examId={exam.id}
                examTitle={exam.title}
                variant="outline"
                size="icon"
                className="bg-transparent border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
              />
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
