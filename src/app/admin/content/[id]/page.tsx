import { prisma } from "@/lib/prisma"
import { LessonForm } from "@/components/admin/lesson-form"
import { notFound } from "next/navigation"

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
  })

  if (!lesson) {
    notFound()
  }

  return <LessonForm lesson={lesson} />
}
