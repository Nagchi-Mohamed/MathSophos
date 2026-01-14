import { notFound } from "next/navigation"
import { getSeriesById } from "@/actions/series"
import { ExerciseContentRenderer } from "@/components/exercises/exercise-content-renderer"
import { formatLevel, formatStream } from "@/utils/formatters"
import { PrintHeader } from "@/components/print/print-header"
import { PrintOptimizer } from "@/components/print/print-optimizer"

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    include?: string
  }>
}

export default async function PrintSeriesPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { include } = await searchParams
  const { data: series } = await getSeriesById(id)

  if (!series) {
    notFound()
  }

  const professorName = process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi"
  const options = include ? include.split(',') : ['exercises', 'hints', 'solutions']
  const showExercises = options.includes('exercises')
  const showHints = options.includes('hints')
  const showSolutions = options.includes('solutions')

  return (
    <div>
      <PrintOptimizer />

      {/* Optimized Print Header */}
      <PrintHeader
        title={`Série: ${series.title}`}
        level={formatLevel(series.level)}
        stream={formatStream(series.stream || "NONE") || undefined}
        semester={series.semester}
        category="SÉRIE D'EXERCICES"
      />

      {/* Exercises List */}
      <div className="space-y-8">
        {series.exercises.map((exercise: any, index: number) => (
          <div key={exercise.id} className="exercise-item">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm bg-black">
                {index + 1}
              </span>
              <h2 className="text-xl font-bold">Exercice {index + 1}</h2>
            </div>

            <div className="pl-11 space-y-6">
              {/* Énoncé */}
              {showExercises && (
                <div className="prose prose-slate max-w-none">
                  <ExerciseContentRenderer content={exercise.problemTextFr} />
                </div>
              )}

              {/* Indices */}
              {showHints && exercise.hints && exercise.hints.length > 0 && (
                <div className="p-4 rounded border bg-gray-50">
                  <h3 className="font-bold mb-2">Indices :</h3>
                  <div className="space-y-2">
                    {exercise.hints.map((hint: string, hintIndex: number) => (
                      <div key={hintIndex} className="flex gap-2 text-sm">
                        <span className="font-bold text-gray-700">{hintIndex + 1}.</span>
                        <div className="prose prose-sm max-w-none">
                          <ExerciseContentRenderer content={hint} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solution */}
              {showSolutions && (
                <div className="p-4 rounded border bg-gray-50">
                  <h3 className="font-bold mb-2">Solution :</h3>
                  <div className="prose prose-slate max-w-none">
                    <ExerciseContentRenderer content={exercise.solutionFr} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
