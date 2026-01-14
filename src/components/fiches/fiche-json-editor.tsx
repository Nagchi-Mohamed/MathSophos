"use client"

import { useState, useEffect, useCallback } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { FicheContentStep } from "@/actions/fiches"

// Helper to extract JSON from potential text/markdown
const extractJson = (input: string) => {
  let clean = input.trim()
  // Try to find markdown code blocks
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (match) {
    return match[1]
  }
  // Try to find start of JSON array
  const startArr = clean.indexOf('[')
  if (startArr !== -1) {
    const lastArr = clean.lastIndexOf(']')
    if (lastArr > startArr) {
      return clean.substring(startArr, lastArr + 1)
    }
  }
  return clean
}

// Helper to fix common JSON escaping issues in LaTeX content
const sanitizeJsonString = (str: string) => {
  // Simple approach: double-escape single backslashes that are NOT valid JSON escapes
  return str.replace(/\\([a-zA-Z])/g, (match, letter) => {
    const validEscapes = ['n', 't', 'r', 'b', 'f', 'u']
    if (validEscapes.includes(letter)) {
      return match
    }
    return '\\\\' + letter
  })
}

interface FicheJsonEditorProps {
  steps: FicheContentStep[]
  onStepsChange: (steps: FicheContentStep[]) => void
  onValidityChange: (isValid: boolean) => void
}

export function FicheJsonEditor({ steps, onStepsChange, onValidityChange }: FicheJsonEditorProps) {
  // Initialize with formatted JSON
  // We use a ref to track if we should update from props (only on mount or external reset)
  const [jsonContent, setJsonContent] = useState(() => JSON.stringify(steps, null, 2))
  const [status, setStatus] = useState<'valid' | 'error'>('valid')
  const [errorMsg, setErrorMsg] = useState("")

  // Validate and parse on content change
  useEffect(() => {
    if (!jsonContent.trim()) {
      // Empty is valid-ish? Or error? Let's say valid empty array if desired, or just nothing.
      // But steps=[] is valid.
      // If user clears everything, assume []
      if (jsonContent === "") {
        onStepsChange([])
        onValidityChange(true)
        setStatus('valid')
      }
      return
    }

    try {
      let cleaned = extractJson(jsonContent)
      let parsed: any
      try {
        parsed = JSON.parse(cleaned)
      } catch (e) {
        // Try sanitizing
        const fixed = sanitizeJsonString(cleaned)
        parsed = JSON.parse(fixed)
      }

      if (!Array.isArray(parsed)) {
        throw new Error("Le contenu doit être un tableau d'étapes (JSON Array)")
      }

      // Validate items structure (loose check)
      parsed.forEach((item, idx) => {
        if (!item.type || !item.content) {
          throw new Error(`Élément ${idx + 1}: 'type' et 'content' sont requis`)
        }
      })

      // Success
      setStatus('valid')
      setErrorMsg("")
      onValidityChange(true)

      // Inject IDs if missing
      const newSteps = parsed.map((s: any) => ({
        ...s,
        id: s.id || crypto.randomUUID()
      }))

      onStepsChange(newSteps)

    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e.message || "Erreur de syntaxe JSON")
      onValidityChange(false)
    }
  }, [jsonContent])

  return (
    <div className="space-y-4">
      <div className="relative h-[600px] border rounded-md overflow-hidden bg-background">
        <Textarea
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          className="font-mono text-xs border-0 resize-none p-4 h-full w-full focus-visible:ring-0 rounded-none"
          placeholder="[{ 'type': 'Exemple', 'content': '...' }]"
        />
        <div className="absolute top-4 right-4 pointer-events-none">
          {status === 'valid' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 bg-background rounded-full" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 bg-background rounded-full" />
          )}
        </div>
      </div>

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur JSON</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {status === 'valid' && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">JSON valide</AlertTitle>
          <AlertDescription className="text-green-600 text-xs">
            Les modifications sont synchronisées. Vous pouvez enregistrer la fiche.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
