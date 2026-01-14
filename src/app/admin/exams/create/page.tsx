import { ExamGenerator } from "@/components/exams/exam-generator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Cycle } from "@/lib/education-system"
import { EducationalLevel, Stream } from "@prisma/client"

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    cycle?: Cycle
    level?: EducationalLevel
    stream?: Stream
    semester?: string
    streamId?: string
    moduleId?: string
    lessonId?: string
  }>
}

export default async function AdminCreateExamPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const { cycle, lessonId, moduleId, streamId } = resolvedParams
  
  // For Supérieur, redirect to lesson-specific exam generator
  if (cycle === "SUPERIEUR" && lessonId) {
    const { redirect } = await import("next/navigation")
    redirect(`/admin/exams/create/superieur?streamId=${streamId}&moduleId=${moduleId}&lessonId=${lessonId}`)
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/exams">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Générateur d'Examens (Admin)</h1>
          <p className="text-muted-foreground">
            Générez, éditez et sauvegardez des examens officiels.
          </p>
        </div>
      </div>

      <ExamGenerator 
        isAdmin={true} 
        initialParams={{
          cycle: resolvedParams.cycle,
          level: resolvedParams.level,
          stream: resolvedParams.stream,
          semester: resolvedParams.semester ? parseInt(resolvedParams.semester) : undefined,
          streamId: resolvedParams.streamId
        }}
      />
    </div>
  )
}
