import { redirect } from "next/navigation"
import { ManualSeriesForm } from "@/components/exercises/manual-series-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"

interface PageProps {
  searchParams: Promise<{
    lessonId?: string
    cycle?: string
    level?: string
    stream?: string
    semester?: string
    educationalStreamId?: string
  }>
}

export default async function CreateSeriesPage({ searchParams }: PageProps) {
  const { lessonId, cycle, level, stream, semester, educationalStreamId } = await searchParams

  if (!lessonId || !cycle || !level || !semester) {
    redirect("/admin/exercises")
  }

  // Fetch the lesson to display its title
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      titleFr: true,
      slug: true,
      contentFr: true
    }
  })

  if (!lesson) {
    redirect("/admin/exercises")
  }

  const context = {
    lessonId,
    cycle,
    level,
    stream: stream || null,
    semester,
    educationalStreamId
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/admin/exercises/series?cycle=${cycle}&level=${level}&semester=${semester}&stream=${stream || ''}&streamId=${educationalStreamId || ''}`}>
            <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Création manuelle de série</h1>
          <p className="text-muted-foreground mt-2">
            Ajoutez des exercices manuellement pour créer votre série personnalisée.
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Leçon associée: <span className="font-semibold">{lesson.titleFr}</span>
          </p>
        </div>

        <ManualSeriesForm context={context} lesson={lesson} />
      </div>
    </div>
  )
}
