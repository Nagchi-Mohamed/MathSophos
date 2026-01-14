import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSeriesById } from "@/actions/series"
import { SeriesPublishButton } from "@/components/exercises/series-publish-button"
import { DeleteSeriesButton } from "@/components/exercises/delete-series-button"
import { SeriesDetailsClient } from "@/components/exercises/series-details-client"
import { formatLevel, formatStream } from "@/utils/formatters"
import { SeriesPdfDownloadButton } from "@/components/exercises/series-pdf-download-button"
import { LessonContentRenderer } from "@/components/lessons/lesson-content-renderer"
import { SeriesHeaderVideoButton } from "@/components/exercises/series-header-video-button"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const formatCycle = (cycle: string) => {
  const map: Record<string, string> = {
    PRIMAIRE: "Primaire",
    COLLEGE: "Collège",
    LYCEE: "Lycée",
  }
  return map[cycle] || cycle
}

export default async function SeriesDetailsPage({ params }: PageProps) {
  const { id } = await params
  const { data: series } = await getSeriesById(id)

  if (!series) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href={`/admin/exercises/series?cycle=${series.cycle}&level=${series.level}&semester=${series.semester}&stream=${series.stream || ''}`}>
            <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>
        </div>

        {/* Header - Style leçon */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Logo et nom de l'app */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold">MathSophos</div>
                    <div className="text-sm text-blue-100">Par {process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi"}</div>
                  </div>
                </div>

                <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
                  {series.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {series.cycle === "SUPERIEUR" ? (
                    <>
                      {series.educationalStream && (
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                          Filière: {series.educationalStream.name}
                        </Badge>
                      )}
                      {series.lesson?.module && (
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                          Module: {series.lesson.module.name}
                        </Badge>
                      )}
                      {series.lesson && (
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                          Leçon: {series.lesson.titleFr}
                        </Badge>
                      )}
                      {series.lesson?.chapters && series.lesson.chapters.length > 0 && (() => {
                        // Try to find chapter from series title (format: "Série: {chapterTitle}")
                        const seriesTitleMatch = series.title.match(/Série:\s*(.+)/);
                        const chapterTitle = seriesTitleMatch ? seriesTitleMatch[1].trim() : null;
                        const chapter = chapterTitle
                          ? series.lesson.chapters.find((ch: any) =>
                            ch.titleFr === chapterTitle ||
                            ch.titleFr.includes(chapterTitle) ||
                            chapterTitle.includes(ch.titleFr)
                          )
                          : series.lesson.chapters[0]; // Fallback to first chapter

                        return chapter ? (
                          <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                            Chapitre {chapter.chapterNumber}: {chapter.titleFr}
                          </Badge>
                        ) : null;
                      })()}
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        {series.exercises.length} exercices
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        {formatCycle(series.cycle)}
                      </Badge>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        {formatLevel(series.level)}
                      </Badge>
                      {series.stream && (
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                          {formatStream(series.stream)}
                        </Badge>
                      )}
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        Semestre {series.semester}
                      </Badge>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        {series.exercises.length} exercices
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4 flex-col items-end">
                <SeriesHeaderVideoButton
                  seriesId={series.id}
                  seriesTitle={series.title}
                />
                <div className="flex gap-2 mt-2">
                  <SeriesPdfDownloadButton
                    seriesId={series.id}
                    seriesTitle={series.title}
                  />
                  <SeriesPublishButton id={series.id} isPublic={series.public} />
                  <Link href={`/admin/exercises/series/${series.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Éditer
                    </Button>
                  </Link>
                  {series.public && (
                    <Link href={`/exercises/${series.id}`} target="_blank">
                      <Button variant="secondary" size="sm">
                        Voir sur le site
                      </Button>
                    </Link>
                  )}
                  <DeleteSeriesButton seriesId={series.id} seriesTitle={series.title} />
                </div>
              </div>
            </div>
          </div>

          {/* Description - Seulement si différente de "Série d'exercices complète" */}
          {series.description && series.description !== "Série d'exercices complète" && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                <LessonContentRenderer content={series.description} />
              </div>
            </div>
          )}
        </div>

        {/* Exercices */}
        <SeriesDetailsClient exercises={series.exercises} />
      </div>
    </div>
  )
}
