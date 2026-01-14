"use client"

import React, { useMemo } from "react"
import MarkdownRenderer from "@/components/markdown-renderer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface SeriesJsonPreviewProps {
  jsonContent: string
  onTextSelected?: (text: string) => void
}

export function SeriesJsonPreview({ jsonContent, onTextSelected }: SeriesJsonPreviewProps) {
  const parsedData = useMemo(() => {
    try {
      if (!jsonContent.trim()) return null
      return JSON.parse(jsonContent)
    } catch (e) {
      return null
    }
  }, [jsonContent])

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!onTextSelected) return;

    // Get the selected text or the text content of the clicked element
    const selection = window.getSelection();
    let text = selection?.toString().trim();

    if (!text && e.target) {
      // Fallback to element content if no selection
      text = (e.target as HTMLElement).innerText?.trim();
    }

    // Limit text length to avoid huge searches
    if (text && text.length > 5) {
      // Take a snippet if it's too long, or just search unique substring?
      // Searching for the whole block is safer for uniqueness, but might fail if JSON has escapes.
      // We'll pass the raw text and let parent handle fuzzy matching or exact matching.
      onTextSelected(text);
    }
  };

  if (!parsedData) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Aperçu non disponible (JSON invalide ou vide)
      </div>
    )
  }

  // Handle both College (array) and Superieur (object with exercises array) formats
  let exercises: any[] = []
  if (Array.isArray(parsedData)) {
    exercises = parsedData
  } else if (parsedData.exercises && Array.isArray(parsedData.exercises)) {
    exercises = parsedData.exercises
  }

  if (exercises.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Aucun exercice trouvé
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-8" onDoubleClick={handleDoubleClick}>
      {parsedData.title && (
        <h1 className="text-2xl font-bold border-b pb-2 mb-4">{parsedData.title}</h1>
      )}

      {exercises.map((ex, index) => (
        <div key={index} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
          <h3 className="font-semibold text-lg mb-3">Exercice {index + 1}</h3>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
              <span className="text-xs uppercase font-bold text-muted-foreground mb-2 block">Énoncé</span>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <MarkdownRenderer content={ex.problemTextFr || ex.question || ""} />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-100 dark:border-green-900/20">
              <span className="text-xs uppercase font-bold text-green-700 dark:text-green-400 mb-2 block">Solution</span>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <MarkdownRenderer content={ex.solutionFr || ex.solution || ""} />
              </div>
            </div>

            {ex.hints && ex.hints.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-md border border-orange-100 dark:border-orange-900/20">
                <span className="text-xs uppercase font-bold text-orange-700 dark:text-orange-400 mb-2 block">Indices</span>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {ex.hints.map((hint: string, i: number) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
