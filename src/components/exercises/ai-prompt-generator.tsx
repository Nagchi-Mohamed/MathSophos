"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, Sparkles, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface AIPromptGeneratorProps {
  lesson: {
    id: string
    titleFr: string
    contentFr?: string | null
  }
  context: {
    cycle: string
    level: string
    stream?: string | null
    semester: string
  }
}

export function AIPromptGenerator({ lesson, context }: AIPromptGeneratorProps) {
  const [exerciseCount, setExerciseCount] = useState(10)
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [copied, setCopied] = useState(false)

  const generatePrompt = () => {
    const lessonContent = lesson.contentFr || "Pas de contenu détaillé disponible."
    const lessonPreview = lessonContent.substring(0, 2000) // First 2000 chars

    return `# PROMPT POUR GÉNÉRATION DE SÉRIE D'EXERCICES

## CONTEXTE PÉDAGOGIQUE
- **Leçon**: ${lesson.titleFr}
- **Cycle**: ${context.cycle}
- **Niveau**: ${context.level}
- **Filière**: ${context.stream || "Non spécifiée"}
- **Semestre**: ${context.semester}
- **Nombre d'exercices demandés**: ${exerciseCount}

## EXTRAIT DU CONTENU DE LA LEÇON
\`\`\`
${lessonPreview}
\`\`\`

${additionalInstructions ? `## INSTRUCTIONS SUPPLÉMENTAIRES\n${additionalInstructions}\n` : ''}

## RÈGLES CRITIQUES DE GÉNÉRATION

### 1. FORMAT DE SORTIE (OBLIGATOIRE)
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

### 2. SYNTAXE LATEX (CRITIQUE - COMPATIBLE KATEX)

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
$$\\frac{a + b}{c - d}$$
\`\`\`

#### ✅ Racines
\`\`\`
$\\sqrt{x}$
$\\sqrt[n]{x}$
$$\\sqrt{a^2 + b^2}$$
\`\`\`

#### ✅ Puissances et indices
\`\`\`
$x^2$, $x^{n+1}$
$a_i$, $x_{n-1}$
\`\`\`

#### ✅ Intégrales et sommes
\`\`\`
$$\\int_a^b f(x) dx$$
$$\\sum_{i=1}^{n} i^2$$
$$\\lim_{x \\to +\\infty} f(x)$$
\`\`\`

#### ✅ Matrices (UTILISE TOUJOURS array, JAMAIS tabular)
\`\`\`
$$\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}$$

$$\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6
\\end{bmatrix}$$
\`\`\`

#### ✅ Systèmes d'équations
\`\`\`
$$\\begin{cases}
x + y = 5 \\\\
2x - y = 1
\\end{cases}$$
\`\`\`

#### ✅ Tableaux de variations (CRITIQUE)
**UTILISE UNIQUEMENT array, JAMAIS tabular**:
\`\`\`
$$\\begin{array}{|c|c|c|c|c|}
\\hline
x & -\\infty & & \\alpha & & +\\infty \\\\
\\hline
f'(x) & & - & 0 & + & \\\\
\\hline
f(x) & +\\infty & \\searrow & f(\\alpha) & \\nearrow & +\\infty \\\\
\\hline
\\end{array}$$
\`\`\`

#### ❌ INTERDICTIONS ABSOLUES
- **JAMAIS** utiliser \`\\begin{tabular}\` → Utilise \`\\begin{array}\`
- **JAMAIS** utiliser des caractères Unicode dans les maths (é, à, etc.) → Utilise \`\\text{}\`
- **JAMAIS** utiliser \`\\\\\\\\hline\` → Utilise \`\\\\hline\`
- **JAMAIS** utiliser des espaces dans les commandes LaTeX

#### ✅ Texte dans les expressions mathématiques
\`\`\`
$\\text{si } x > 0$
$$f(x) = \\begin{cases}
x^2 & \\text{si } x \\geq 0 \\\\
-x^2 & \\text{si } x < 0
\\end{cases}$$
\`\`\`

### 3. ÉCHAPPEMENT JSON (CRITIQUE)

Dans le JSON, tu DOIS échapper les backslashes:
- \`\\frac\` devient \`"\\\\frac"\` dans le JSON
- \`\\int\` devient \`"\\\\int"\` dans le JSON
- \`\\\\\` (nouvelle ligne LaTeX) devient \`"\\\\\\\\"\` dans le JSON

**Exemple correct dans le JSON**:
\`\`\`json
{
  "problemTextFr": "Calculer $\\\\frac{1}{2} + \\\\frac{3}{4}$",
  "solutionFr": "$$\\\\frac{1}{2} + \\\\frac{3}{4} = \\\\frac{2}{4} + \\\\frac{3}{4} = \\\\frac{5}{4}$$"
}
\`\`\`

### 4. STRUCTURE DES EXERCICES

Chaque exercice DOIT contenir:
1. **problemTextFr**: Énoncé clair avec au moins 3-5 questions numérotées
2. **solutionFr**: Solution complète et détaillée pour chaque question
3. **hints**: Tableau de 2-4 indices progressifs

**Exemple de structure d'énoncé**:
\`\`\`
Soit la fonction $f$ définie sur $\\\\mathbb{R}$ par $f(x) = x^3 - 3x + 1$.

1. Calculer $f'(x)$ et étudier son signe.
2. Dresser le tableau de variations de $f$.
3. Déterminer les points d'inflexion de $f$.
4. Tracer l'allure de la courbe représentative de $f$.
\`\`\`

### 5. PROGRESSION DE DIFFICULTÉ

Répartis les ${exerciseCount} exercices comme suit:
- **25% premiers**: Applications directes (facile)
- **25% suivants**: Problèmes classiques (moyen)
- **25% suivants**: Problèmes de synthèse (difficile)
- **25% derniers**: Défis et problèmes ouverts (très difficile)

### 6. QUALITÉ PÉDAGOGIQUE

- Adapte le vocabulaire au niveau ${context.level}
- Utilise des contextes réels et motivants
- Varie les types de questions (calcul, démonstration, raisonnement)
- Assure une progression logique dans la difficulté

## EXEMPLE DE SORTIE ATTENDUE

\`\`\`json
[
  {
    "problemTextFr": "Soit $f(x) = 2x^2 - 4x + 1$.\\n\\n1. Calculer $f(0)$ et $f(2)$.\\n2. Déterminer $f'(x)$.\\n3. Résoudre l'équation $f'(x) = 0$.\\n4. Dresser le tableau de variations de $f$.",
    "solutionFr": "**1.** $f(0) = 2(0)^2 - 4(0) + 1 = 1$\\n\\n$f(2) = 2(2)^2 - 4(2) + 1 = 8 - 8 + 1 = 1$\\n\\n**2.** $f'(x) = 4x - 4$\\n\\n**3.** $f'(x) = 0 \\\\Leftrightarrow 4x - 4 = 0 \\\\Leftrightarrow x = 1$\\n\\n**4.** Tableau de variations:\\n\\n$$\\\\begin{array}{|c|c|c|c|}\\n\\\\hline\\nx & -\\\\infty & 1 & +\\\\infty \\\\\\\\\\n\\\\hline\\nf'(x) & - & 0 & + \\\\\\\\\\n\\\\hline\\nf(x) & +\\\\infty & \\\\searrow & f(1) & \\\\nearrow & +\\\\infty \\\\\\\\\\n\\\\hline\\n\\\\end{array}$$",
    "hints": [
      "Pour calculer $f(a)$, remplace $x$ par $a$ dans l'expression de $f$",
      "La dérivée de $x^n$ est $nx^{n-1}$",
      "Le minimum de $f$ est atteint quand $f'(x) = 0$"
    ]
  }
]
\`\`\`

## CONSIGNES FINALES

1. Génère EXACTEMENT ${exerciseCount} exercices
2. Réponds UNIQUEMENT avec le JSON (pas de texte explicatif)
3. Vérifie que TOUS les backslashes sont doublés dans le JSON
4. Assure-toi que TOUTES les expressions mathématiques sont en LaTeX
5. Utilise UNIQUEMENT \`array\` pour les tableaux, JAMAIS \`tabular\`
6. N'utilise JAMAIS de caractères accentués dans les expressions mathématiques

**GÉNÈRE MAINTENANT LES ${exerciseCount} EXERCICES EN JSON**`
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
          <CardTitle>Générateur de Prompt AI</CardTitle>
        </div>
        <CardDescription>
          Créez un prompt détaillé pour DeepSeek, ChatGPT, Claude ou tout autre AI pour générer vos exercices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label>Leçon sélectionnée</Label>
            <div className="text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 p-2 rounded">
              {lesson.titleFr}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInstructions">Instructions supplémentaires (optionnel)</Label>
          <Textarea
            id="additionalInstructions"
            placeholder="Ex: Inclure des problèmes de géométrie, utiliser uniquement des nombres entiers, etc."
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

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📝 Comment utiliser:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Cliquez sur "Copier le Prompt"</li>
            <li>Ouvrez DeepSeek, ChatGPT, Claude ou votre AI préféré</li>
            <li>Collez le prompt et envoyez</li>
            <li>Copiez la réponse JSON générée</li>
            <li>Revenez ici et collez dans l'onglet "Mode JSON"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
