"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Lightbulb } from "lucide-react"
import { ExerciseContentRenderer } from "@/components/exercises/exercise-content-renderer"

interface Exercise {
  id: string
  problemTextFr: string
  solutionFr: string
  hints: string[]
}

interface SeriesDetailsClientProps {
  exercises: Exercise[]
}

export function SeriesDetailsClient({ exercises }: SeriesDetailsClientProps) {
  return (
    <div className="space-y-6">
      {exercises.map((exercise: Exercise, index: number) => (
        <Card key={exercise.id} className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-b">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
                {index + 1}
              </span>
              <span>Exercice {index + 1}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Énoncé */}
            <div>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ExerciseContentRenderer content={exercise.problemTextFr} />
              </div>
            </div>

            {/* Indices - Cachés par défaut */}
            {exercise.hints && exercise.hints.length > 0 && (
              <details className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <summary className="font-semibold cursor-pointer flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <Lightbulb className="w-5 h-5" />
                  <span>Indices ({exercise.hints.length})</span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </summary>
                <div className="mt-4 space-y-3">
                  {exercise.hints.map((hint: string, hintIndex: number) => (
                    <div key={hintIndex} className="flex gap-3 text-sm">
                      <span className="font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">
                        {hintIndex + 1}.
                      </span>
                      <div className="flex-1 prose prose-sm dark:prose-invert">
                        <ExerciseContentRenderer content={hint} />
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Solution - Cachée par défaut */}
            <details className="bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
              <summary className="font-semibold cursor-pointer flex items-center gap-2 text-green-900 dark:text-green-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Solution détaillée</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </summary>
              <div className="mt-4 prose prose-lg dark:prose-invert max-w-none">
                <ExerciseContentRenderer content={exercise.solutionFr} />
              </div>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
