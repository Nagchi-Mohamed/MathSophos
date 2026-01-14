"use client"

import { useState } from "react"
import { generateMathContent } from "@/actions/ai-content-generator"
import { Loader2, Wand2, Save, RefreshCw, FileJson } from "lucide-react"

export default function AIGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [formData, setFormData] = useState({
    contentType: "lesson" as "lesson" | "exercise",
    topic: "",
    difficulty: "intermediate",
    gradeLevel: "high",
    additionalInstructions: "",
    includeExamples: true,
    includeVisuals: true
  })

  const handleGenerate = async () => {
    if (!formData.topic) return

    setIsLoading(true)
    try {
      const result = await generateMathContent({
        contentType: formData.contentType,
        topic: formData.topic,
        difficulty: formData.difficulty,
        gradeLevel: formData.gradeLevel,
        additionalInstructions: formData.additionalInstructions,
        includeExamples: formData.includeExamples,
        includeVisuals: formData.includeVisuals
      })

      if (result.success) {
        setGeneratedContent(result.data)
      } else {
        alert("Erreur lors de la génération: " + result.error)
      }
    } catch (error) {
      console.error(error)
      alert("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wand2 className="w-8 h-8 text-purple-600" />
          Générateur de Contenu IA
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type de contenu</label>
                <select
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
                >
                  <option value="lesson">Leçon</option>
                  <option value="exercise">Exercice</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sujet</label>
                <input
                  type="text"
                  placeholder="Ex: Équations quadratiques"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeExamples}
                    onChange={(e) => setFormData({ ...formData, includeExamples: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Inclure des exemples</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeVisuals}
                    onChange={(e) => setFormData({ ...formData, includeVisuals: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Suggérer des éléments visuels</span>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !formData.topic}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Générer avec l'IA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold">Aperçu du contenu</h2>
              {generatedContent && (
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Régénérer">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Voir JSON">
                    <FileJson className="w-4 h-4" />
                  </button>
                  <button className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto min-h-[500px]">
              {generatedContent ? (
                <div className="prose dark:prose-invert max-w-none">
                  {/* Render based on content type */}
                  {formData.contentType === "lesson" ? (
                    <LessonPreview lesson={generatedContent.lesson} />
                  ) : (
                    <ExercisePreview exercise={generatedContent.exercise} />
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Wand2 className="w-16 h-16 mb-4 opacity-20" />
                  <p>Configurez et générez du contenu pour voir l'aperçu</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LessonPreview({ lesson }: { lesson: any }) {
  return (
    <div className="space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold mb-2">{lesson.metadata.title}</h1>
        <div className="flex gap-2 text-sm text-gray-500">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{lesson.metadata.difficulty}</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">{lesson.metadata.grade_level}</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">{lesson.metadata.estimated_duration} min</span>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3 text-purple-600">Introduction</h2>
        <p className="mb-4">{lesson.content.introduction.hook}</p>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
          <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Application réelle</h4>
          <p className="text-sm">{lesson.content.introduction.real_world_connection}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 text-purple-600">Théorie et Concepts</h2>
        <div className="space-y-4">
          {lesson.content.theory.definitions.map((def: any, i: number) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <span className="font-bold text-gray-900 dark:text-white">{def.term} :</span> {def.definition}
              <p className="text-sm text-gray-500 mt-1 italic">Ex: {def.example}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 text-purple-600">Exemples</h2>
        <div className="grid gap-4">
          {lesson.content.examples.map((ex: any, i: number) => (
            <div key={i} className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">{ex.title}</h3>
              <p className="mb-2">{ex.problem}</p>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm font-mono">
                {Object.entries(ex.solution).map(([step, desc]: any) => (
                  <div key={step} className="mb-1">
                    <span className="font-bold text-purple-500">{step}:</span> {desc}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ExercisePreview({ exercise }: { exercise: any }) {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">{exercise.metadata.title}</h1>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">{exercise.metadata.points} points</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <p className="text-lg mb-6">{exercise.problem.statement}</p>

        {exercise.components.multiple_choice && (
          <div className="space-y-3">
            {exercise.components.multiple_choice.options.map((opt: any) => (
              <div key={opt.value} className={`p-3 border rounded-lg flex items-center gap-3 ${opt.value === exercise.components.multiple_choice.correct_option ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 font-bold">
                  {opt.value}
                </div>
                <span>{opt.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
