import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Layers, Download } from "lucide-react"
import Link from "next/link"
import { TableOfContents } from "@/components/lessons/table-of-contents"
import { LessonContentRenderer } from "@/components/lessons/lesson-content-renderer"
import { ChapterHeader } from "@/components/lessons/chapter-header"
import { getChapterBySlug } from "@/actions/chapters"
import { formatLevel } from "@/utils/formatters"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { DownloadPdfButton } from "@/components/print/download-pdf-button"
import { ChapterPdfDownloadButton } from "@/components/chapters/chapter-pdf-download-button"
import { ChapterHeaderVideoButton } from "@/components/chapters/chapter-header-video-button"
import { FloatingAssistant } from "@/components/ui/floating-assistant"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data: chapter } = await getChapterBySlug(slug)

  if (!chapter) {
    return {
      title: "Chapitre non trouvé | MathSophos",
    }
  }

  const lessonName = chapter.lesson?.titleFr || "Leçon"
  return {
    title: `${chapter.titleFr} | ${lessonName} | MathSophos`,
    description: `Chapitre ${chapter.chapterNumber}: ${chapter.titleFr} - ${chapter.lesson?.category || "Mathématiques"}`,
  }
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: chapter } = await getChapterBySlug(slug)

  if (!chapter) {
    notFound()
  }

  const lesson = chapter.lesson
  if (!lesson) {
    notFound()
  }

  const session = await auth()

  // Fetch series related to this lesson (with timeout handling) - same as lesson page
  let relatedSeries: any[] = []
  try {
    relatedSeries = await Promise.race([
      prisma.series.findMany({
        where: {
          lessonId: lesson.id,
          public: true,
          OR: [
            { title: { contains: chapter.titleFr, mode: 'insensitive' } },
            { title: { contains: `Chapitre ${chapter.chapterNumber}`, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          exercises: {
            select: { id: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )
    ])
  } catch (error) {
    // Silently fail - page will render without related series
    console.warn('Failed to fetch related series:', error)
    relatedSeries = []
  }

  return (
    <div className="container py-10 max-w-7xl">
      <Link
        href={`/lessons?cycle=SUPERIEUR&streamId=${lesson.module?.educationalStream?.id}&moduleId=${lesson.module?.id}&lessonId=${lesson.id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux leçons
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-9 space-y-8">
          {/* Chapter Header */}
          {/* Chapter Header */}
          <ChapterHeader
            lessonTitle={lesson.titleFr}
            lessonTitleEn={lesson.titleEn}
            chapterNumber={chapter.chapterNumber}
            chapterTitle={chapter.titleFr}
            chapterTitleEn={chapter.titleEn}
            filiere={lesson.module?.educationalStream?.name}
            module={lesson.module?.name}
            category={lesson.category || undefined}
          >
            <ChapterHeaderVideoButton
              chapterId={chapter.id}
              chapterTitle={chapter.titleFr}
              className="bg-red-600 text-white hover:bg-red-700 shadow-lg shrink-0"
            />
          </ChapterHeader>

          <article className="prose prose-slate lg:prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 break-words overflow-wrap-anywhere" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <LessonContentRenderer content={chapter.contentFr || ""} contentEn={chapter.contentEn} skipHeaderStrip={true} hideVideoLinks={true} />
          </article>

          {/* Related Exercise Series */}
          {relatedSeries.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Layers className="w-6 h-6 text-primary" />
                Séries d'exercices associées
              </h2>
              <div className="grid gap-4">
                {relatedSeries.map((series) => (
                  <Link key={series.id} href={`/exercises/${series.id}`}>
                    <Card className="hover:shadow-md transition-shadow hover:border-primary/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-lg">{series.title}</CardTitle>
                          <Badge variant="secondary">{series.exercises.length} exercices</Badge>
                        </div>
                      </CardHeader>
                      {series.description && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {series.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (Table of Contents) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 space-y-6">
            {/* Admin PDF Download */}
            {session?.user?.role && canAccessAdmin(session.user.role) && (
              <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Administration
                </h3>
                <ChapterPdfDownloadButton
                  chapterId={chapter.id}
                  chapterTitle={chapter.titleFr}
                  className="w-full"
                />
              </div>
            )}
            <TableOfContents content={chapter.contentFr || ""} />
          </div>
        </div>
      </div>
      <FloatingAssistant pageType="lesson" />
    </div>
  )
}

