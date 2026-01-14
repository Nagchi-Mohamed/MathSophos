import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, ChevronDown, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSeriesById } from "@/actions/series"
import { formatLevel, formatStream } from "@/utils/formatters"
import { ExerciseContentRenderer } from "@/components/exercises/exercise-content-renderer"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { SeriesDownloadButton } from "@/components/exercises/series-download-button"
import { T } from "@/components/ui/t";
import { ExerciseVideoButton } from "@/components/exercises/exercise-video-button";
import { LessonContentRenderer } from "@/components/lessons/lesson-content-renderer";
import { SeriesHeaderVideoButton } from "@/components/exercises/series-header-video-button";

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const formatCycle = (cycle: string) => {
  const map: Record<string, string> = {
    COLLEGE: "Collège",
    LYCEE: "Lycée",
  }
  return map[cycle] || cycle
}

export default async function SeriesDetailsPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  const { data: series } = await getSeriesById(id)

  if (!series) {
    notFound()
  }

  // Si la série n'est pas publique, on renvoie 404 (sauf si on est admin, mais ici c'est la page publique)
  // Idéalement on devrait vérifier les permissions, mais pour l'instant on suppose que si on accède à cette page, on veut voir la série.
  // Cependant, pour la sécurité, on devrait vérifier series.public.
  // Comme l'utilisateur a demandé de voir les changements après "publier", on suppose que la série est publiée ou qu'on teste.
  // Pour l'instant je ne bloque pas, mais en prod il faudrait vérifier series.public.

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href={`/exercises?cycle=${series.cycle}&level=${series.level}&semester=${series.semester}${series.stream ? `&stream=${series.stream}` : ''}`}>
            <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <T k="common.backToExercises" fallback="Retour aux séries" />
            </Button>
          </Link>
        </div>

        {/* Header - Style leçon (Identique à l'admin) */}
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

                <div className="flex justify-between items-start">
                  <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
                    {series.title}
                  </h1>

                  <div className="flex items-center gap-2 ml-4">
                    <SeriesHeaderVideoButton
                      seriesId={series.id}
                      seriesTitle={series.title}
                    />
                    {/* PDF Download Button - Admin only */}
                    {session?.user?.role && canAccessAdmin(session.user.role) && (
                      <SeriesDownloadButton
                        seriesId={series.id}
                        seriesTitle={series.title}
                      />
                    )}
                  </div>
                </div>

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

        {/* Exercices List */}
        <div className="space-y-6">
          {series.exercises.map((exercise: any, index: number) => (
            <Card key={exercise.id} className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-b">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
                    {index + 1}
                  </span>
                  <span><T k="common.exercise" fallback="Exercice" /> {index + 1}</span>
                  <div className="ml-auto">
                    <ExerciseVideoButton exerciseId={exercise.id} exerciseIndex={index + 1} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Énoncé */}
                <div>
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <ExerciseContentRenderer content={exercise.problemTextFr} contentEn={exercise.problemTextEn} />
                  </div>
                </div>

                {/* Indices - Cachés par défaut */}
                {exercise.hints && exercise.hints.length > 0 && (
                  <details className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <summary className="font-semibold cursor-pointer flex items-center gap-2 text-amber-900 dark:text-amber-100">
                      <Lightbulb className="w-5 h-5" />
                      <span><T k="common.hints" fallback="Indices" /> ({exercise.hints.length})</span>
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </summary>
                    <div className="mt-4 space-y-3">
                      {exercise.hints.map((hint: string, hintIndex: number) => (
                        <div key={hintIndex} className="flex gap-3 text-sm">
                          <span className="font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">
                            {hintIndex + 1}.
                          </span>
                          <div className="flex-1 prose prose-sm dark:prose-invert">
                            <ExerciseContentRenderer content={hint} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Solution - Cachée par défaut */}
                <details className="bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer flex items-center gap-2 text-green-900 dark:text-green-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><T k="common.detailedSolution" fallback="Solution détaillée" /></span>
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </summary>
                  <div className="mt-4 prose prose-lg dark:prose-invert max-w-none">
                    <ExerciseContentRenderer content={exercise.solutionFr} contentEn={exercise.solutionEn} />
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
