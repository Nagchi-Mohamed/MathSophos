import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, Layers } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import { TableOfContents } from "@/components/lessons/table-of-contents"
import { LessonContentRenderer } from "@/components/lessons/lesson-content-renderer"
import { LessonHeader } from "@/components/lessons/lesson-header"
import { getLessonBySlug } from "@/actions/content"
import { formatLevel } from "@/utils/formatters"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { LessonPdfDownloadButton } from "@/components/lessons/lesson-pdf-download-button"
import { FloatingAssistant } from "@/components/ui/floating-assistant"

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data: lesson } = await getLessonBySlug(slug)

  if (!lesson) {
    return {
      title: "Leçon non trouvée | MathSophos",
    }
  }

  return {
    title: `${lesson.titleFr} | MathSophos`,
    description: `${lesson.category || "Mathématiques"} - ${formatLevel(lesson.level)} - Semestre ${lesson.semester}`,
  }
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()
  const { data: lesson } = await getLessonBySlug(slug)

  if (!lesson) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Leçon non trouvée</h1>
        <Link href="/lessons">
          <Button>Retour aux leçons</Button>
        </Link>
      </div>
    )
  }

  // Fetch series related to this lesson (with timeout handling)
  let relatedSeries: any[] = []
  try {
    relatedSeries = await Promise.race([
      prisma.series.findMany({
        where: {
          lessonId: lesson.id,
          public: true
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
      <Link href="/lessons" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux leçons
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-9 space-y-8">
          {/* Professional Lesson Header */}
          <LessonHeader
            title={lesson.titleFr}
            titleEn={lesson.titleEn}
            level={lesson.level}
            stream={lesson.stream}
            semester={lesson.semester}
            category={lesson.category || undefined}
            lessonId={lesson.id}
          />

          <article className="prose prose-slate lg:prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 break-words overflow-wrap-anywhere" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <LessonContentRenderer content={lesson.contentFr || ""} contentEn={lesson.contentEn} />
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
            {lesson.fileUrl && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Ressources
                </h3>
                <a
                  href={lesson.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Button className="w-full" variant="outline">
                    Télécharger le PDF
                  </Button>
                </a>
              </div>
            )}

            {/* Admin PDF Download */}
            {session?.user?.role && canAccessAdmin(session.user.role) && (
              <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Administration
                </h3>
                <LessonPdfDownloadButton
                  lessonId={lesson.id}
                  lessonTitle={lesson.titleFr}
                  className="w-full"
                />
              </div>
            )}
            <TableOfContents content={lesson.contentFr || ""} />
          </div>
        </div>
      </div>
      <FloatingAssistant pageType="lesson" />
    </div>
  )
}
