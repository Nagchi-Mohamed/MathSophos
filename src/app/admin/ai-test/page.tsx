"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react"
import { solveMathProblemFromText } from "@/actions/math-solver"
import { SolverContentRenderer } from "@/components/solver/solver-content-renderer"

export default function AITestPage() {
  const [testProblem, setTestProblem] = useState("Résoudre l'équation: 2x + 5 = 13")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Trigger MathJax typesetting when result changes
  // useMathJax([result])

  const runTest = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await solveMathProblemFromText(testProblem)
      setResult(response)
    } catch (error: any) {
      setResult({ error: error.message || "Test failed" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Test de l'IA MathSophos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Problème mathématique à tester
            </label>
            <Textarea
              value={testProblem}
              onChange={(e) => setTestProblem(e.target.value)}
              rows={4}
              className="font-mono"
              placeholder="Entrez un problème mathématique..."
            />
          </div>

          <Button
            onClick={runTest}
            disabled={isLoading || !testProblem.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Tester l'IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.error ? (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  Erreur
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  Résultat
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-900 dark:text-red-100 font-medium">
                  {result.error}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <SolverContentRenderer content={result.solution} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informations de diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span>Clé API configurée:</span>
              <span className={process.env.NEXT_PUBLIC_AI_ENABLED === "false" ? "text-red-600" : "text-green-600"}>
                {process.env.NEXT_PUBLIC_AI_ENABLED === "false" ? "❌ Non" : "✅ Oui"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Environnement:</span>
              <span>{process.env.NODE_ENV}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
