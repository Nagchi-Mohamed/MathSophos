import { notFound } from "next/navigation"
import { getLessonBySlug } from "@/actions/content"
import { PrintHeader } from "@/components/print/print-header"
import { PrintOptimizer } from "@/components/print/print-optimizer"
import { LessonContentRenderer } from "@/components/lessons/lesson-content-renderer"

export default async function PrintLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: lesson } = await getLessonBySlug(slug)

  if (!lesson) {
    notFound()
  }

  return (
    <>
      <PrintOptimizer />
      <div className="min-h-screen bg-white">
        <PrintHeader
          title={lesson.titleFr}
          level={lesson.level}
          stream={lesson.stream ?? undefined}
          semester={lesson.semester}
          category={lesson.category || "LEÇON"}
        />

        <div className="prose max-w-none prose-slate mt-8">
          <LessonContentRenderer content={lesson.contentFr || ""} skipHeaderStrip={true} />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-500 flex justify-between">
          <span>MathSophos - Plateforme Éducative</span>
          <span>Page <span className="pageNumber"></span></span>
        </div>
      </div>
    </>
  )
}
