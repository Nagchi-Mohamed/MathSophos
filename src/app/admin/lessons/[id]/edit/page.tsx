import { getLessonById } from "@/actions/content"
import { redirect } from "next/navigation"
import { EditLessonClient } from "@/components/admin/edit-lesson-client"
import { Loader2 } from "lucide-react"

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const result = await getLessonById(id)

  if (!result.success || !result.data) {
    redirect("/admin/lessons")
  }

  const lesson = result.data

  // Convert Prisma types to plain objects for client component
  const initialData = {
    titleFr: lesson.titleFr,
    category: lesson.category,
    level: lesson.level,
    stream: lesson.stream,
    semester: lesson.semester,
    order: lesson.order,
    status: lesson.status,
    contentFr: lesson.contentFr,
    moduleId: lesson.moduleId,
    educationalStreamId: lesson.educationalStreamId,
    slug: lesson.slug,
  }

  return <EditLessonClient lessonId={id} initialData={initialData} />
}
