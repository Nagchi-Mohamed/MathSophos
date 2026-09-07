import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getLessonBySlug } from "@/actions/content"
import { formatLevel } from "@/utils/formatters"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { LessonPdfDownloadButton } from "@/components/lessons/lesson-pdf-download-button"
import { FloatingAssistant } from "@/components/ui/floating-assistant"
import { toTextbookLesson } from "@/lib/textbook-adapter"
import { TextbookReader } from "@/components/textbook/textbook-reader"
import { Download } from "lucide-react"

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

  // Convert raw DB lesson to structured TextbookLesson via read-only runtime adapter
  const textbookLesson = toTextbookLesson(lesson)

  return (
    <div className="relative">
      {/* Textbook Reader Container */}
      <TextbookReader lesson={textbookLesson} />

      {/* Admin Floating Downloads / Controls */}
      <div className="container max-w-7xl mx-auto px-4 pb-8 flex flex-wrap gap-4 justify-end items-center print:hidden">
        {lesson.fileUrl && (
          <a
            href={lesson.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Télécharger PDF Attaché
            </Button>
          </a>
        )}

        {session?.user?.role && canAccessAdmin(session.user.role) && (
          <div className="flex items-center gap-2">
            <LessonPdfDownloadButton
              lessonId={lesson.id}
              lessonTitle={lesson.titleFr}
              className="text-xs"
            />
          </div>
        )}
      </div>

      <FloatingAssistant pageType="lesson" />
    </div>
  )
}
