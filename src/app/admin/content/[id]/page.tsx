import { prisma } from "@/lib/prisma"
import { LessonForm } from "@/components/admin/lesson-form"
import { notFound } from "next/navigation"
import { LessonStatus } from "@/lib/enums"

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
  })

  if (!lesson) {
    notFound()
  }

  // Cast Prisma enum to local enum
  const lessonWithLocalEnum = {
    ...lesson,
    status: lesson.status as unknown as LessonStatus
  }

  return <LessonForm lesson={lessonWithLocalEnum} />
}
