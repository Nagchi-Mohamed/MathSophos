import { PrintHeader } from "@/components/print/print-header"
import { PrintOptimizer } from "@/components/print/print-optimizer"
import { LessonContentRenderer } from "@/components/lessons/lesson-content-renderer"
// import { MathJaxRegistry } from "@/components/mathjax-registry"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PrintChapterPage({ params }: PageProps) {
  const { slug } = await params

  const chapter = await prisma.chapter.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { name: true } },
      lesson: {
        include: {
          educationalStream: true,
          module: true,
        },
      },
    },
  })

  if (!chapter) {
    notFound()
  }

  const lesson = chapter.lesson
  const filiere = lesson?.educationalStream
  const module = lesson?.module

  return (
    <>
      <PrintOptimizer />
      <div className="min-h-screen bg-white">

        {/* Header */}
        <PrintHeader
          title={`${chapter.chapterNumber ? `Chapitre ${chapter.chapterNumber}: ` : ''}${chapter.titleFr}`}
          level={filiere?.name}
          module={module?.name}
          category={lesson?.titleFr || "CHAPITRE"}
          professorName={chapter.createdBy?.name || undefined}
        />

        {/* Content */}
        <div className="prose max-w-none prose-slate">
          <LessonContentRenderer content={chapter.contentFr || ""} skipHeaderStrip={true} />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>MathSophos Platform - {new Date().getFullYear()}</p>
        </div>
      </div>
    </>
  )
}
