import { notFound } from "next/navigation"
import { getExamById } from "@/actions/exams"
import MarkdownRenderer from "@/components/markdown-renderer"
import { formatLevel, formatStream } from "@/utils/formatters"
import { PrintHeader } from "@/components/print/print-header"
import { PrintOptimizer } from "@/components/print/print-optimizer"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ include?: string }>
}

export default async function PrintExamPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { include } = await searchParams
  console.log(`[PrintExamPage] Rendering for ID: ${id}`)
  const examResult = await getExamById(id)

  if (!examResult.success || !examResult.data) {
    console.error(`[PrintExamPage] Exam not found or error: ${examResult.error}`)
    notFound()
  }

  const exam = examResult.data
  console.log(`[PrintExamPage] Exam data loaded: ${exam.id}, title: ${exam.title}`)
  let content: any = exam.content || {}

  // Robustly handle stringified JSON content
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content)
    } catch (e) {
      console.error("[PrintExamPage] Error parsing exam content JSON:", e)
      content = {}
    }
  }

  // Determine what to show based on searchParams or default to just exercises (Subject)
  const options = include ? include.split(',') : ['exercises']
  const showExercises = options.includes('exercises')
  const showSolutions = options.includes('solutions')

  // If showing solutions, we are in "Correction" mode, so usually just 'Corrigé'
  const isCorrection = showSolutions
  const showAnswerSpace = showExercises && !showSolutions // Hide answer space if showing correction

  const getTypeLabel = () => {
    let baseLabel = ""
    if (exam.type === "EXAM") {
      if (exam.examType === "NATIONAL") baseLabel = "Examen National"
      else if (exam.examType === "REGIONAL") baseLabel = "Examen Régional"
      else if (exam.examType === "LOCAL") baseLabel = "Examen Local"
      else baseLabel = "Examen"
    } else {
      baseLabel = `Contrôle Continu N°${exam.controlNumber || 1}`
    }

    return isCorrection ? `${baseLabel} - CORRIGÉ` : baseLabel
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Debug View - Visible on screen, hidden in print */}
      <div className="container mx-auto p-4 mb-4 bg-yellow-100 text-xs font-mono overflow-auto max-h-40 print:hidden opacity-50 hover:opacity-100">
        <p className="font-bold">DEBUG DATA (Screen Only):</p>
        <pre>{JSON.stringify({
          hasContent: !!content,
          options,
          exercisesCount: content?.exercises?.length,
        }, null, 2)}</pre>
      </div>

      <PrintOptimizer />
      <PrintHeader
        title={exam.title}
        subtitle={content?.subtitle}
        level={formatLevel(exam.level)}
        stream={formatStream(exam.stream || "NONE") || undefined}
        category={getTypeLabel()}
        module="Mathématiques"
      />

      {/* Instructions if present - Only show in Subject mode */}
      {content?.instructions && !isCorrection && (
        <div className="mb-8 p-6 bg-gray-50 border-l-4 border-gray-400 rounded-r-lg print:bg-gray-50 print:border-gray-400">
          <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
            <span>📝</span> Instructions Générales :
          </h3>
          <div className="prose prose-slate max-w-none text-gray-800 text-sm leading-relaxed">
            <MarkdownRenderer content={content.instructions || ""} />
          </div>
        </div>
      )}

      {/* Exam Content - Clean */}
      <div className="space-y-8">
        {(!content?.exercises || !Array.isArray(content.exercises) || content.exercises.length === 0) && (
          <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-lg">Aucun exercice n'a été trouvé pour cet examen.</p>
            <p className="text-sm mt-2">Le contenu est peut-être vide ou mal formaté.</p>
          </div>
        )}

        {Array.isArray(content?.exercises) && content.exercises.map((exercise: any, index: number) => {
          return (
            <div key={index} className="border-b-2 border-dashed border-gray-200 pb-8 last:border-b-0 break-inside-avoid">
              <div className="flex justify-between items-baseline mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">{index + 1}</span>
                  {exercise.title}
                </h2>
                <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                  {exercise.points} {exercise.points === 1 ? 'pt' : 'pts'}
                </span>
              </div>

              {/* Problem Statement */}
              {showExercises && (
                <div className="prose prose-slate max-w-none text-gray-800 pl-2">
                  <MarkdownRenderer content={exercise.problem || ""} />
                </div>
              )}

              {/* Solution */}
              {showSolutions && (
                <div className="mt-6 pl-2 p-4 bg-gray-50 border border-gray-200 rounded-lg print:border-gray-300">
                  <h3 className="font-bold text-gray-900 mb-2 underline decoration-blue-500 decoration-2 underline-offset-4">Solution :</h3>
                  <div className="prose prose-slate max-w-none text-gray-800">
                    <MarkdownRenderer content={exercise.solution || "*Aucune solution fournie*"} />
                  </div>
                </div>
              )}

              {/* Answer Space - Only if NOT showing solutions and space requested */}
              {showAnswerSpace && exercise.spaceLines && exercise.spaceLines > 0 && (
                <div className="mt-6 space-y-3 pl-2">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Espace Réponse</p>
                  {Array.from({ length: Math.min(exercise.spaceLines, 25) }).map((_, i) => (
                    <div key={i} className="border-b border-gray-200 h-8 w-full"></div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-300 text-center text-gray-500 text-sm flex justify-between items-center">
        <span>MathSophos - Plateforme Éducative</span>
        <span>Bonne Chance!</span>
        <span>Page <span className="pageNumber"></span></span>
      </div>
    </div>
  )
}

