"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, Sparkles, ExternalLink, BookOpen, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { searchReferences } from "@/actions/references"

export type ContentType = 'series' | 'lesson' | 'chapter' | 'exam' | 'fiche'

interface AIPromptGeneratorProps {
  lesson?: {
    id: string
    titleFr: string
    contentFr?: string | null
  }
  context?: {
    cycle: string
    level: string
    stream?: string | null
    semester: string
  }
  contentType?: ContentType
}

export function AIPromptGenerator({ lesson, context, contentType = 'series' }: AIPromptGeneratorProps) {
  const [exerciseCount, setExerciseCount] = useState(10)
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [copied, setCopied] = useState(false)
  const [showHelp, setShowHelp] = useState(true)

  // References State
  const [references, setReferences] = useState<any[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  useEffect(() => {
    const fetchReferences = async () => {
      if (lesson?.titleFr && context?.level && context.level !== "UNKNOWN") {
        setLoadingRefs(true)
        try {
          const res = await searchReferences(lesson.titleFr, context.level)
          if (res.success && res.data) {
            setReferences(res.data)
          }
        } catch (e) {
          console.error(e)
        }
        setLoadingRefs(false)
      }
    }
    fetchReferences()
  }, [lesson?.titleFr, context?.level])

  const getPromptTemplate = () => {
    switch (contentType) {
      case 'lesson':
        return `
## FORMAT DE SORTIE ATTENDU POUR UNE LEÇON
\`\`\`json
{
  "titleFr": "Titre de la leçon",
  "contentFr": "Contenu complet en Markdown avec LaTeX...",
  "summaryFr": "Résumé court de la leçon",
  "objectives": ["Objectif 1", "Objectif 2"]
}
\`\`\`
`
      case 'exam':
        return `
## FORMAT DE SORTIE ATTENDU POUR UN EXAMEN
\`\`\`json
{
  "title": "Titre de l'examen",
  "exercises": [
    {
      "title": "Exercice 1",
      "problem": "Énoncé...",
      "solution": "Solution...",
      "points": 5
    }
  ]
}
\`\`\`
`
      case 'fiche':
        return `
## FORMAT DE SORTIE ATTENDU POUR UNE FICHE PÉDAGOGIQUE
\`\`\`json
{
  "titleFr": "Titre de la fiche",
  "contentFr": "Contenu détaillé...",
  "type": "RESUME_COURS"
}
\`\`\`
`
      default: // series
        return `
## FORMAT DE SORTIE (OBLIGATOIRE)
Tu DOIS répondre UNIQUEMENT avec un tableau JSON valide. **AUCUN texte avant ou après le JSON**.

**Format exact attendu**:
\`\`\`json
[
  {
    "problemTextFr": "Énoncé de l'exercice en français avec LaTeX",
    "solutionFr": "Solution détaillée étape par étape",
    "hints": ["Indice 1", "Indice 2", "Indice 3"]
  }
]
\`\`\`
`
    }
  }

  const generatePrompt = () => {
    const lessonContent = lesson?.contentFr || "Pas de contenu détaillé disponible."
    const lessonPreview = lessonContent.substring(0, 2000)

    let promptContext = ""
    if (context) {
      promptContext = `
## CONTEXTE PÉDAGOGIQUE
- **Cycle**: ${context.cycle}
- **Niveau**: ${context.level}
- **Filière**: ${context.stream || "Non spécifiée"}
- **Semestre**: ${context.semester}
`
    }

    if (lesson) {
      promptContext += `- **Leçon**: ${lesson.titleFr}\n`
    }

    if (contentType === 'series') {
      promptContext += `- **Nombre d'exercices demandés**: ${exerciseCount}\n`
    }

    // Add Reference Context
    let referenceSection = ""
    if (references.length > 0) {
      referenceSection = `
## RÉFÉRENCES OFFICIELLES (SYSTEME MAROCAIN)
Les extraits suivants proviennent des documents officiels (Orientations Pédagogiques / Manuels) et DOIVENT être respectés:

${references.map(ref => `### DOCUMENT: ${ref.title}\n${ref.snippet}`).join("\n\n")}
`
    }

    return `# PROMPT POUR GÉNÉRATION DE ${contentType.toUpperCase()}

${promptContext}

${lesson ? `## EXTRAIT DU CONTENU DE LA LEÇON
\`\`\`
${lessonPreview}
\`\`\`
` : ''}

${referenceSection}

${additionalInstructions ? `## INSTRUCTIONS SUPPLÉMENTAIRES\n${additionalInstructions}\n` : ''}

## RÈGLES CRITIQUES DE GÉNÉRATION

${getPromptTemplate()}

### INSTRUCTIONS GEOGEBRA (OBLIGATOIRE POUR FIGURES)
Si l'exercice ou le contenu nécessite une figure géométrique ou un graphique :
1. Fournis le **code/script pour GeoGebra Classique** (Saisie) permettant de construire la figure.
2. Place ce code dans un bloc clairement identifié (ex: "Code GeoGebra").
3. Exemple de format attendu dans le champ contenu/solution :
\`\`\`
...explication...
**Code GeoGebra :**
A = (0,0)
B = (3,4)
Cercle(A, B)
...suite...
\`\`\`

### SYNTAXE LATEX (CRITIQUE - COMPATIBLE KATEX)

**RÈGLES ABSOLUES POUR KATEX**:

#### ✅ Expressions mathématiques inline (dans le texte)
- Utilise \`$...$\` pour les maths inline
- Exemple: \`Soit $f(x) = x^2 + 3x - 5$\`

#### ✅ Expressions mathématiques display (centrées)
- Utilise \`$$...$$\` pour les maths en bloc
- Exemple: \`$$\\int_0^1 f(x) dx = \\frac{1}{3}$$\`

#### ✅ Fractions
\`\`\`
$\\frac{numerateur}{denominateur}$
\`\`\`

#### ✅ Matrices et Tableaux (UTILISE TOUJOURS array, JAMAIS tabular)
\`\`\`
$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$
\`\`\`

#### ✅ Tableaux de variations (CRITIQUE)
**UTILISE UNIQUEMENT array, JAMAIS tabular**:
\`\`\`
$$\\begin{array}{|c|c|c|}
\\hline
x & -\\infty & +\\infty \\\\
\\hline
f(x) & - & + \\\\
\\hline
\\end{array}$$
\`\`\`

#### ❌ INTERDICTIONS ABSOLUES
- **JAMAIS** utiliser \`\\begin{tabular}\` → Utilise \`\\begin{array}\`
- **JAMAIS** utiliser des caractères Unicode dans les maths (é, à, etc.) → Utilise \`\\text{}\`
- **JAMAIS** utiliser \`\\\\\\\\hline\` → Utilise \`\\\\hline\`

### ÉCHAPPEMENT JSON (CRITIQUE)
Dans le JSON, tu DOIS échapper les backslashes:
- \`\\frac\` devient \`"\\\\frac"\`
- \`\\int\` devient \`"\\\\int"\`

**GÉNÈRE MAINTENANT LE CONTENU ${contentType.toUpperCase()} EN JSON**`
  }

  const handleCopy = async () => {
    const prompt = generatePrompt()
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      toast.success("Prompt copié dans le presse-papiers!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Erreur lors de la copie")
    }
  }

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <CardTitle>Générateur de Prompt AI ({contentType})</CardTitle>
        </div>
        <CardDescription>
          Créez un prompt pour DeepSeek/ChatGPT pour générer votre {contentType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {contentType === 'series' && (
            <div className="space-y-2">
              <Label htmlFor="exerciseCount">Nombre d'exercices</Label>
              <Input
                id="exerciseCount"
                type="number"
                min={1}
                max={50}
                value={exerciseCount}
                onChange={(e) => setExerciseCount(Number(e.target.value))}
                className="bg-white dark:bg-background"
              />
            </div>
          )}
          {lesson && (
            <div className="space-y-2">
              <Label>Leçon sélectionnée</Label>
              <div className="text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 p-2 rounded truncate">
                {lesson.titleFr}
              </div>
            </div>
          )}
        </div>

        {/* References Display */}
        {loadingRefs ? (
          <div className="bg-muted/50 p-2 rounded text-xs flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Recherche de références officielles...
          </div>
        ) : references.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                {references.length} documents de référence intégrés au prompt :
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {references.map(ref => (
                <span key={ref.id} className="text-[10px] bg-white dark:bg-blue-900 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                  {ref.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="additionalInstructions">Instructions supplémentaires (optionnel)</Label>
          <Textarea
            id="additionalInstructions"
            placeholder="Ex: Inclure des problèmes de géométrie, niveau difficile, etc."
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            className="min-h-[100px] bg-white dark:bg-background"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copié!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copier le Prompt
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('https://chat.deepseek.com', '_blank')}
            className="border-purple-300 dark:border-purple-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ouvrir DeepSeek
          </Button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden transition-all">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors text-left"
          >
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              📝 Comment utiliser
            </h4>
            {showHelp ? <ChevronUp className="h-4 w-4 text-blue-700" /> : <ChevronDown className="h-4 w-4 text-blue-700" />}
          </button>

          {showHelp && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Cliquez sur "Copier le Prompt"</li>
                <li>Ouvrez votre IA préférée (DeepSeek recommandé)</li>
                <li>Collez le prompt et validez</li>
                <li>Copiez le JSON généré</li>
                <li>Revenez et collez dans l'onglet "Mode JSON"</li>
              </ol>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
