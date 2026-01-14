import Link from "next/link"

import { Plus, BookOpen, School, Calculator, GraduationCap, Search, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { getPaginatedSeries, getLessonsForParams } from "@/actions/series"
import { SeriesCreationForm } from "@/components/exercises/series-creation-form"
import { getChaptersByLesson } from "@/actions/chapters"
import { getLessonById } from "@/actions/content"
import { EducationalLevel } from "@/lib/enums"
import { SeriesCard } from "@/components/ui/series-card"

export default async function SeriesPage({ searchParams }: { searchParams: Promise<{ cycle?: string; level?: string; stream?: string; semester?: string; streamId?: string; moduleId?: string; lessonId?: string }> }) {
  const resolvedParams = await searchParams
  const { cycle, level, stream, semester, streamId, moduleId, lessonId } = resolvedParams

  // If any param missing, redirect back to selection flow
  if (cycle === "SUPERIEUR") {
    if (!streamId || !moduleId || !lessonId) {
      return (
        <div className="p-8 text-center">
          <p>Paramètres manquants. <Link href="/admin/exercises" className="text-primary underline">Retourner à la sélection</Link></p>
        </div>
      )
    }
  } else {
    if (!cycle || !level || !semester) {
      return (
        <div className="p-8 text-center">
          <p>Paramètres manquants. <Link href="/admin/exercises" className="text-primary underline">Retourner à la sélection</Link></p>
        </div>
      )
    }
  }

  // Fetch existing series for this context
  let seriesList: any[] = []
  if (cycle === "SUPERIEUR") {
    const filters: any = {
      cycle,
      level: EducationalLevel.UNIVERSITY,
      educationalStreamId: streamId,
      lessonId: lessonId,
    }
    const { data: seriesData } = await getPaginatedSeries(filters)
    seriesList = seriesData?.series || []
  } else {
    const { data: seriesData } = await getPaginatedSeries({ cycle, level, stream, semester, educationalStreamId: streamId })
    seriesList = seriesData?.series || []
  }

  // Fetch lessons/chapters that belong to this context
  let lessons: any[] = []
  let chapters: any[] = []
  let currentLesson: any = null

  if (cycle === "SUPERIEUR" && lessonId) {
    // For Supérieur, fetch chapters instead of lessons
    const lessonResult = await getLessonById(lessonId)
    if (lessonResult.success) {
      currentLesson = lessonResult.data
    }
    const chaptersResult = await getChaptersByLesson(lessonId)
    if (chaptersResult.success) {
      chapters = chaptersResult.data || []
    }
  } else {
    // For other cycles, fetch lessons
    const { data: lessonsData } = await getLessonsForParams({ cycle, level, stream, semester, educationalStreamId: streamId })
    lessons = lessonsData?.lessons || []
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/exercises" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
              &larr; Retour aux cycles
            </Link>
            <h1 className="text-3xl font-bold">Séries d'exercices</h1>
            <p className="text-muted-foreground">
              {cycle === "SUPERIEUR"
                ? `${cycle} – ${currentLesson?.titleFr || "Leçon"}`
                : `${cycle} ${level}${stream ? ` – ${stream}` : ""} – Semestre ${semester}`}
            </p>
          </div>
        </div>

        {/* List of existing series */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {seriesList.map((s: any) => (
            <SeriesCard key={s.id} series={s} showAdminActions={true} />
          ))}

          {/* Card to create a new series */}
          <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600 flex flex-col justify-center">
            <CardHeader>
              <CardTitle className="text-center">Créer une nouvelle série</CardTitle>
            </CardHeader>
            <CardContent>
              <SeriesCreationForm
                lessons={cycle === "SUPERIEUR" ? [] : lessons}
                chapters={cycle === "SUPERIEUR" ? chapters : []}
                cycle={cycle}
                level={level || EducationalLevel.UNIVERSITY}
                stream={stream}
                semester={semester || "1"}
                educationalStreamId={streamId}
                lessonId={cycle === "SUPERIEUR" ? lessonId : undefined}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
