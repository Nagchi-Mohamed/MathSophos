import { notFound } from "next/navigation"
import { getSeriesById } from "@/actions/series"
import { SeriesEditForm } from "@/components/exercises/series-edit-form"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditSeriesPage({ params }: PageProps) {
  const { id } = await params
  const { data: series } = await getSeriesById(id)

  if (!series) {
    notFound()
  }

  // Transform to match the expected props (ensure hints is string[])
  const formattedSeries = {
    ...series,
    exercises: series.exercises.map((ex: any) => ({
      id: ex.id,
      problemTextFr: ex.problemTextFr || "",
      solutionFr: ex.solutionFr || "",
      hints: ex.hints || [],
      exerciseType: ex.exerciseType || null,
      qcmOptions: ex.qcmOptions || [],
      correctAnswer: ex.correctAnswer || null
    })),
    lessonId: series.lessonId || undefined
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Éditer la série</h1>
      <SeriesEditForm series={formattedSeries} />
    </div>
  )
}
