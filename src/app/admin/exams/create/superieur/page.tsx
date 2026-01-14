import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getLessonById } from "@/actions/content"
import { getChaptersByLesson } from "@/actions/chapters"
import { getModuleById } from "@/actions/modules"
import { getStreamById } from "@/actions/streams"
import { SuperieurExamGenerator } from "@/components/exams/superieur-exam-generator"

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    streamId?: string
    moduleId?: string
    lessonId?: string
  }>
}

export default async function SuperieurExamCreatePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const { streamId, moduleId, lessonId } = resolvedParams

  if (!streamId || !moduleId || !lessonId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Paramètres manquants</p>
          <Link href="/admin/exams">
            <Button variant="outline">Retour aux examens</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch lesson, module, and stream details
  const [lessonResult, chaptersResult, moduleResult, streamResult] = await Promise.all([
    getLessonById(lessonId),
    getChaptersByLesson(lessonId),
    getModuleById(moduleId),
    getStreamById(streamId)
  ])

  const lesson = lessonResult.success ? lessonResult.data : null
  const chapters = chaptersResult.success ? chaptersResult.data || [] : []
  const module = moduleResult.success ? moduleResult.data : null
  const stream = streamResult.success ? streamResult.data : null

  if (!lesson) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Leçon introuvable</p>
          <Link href="/admin/exams">
            <Button variant="outline">Retour aux examens</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/admin/exams?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}&lessonId=${lessonId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Générateur d'Examen - Supérieur</h1>
          <p className="text-muted-foreground">
            {stream?.name} → {module?.name} → {lesson.titleFr}
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <SuperieurExamGenerator
          lesson={lesson}
          chapters={chapters}
          streamId={streamId}
          moduleId={moduleId}
          moduleName={module?.name || ""}
          streamName={stream?.name || ""}
        />
      </Suspense>
    </div>
  )
}

