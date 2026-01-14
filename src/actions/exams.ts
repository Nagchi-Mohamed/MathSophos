"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { latexPreprocessor } from "@/lib/latex-preprocessor"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { EducationalLevel, Stream, Prisma } from "@prisma/client"
import { googleGenAIAdmin, parseGoogleAIError } from "@/lib/google-ai"
import { getChapterById } from "@/actions/chapters"
import JSON5 from 'json5'

export type ExamType = "NATIONAL" | "REGIONAL" | "LOCAL"
export type ControlType = "CONTROL_1" | "CONTROL_2" | "CONTROL_3"

export interface LessonSelection {
  id: string
  title: string
  points: number
}

export interface GenerateExamParams {
  type: "EXAM" | "CONTROL"
  cycle: string
  level: string
  stream?: string
  streamId?: string
  moduleId?: string
  // Exam specifics
  examType?: ExamType
  lessons?: LessonSelection[]
  // Control specifics
  semester?: number
  controlNumber?: number
  // Common
  duration?: string // Duration in flexible format (e.g., "1h30min", "2h20min", "1h", "55min")
  includeAnswerSpace?: boolean
  context?: string
}

export interface GeneratedExercise {
  title: string
  problem: string
  solution: string
  points: number
  spaceLines?: number // Number of lines to leave for answer
  // Legacy fields (not actively used)
  exerciseType?: "QCM" | "FREE_RESPONSE"
  qcmOptions?: string[] // For QCM: ["Option A", "Option B", "Option C", "Option D"]
  correctAnswer?: string // For QCM: "A", "B", "C", "D" | For free response: the expected answer
  hints?: string[] // Hints for interactive exercises
}

export interface GeneratedExam {
  id?: string
  title: string
  subtitle: string
  duration: string
  instructions?: string // Instructions générales pour les élèves (format marocain)
  exercises: GeneratedExercise[]
  totalPoints: number
}

export async function generateExamWithAI(params: GenerateExamParams) {
  const {
    type,
    cycle,
    level,
    stream,
    streamId,
    moduleId,
    examType,
    lessons,
    semester,
    controlNumber,
    includeAnswerSpace,
    context,
    duration: userDuration
  } = params

  try {
    // Build the prompt
    const levelDescription = cycle === "SUPERIEUR"
      ? `niveau universitaire (Faculté des Sciences et Techniques)`
      : `niveau ${level}${stream ? ` (${stream})` : ""}`

    const { AGGRESSIVE_MATH_CONTENT_PROTOCOL } = await import("@/lib/ai-prompts")
    const systemPrompt = `${AGGRESSIVE_MATH_CONTENT_PROTOCOL}

Tu es un professeur de mathématiques expert pour le système éducatif marocain avec plus de 20 ans d'expérience.
    Ton objectif est de créer un ${type === "EXAM" ? "examen" : "contrôle continu"} de haute qualité, progressif et structuré comme une série d'exercices professionnelle pour des élèves de ${levelDescription}.
    
    IMPORTANT: Tu dois répondre UNIQUEMENT avec un objet JSON valide qui respecte strictement la structure demandée.
    Ne mets PAS de markdown (pas de \`\`\`json), pas d'introduction, pas de conclusion.
    
    RÈGLE CRITIQUE POUR LE TITRE ET SOUS-TITRE :
    - Le "title" doit être UNIQUEMENT le sujet de l'examen (ex: "EXAMEN DE MATHÉMATIQUES - SÉRIES DE FOURIER")
    - Le "subtitle" doit être UNIQUEMENT le type d'examen si nécessaire (ex: "Examen Local" ou "Session Normale")
    - NE JAMAIS inclure de filière, module, ou identifiants techniques dans le title ou subtitle
    - NE JAMAIS inclure d'IDs ou de codes techniques dans le title ou subtitle
    - Le title doit être simple et descriptif du sujet uniquement`

    let userPrompt = ""

    if (type === "EXAM") {
      // For Supérieur, fetch chapter content if available
      let chapterContext = ""
      if (cycle === "SUPERIEUR" && lessons && lessons.length > 0) {
        try {
          const chapterContents = await Promise.all(
            lessons.map(async (lesson) => {
              // Check if lesson.id is actually a chapter ID (for Supérieur)
              const chapterResult = await getChapterById(lesson.id)
              if (chapterResult.success && chapterResult.data) {
                const chapter = chapterResult.data
                return `\n\n**${lesson.title}** :\n${chapter.contentFr ? chapter.contentFr.substring(0, 1000) : "Contenu du chapitre"}\n`
              }
              return ""
            })
          )
          chapterContext = chapterContents.filter(c => c).join("\n")
        } catch (error) {
          console.error("Error fetching chapter content:", error)
          // Continue without chapter content
        }
      }

      const lessonList = lessons?.map(l => `- ${l.title} (${l.points} points)`).join("\n")
      userPrompt = `Génère un examen ${examType} de mathématiques.
      
      Sujets et barème à respecter STRICTEMENT :
      ${lessonList}
      
      Total des points : ${lessons?.reduce((acc, l) => acc + l.points, 0) || 20}${chapterContext ? `\n\nCONTENU DES CHAPITRES À COUVRIR :${chapterContext}` : ""}`
    } else {
      const lessonList = lessons && lessons.length > 0
        ? `\n\nLeçons à couvrir :\n${lessons.map(l => `- ${l.title} (${l.points} points)`).join("\n")}\nTotal : ${lessons.reduce((acc, l) => acc + l.points, 0)} points`
        : ""

      userPrompt = `Génère le Contrôle Continu N°${controlNumber} du Semestre ${semester}.
      Le contrôle doit couvrir les leçons typiques de cette période pour le programme marocain.${lessonList}`
    }

    // Add context if provided
    if (context && context.trim()) {
      userPrompt += `\n\nCONTEXTE ET INSTRUCTIONS SUPPLÉMENTAIRES :\n${context}\n\nRESPECTE STRICTEMENT ces instructions dans la génération.`
    }

    // Calculate total points
    const totalPoints = lessons?.reduce((acc, l) => acc + l.points, 0) || 20
    const exerciseCount = lessons?.length || 4

    userPrompt += `
    
    Structure JSON attendue (Format Standard Marocain) :
    {
      "title": "Titre de l'examen/contrôle (ex: 'EXAMEN DE MATHÉMATIQUES' ou 'CONTRÔLE CONTINU N°${controlNumber || 1}')",
      "subtitle": "Sous-titre (ex: 'Session ${new Date().getFullYear()}' ou 'Semestre ${semester}')",
      "duration": "Durée (ex: '2h', '1h30')",
      "instructions": "Instructions générales pour les élèves. Format recommandé :\\n- Durée : ${userDuration || (type === 'CONTROL' ? '1h30' : '2h')}\\n- Barème : ${totalPoints} points\\n- La présentation, la rédaction et l'orthographe seront prises en compte\\n- Toute réponse doit être justifiée\\n- L'utilisation de la calculatrice est ${level.includes('COLLEGE') ? 'autorisée' : 'autorisée selon les consignes'}",
      "exercises": [
        {
          "title": "Exercice 1 (X points) : [Thème]",
          "problem": "Énoncé complet avec sous-questions numérotées a), b), c)... Chaque sous-question DOIT avoir ses points : (a) (Y pts), (b) (Z pts)...",
          "solution": "Solution détaillée étape par étape pour chaque sous-question",
          "points": 5,
          "spaceLines": 10
        }
      ],
      "totalPoints": ${totalPoints}
    }
    
    RÈGLES CRITIQUES POUR LE FORMAT JSON :
    - Le champ "title" de chaque exercice DOIT inclure le nombre de points : "Exercice 1 (5 points) : Calcul algébrique"
    - Le champ "problem" DOIT contenir toutes les sous-questions avec leurs points : "a) [Question] (2pts)\\n\\nb) [Question] (3pts)"
    - Le champ "instructions" DOIT contenir les consignes générales au format marocain (durée, barème, présentation, calculatrice)
    - La somme des points de tous les exercices DOIT être exactement ${totalPoints}
    - Chaque exercice DOIT avoir au moins 2 sous-questions (a), b)...)
    - Les sous-questions DOIVENT être progressives (du simple au complexe)
    
    ATTENTION : Le title et subtitle ne doivent JAMAIS contenir :
    - Des identifiants techniques (IDs, codes)
    - Des noms de filière ou module
    - Des informations de structure (Filière: ..., Module: ...)
    - Seulement le sujet mathématique et le type d'examen si nécessaire
    
    STRUCTURE PROFESSIONNELLE OBLIGATOIRE - SYSTÈME ÉDUCATIF MAROCAIN :
    
    ## **1. EN-TÊTE ET MÉTADONNÉES (Format Standard Marocain) :**
    - Le titre doit être clair et professionnel : "EXAMEN DE MATHÉMATIQUES" ou "CONTRÔLE CONTINU N°X"
    - Le sous-titre doit indiquer : "Session ${new Date().getFullYear()}" ou "Semestre ${semester}"
    - Durée clairement indiquée
    - Total des points : ${totalPoints} points
    
    ## **2. INSTRUCTIONS GÉNÉRALES (À inclure dans le premier exercice ou en préambule) :**
    L'examen doit commencer par des instructions professionnelles :
    - "Durée : ${userDuration || (type === 'CONTROL' ? '1h30' : '2h')}"
    - "Barème : ${totalPoints} points"
    - "La présentation, la rédaction et l'orthographe seront prises en compte"
    - "Toute réponse doit être justifiée"
    - "L'utilisation de la calculatrice est ${level.includes('COLLEGE') ? 'autorisée' : 'autorisée selon les consignes'}"
    
    ## **3. STRUCTURE DES EXERCICES (Format Standard Marocain) :**
    
    **3.1. PROGRESSION OBLIGATOIRE :**
    - **Exercice 1 (Premier 20-25% = ${Math.floor(totalPoints * 0.2)}-${Math.floor(totalPoints * 0.25)} points)** : 
      * Application directe du cours
      * Court (2-3 sous-questions)
      * Niveau : Facile à moyen
      * Exemple : "Exercice 1 (${Math.floor(totalPoints * 0.2)} points) : Calcul algébrique"
    
    - **Exercices intermédiaires (Milieu 50-60% = ${Math.floor(totalPoints * 0.5)}-${Math.floor(totalPoints * 0.6)} points répartis)** :
      * Problèmes types examens
      * Moyens (4-6 sous-questions par exercice)
      * Niveau : Moyen
      * Exemple : "Exercice 2 (${Math.floor(totalPoints * 0.3)} points) : Fonctions et dérivées"
    
    - **Dernier exercice (15-20% = ${Math.floor(totalPoints * 0.15)}-${Math.floor(totalPoints * 0.2)} points)** :
      * Problème de synthèse complexe
      * Long (8+ sous-questions)
      * Niveau : Difficile
      * Exemple : "Exercice ${exerciseCount} (${Math.floor(totalPoints * 0.2)} points) : Problème de synthèse"
    
    **3.2. FORMAT OBLIGATOIRE POUR CHAQUE EXERCICE :**
    
    Format standard :
    Exercice N (X points) : [Titre descriptif]
    
    [Contexte ou énoncé principal si nécessaire]
    
    a) [Question] (Y pts)
    b) [Question] (Z pts)
    c) [Question] (W pts)
    ...
    
    **3.3. RÈGLES STRICTES :**
    - Chaque exercice DOIT avoir un titre descriptif du thème
    - TOUS les exercices DOIVENT avoir des SOUS-QUESTIONS numérotées : a), b), c), d)...
    - Points indiqués clairement pour chaque sous-question : (a) (2pts), (b) (3pts)...
    - Le total des points de chaque exercice DOIT être indiqué dans le titre
    - La somme des points de tous les exercices DOIT être exactement ${totalPoints} points
    - Espacement visuel clair entre les exercices
    - Numérotation cohérente et professionnelle
    
    3. FORMATAGE MATHÉMATIQUE (Strict) :
       - Utilise LaTeX pour TOUTES les formules mathématiques
       - Inline: $...$ (ex: $\\frac{3}{4}$, $x^2 + 3x - 5$)
       - Display: $$...$$ (ex: $$\\int_0^1 f(x) dx$$, $$\\lim_{x \\to \\infty} \\frac{1}{x} = 0$$)
       - Fractions: $\\frac{numérateur}{dénominateur}$
       - Puissances: $x^2$, $a^{n+1}$
       - Indices: $a_n$, $x_{i+1}$
       - Opérations: \\times, \\div, +, -, =, \\neq, \\leq, \\geq
       - Parenthèses: \\left( \\right), \\left[ \\right], \\left\\{ \\right\\}
       - Vecteurs: $\\vec{u}$, $\\overrightarrow{AB}$
       - Ensembles: $\\mathbb{R}$, $\\mathbb{N}$, $\\mathbb{Z}$
    
    3.1. RÈGLES CRITIQUES POUR LES TABLEAUX DE VARIATIONS (OBLIGATOIRE) :
       🚫 INTERDICTIONS ABSOLUES :
       - N'utilise JAMAIS l'environnement 'tabular' - utilise UNIQUEMENT 'array'
       - N'utilise JAMAIS de tableaux Markdown (pas de | ... | ... |) pour les tableaux de variations
       - N'utilise JAMAIS f'(α) ou f'(\\alpha) - utilise TOUJOURS f'(x)
       - N'utilise JAMAIS α seul dans la ligne f(x) - utilise TOUJOURS f(α) ou f(\\alpha)
       - N'utilise JAMAIS ∞ et + dans des colonnes séparées - utilise TOUJOURS +∞ dans une seule colonne
       - N'oublie JAMAIS les flèches de variation (\\searrow et \\nearrow)
       
       ✅ FORMAT STANDARD OBLIGATOIRE pour les tableaux de variations :
       Utilise EXCLUSIVEMENT ce format dans un bloc $$...$$ :
       
       $$
       \\begin{array}{|c|c|c|c|c|c|}
       \\hline
       x & 0 & & \\alpha & & +\\infty \\\\
       \\hline
       f'(x) & & - & 0 & + & \\\\
       \\hline
       f(x) & +\\infty & \\searrow & f(\\alpha) & \\nearrow & +\\infty \\\\
       \\hline
       \\end{array}
       $$
       
       STRUCTURE OBLIGATOIRE :
       - Environnement : \\begin{array}{|c|c|c|c|c|c|} ... \\end{array}
       - Lignes horizontales : \\hline après chaque ligne de données
       - Colonnes : 6 colonnes (x, 0, vide, α, vide, +∞)
       - Ligne f'(x) : Doit avoir f'(x) (JAMAIS f'(α)), puis -, 0, + dans les bonnes colonnes
       - Ligne f(x) : Doit avoir +∞, \\searrow, f(\\alpha), \\nearrow, +∞
       - Cellules vides : Utilise & & pour créer des cellules vides entre les valeurs importantes
    
    4. TYPES DE PROBLÈMES (Selon le niveau ${level}) :
       ${level.includes("COLLEGE") ? `
       - Calcul algébrique : développement, factorisation
       - Équations et inéquations du premier degré
       - Proportionnalité et pourcentages
       - Géométrie plane : triangles, cercles, angles
       - Statistiques élémentaires
       ` : `
       - Calcul algébrique avancé : polynômes, fonctions
       - Équations et inéquations (premier et second degré)
       - Fonctions : étude, dérivées, limites
       - Géométrie dans l'espace et analytique
       - Probabilités et statistiques
       - Suites numériques
       `}
    
    5. QUALITÉ PÉDAGOGIQUE (Excellence) :
       - Chaque exercice doit tester des compétences spécifiques
       - Les sous-questions doivent être progressives (du plus simple au plus complexe)
       - Varier les types de questions : calcul, démonstration, application, réflexion
       - Contextualiser avec des situations réelles quand possible
       - Respecter le programme officiel marocain
    
    4. INSTRUCTIONS ET PRÉSENTATION (Format Marocain) :
       - Instructions claires et précises avec verbes d'action du programme marocain :
         * "Calculer", "Démontrer que", "Déterminer", "Résoudre", "Étudier"
         * "Montrer que", "Vérifier que", "Déduire", "En déduire"
         * "Justifier", "Expliquer", "Interpréter"
       - Le contenu doit être en FRANÇAIS
       - ${includeAnswerSpace ? "Prévoir un espace pour la réponse (spaceLines) proportionnel à la longueur attendue. 5-15 lignes selon la complexité" : "Mettre spaceLines à 0"}
       - Utiliser des lignes pointillées pour les réponses : "…………………"
       - Chaque sous-question doit être indépendante et claire
       - Les questions doivent suivre une logique pédagogique (du simple au complexe)
    
    7. SOLUTIONS DÉTAILLÉES :
       - Solutions complètes étape par étape
       - Justifications pour chaque étape importante
       - Résultats simplifiés et vérifiés
       - Formatage LaTeX pour toutes les formules dans les solutions
    
    8. VALIDATION ET RIGUEUR :
       - Vérifier que tous les calculs sont mathématiquement corrects
       - Respecter STRICTEMENT le barème total : ${totalPoints} points
       - Répartir les points de manière équitable et logique
       - S'assurer que la difficulté correspond au niveau ${level}
       - Adapter au programme marocain officiel
    
    5. EXEMPLES DE STRUCTURE PROFESSIONNELLE (Format Marocain) :
    
    **Exemple 1 - Exercice Simple (Application directe) :**
    
    Exercice 1 (5 points) : Calcul algébrique
    
    Soit $f(x) = x^2 - 4x + 3$.
    
    a) Calculer $f(0)$ et $f(2)$. (1pt)
    b) Factoriser $f(x)$. (2pts)
    c) Résoudre l'équation $f(x) = 0$. (2pts)
    
    **Exemple 2 - Exercice Moyen (Problème type examen) :**
    
    Exercice 2 (7 points) : Fonctions et dérivées
    
    Soit $f$ la fonction définie sur $\\mathbb{R}$ par : $f(x) = x^3 - 3x^2 + 2$.
    
    a) Calculer $f'(x)$ où $f'$ est la dérivée de $f$. (1pt)
    b) Étudier le signe de $f'(x)$ sur $\\mathbb{R}$. (2pts)
    c) Dresser le tableau de variations de $f$. (2pts)
    d) Déterminer les coordonnées des points d'intersection de la courbe représentative de $f$ avec l'axe des abscisses. (2pts)
    
    **Exemple 3 - Exercice Complexe (Synthèse) :**
    
    Exercice 3 (8 points) : Problème de synthèse
    
    Une entreprise fabrique des composants électroniques. Le coût de production de $x$ composants est donné par : $C(x) = x^2 + 10x + 100$ (en milliers de dirhams).
    
    a) Calculer le coût de production de 50 composants. (1pt)
    b) Montrer que le coût moyen par composant est : $CM(x) = x + 10 + \\frac{100}{x}$. (1pt)
    c) Calculer $CM'(x)$ et étudier le signe de $CM'(x)$ pour $x > 0$. (2pts)
    d) En déduire le nombre de composants à produire pour minimiser le coût moyen. (2pts)
    e) Calculer ce coût moyen minimal. (1pt)
    f) Interpréter ce résultat dans le contexte du problème. (1pt)
    
    ## **6. BARÈME ET RÉPARTITION DES POINTS (OBLIGATOIRE) :**
    - Le barème total DOIT être exactement ${totalPoints} points
    - Chaque exercice DOIT avoir son total de points dans le titre
    - Chaque sous-question DOIT avoir ses points indiqués
    - La somme de tous les points DOIT être ${totalPoints}
    - Format : (X pts) ou (X points) après chaque sous-question
    
    ## **7. QUALITÉ ET RIGUEUR (Standards Marocains) :**
    - Respecter STRICTEMENT le programme officiel marocain pour ${level}
    - Adapter la difficulté au niveau ${level}
    - Utiliser la terminologie mathématique française officielle
    - Les exercices doivent être réalistes et applicables
    - Contextualiser avec des situations réelles marocaines quand possible
    
    GÉNÈRE EXACTEMENT ${exerciseCount} EXERCICES avec :
    - Une progression de difficulté claire (facile → moyen → difficile)
    - Une structure professionnelle conforme aux standards marocains
    - Un barème total de ${totalPoints} points respecté à la lettre
    - Des sous-questions numérotées (a), b), c)...) avec points individuels
    - Des titres descriptifs pour chaque exercice
    `

    console.log(`🤖 Generating ${type} with AI...`)
    console.log(`   Prompt length: ${(systemPrompt + "\n\n" + userPrompt).length} characters`)

    // Use Gemini 2.5 Flash for speed and quality (admin API key for paid quota)
    const model = googleGenAIAdmin.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ AI response received, length:", text.length)

    if (!text || text.trim().length === 0) {
      throw new Error("La réponse de l'IA est vide. Veuillez réessayer.")
    }

    // Robust JSON parsing with multiple strategies (similar to series generation)
    let parsedData: GeneratedExam | null = null

    // Helper functions for JSON cleaning
    const sanitizeJSON = (jsonStr: string): string => {
      let result = ""
      let inString = false
      let i = 0
      const processed = jsonStr

      while (i < processed.length) {
        const char = processed[i]

        if (char === '"' && (i === 0 || processed[i - 1] !== '\\')) {
          inString = !inString
          result += char
          i++
          continue
        }

        if (inString) {
          // Handle escape sequences
          if (char === '\\') {
            const nextChar = processed[i + 1]
            // Valid escapes
            if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(nextChar)) {
              result += char + nextChar
              i += 2
              continue
            }
            // Unicode
            if (nextChar === 'u') {
              result += char + nextChar
              i += 2
              continue
            }
            // INVALID escape -> Escape the backslash
            result += '\\\\' + nextChar
            i += 2
            continue
          }
          // Handle literal control chars inside strings
          if (char === '\n') { result += '\\n'; i++; continue }
          if (char === '\r') { result += '\\r'; i++; continue }
          if (char === '\t') { result += '\\t'; i++; continue }
          // Remove other control characters
          if (char.charCodeAt(0) < 0x20 && !['\n', '\r', '\t'].includes(char)) {
            i++
            continue
          }
          result += char
          i++
          continue
        }

        result += char
        i++
      }
      return result
    }



    const fixJSONSyntax = (jsonStr: string): string => {
      return jsonStr.replace(/,(\s*[}\]])/g, '$1')
    }

    const aggressiveCleanJSON = (jsonStr: string): string => {
      let cleaned = jsonStr
      // Find JSON object boundaries
      const firstBrace = cleaned.indexOf('{')
      const lastBrace = cleaned.lastIndexOf('}')

      if (firstBrace >= 0 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1)
      }

      // Remove comments
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '')
      cleaned = cleaned.replace(/\/\/.*$/gm, '')

      // Remove control characters
      cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

      // Fix unescaped newlines/tabs in strings
      let inString = false
      let escapeNext = false
      let result = ''

      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i]

        if (escapeNext) {
          result += char
          escapeNext = false
          continue
        }

        if (char === '\\') {
          result += char
          escapeNext = true
          continue
        }

        if (char === '"' && !escapeNext) {
          inString = !inString
          result += char
          continue
        }

        if (inString) {
          if (char === '\n' && cleaned[i - 1] !== '\\') {
            result += '\\n'
          } else if (char === '\r' && cleaned[i - 1] !== '\\') {
            result += '\\r'
          } else if (char === '\t' && cleaned[i - 1] !== '\\') {
            result += '\\t'
          } else {
            result += char
          }
        } else {
          result += char
        }
      }

      return result
    }

    // Extract JSON object by matching braces
    const extractJSONObject = (text: string): string | null => {
      const startMatch = text.match(/\{\s*"/)
      if (!startMatch || startMatch.index === undefined) {
        return null
      }

      let startIndex = startMatch.index
      let depth = 0
      let inString = false
      let escapeNext = false
      let objectStart = -1

      for (let i = startIndex; i < text.length; i++) {
        const char = text[i]

        if (escapeNext) {
          escapeNext = false
          continue
        }

        if (char === '\\' && inString) {
          escapeNext = true
          continue
        }

        if (char === '"' && !escapeNext) {
          inString = !inString
          continue
        }

        if (!inString) {
          if (char === '{') {
            if (depth === 0) {
              objectStart = i
            }
            depth++
          } else if (char === '}') {
            depth--
            if (depth === 0 && objectStart !== -1) {
              return text.substring(objectStart, i + 1)
            }
          }
        }
      }

      return null
    }

    // Clean extracted JSON - remove text before/after
    const cleanExtractedJSON = (jsonStr: string): string => {
      let cleaned = jsonStr.trim()
      // Remove anything before first {
      const firstBrace = cleaned.indexOf('{')
      if (firstBrace > 0) {
        cleaned = cleaned.substring(firstBrace)
      }
      // Remove anything after last }
      const lastBrace = cleaned.lastIndexOf('}')
      if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
        cleaned = cleaned.substring(0, lastBrace + 1)
      }
      return cleaned
    }

    try {
      // Strategy 1: Direct parse with JSON5
      parsedData = JSON5.parse(text)
      console.log("✅ Successfully parsed JSON directly with JSON5")
    } catch (directParseError: any) {
      console.log("❌ Direct parse failed:", directParseError.message)
      console.log("Trying extraction...")

      let jsonStr = ""

      try {
        // 1. Strip Markdown Code Blocks
        let cleanText = text.trim()
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/```(?:json)?\s*\n?/gi, "")
          cleanText = cleanText.replace(/\n?\s*```/g, "")
          cleanText = cleanText.trim()
        }

        // 2. Try robust brace-matching extraction
        const extracted = extractJSONObject(cleanText)
        if (extracted) {
          jsonStr = extracted
          console.log("🎯 Extracted JSON object using brace matching, length:", jsonStr.length)
        } else {
          // 3. Fallback to regex-based extraction
          console.warn("⚠️ Brace matching failed, trying regex extraction")
          const jsonObjectStartRegex = /\{\s*"/
          const match = cleanText.match(jsonObjectStartRegex)

          if (match && match.index !== undefined) {
            const startIndex = match.index
            const endIndex = cleanText.lastIndexOf('}')

            if (endIndex > startIndex) {
              jsonStr = cleanText.substring(startIndex, endIndex + 1)
              console.log("🎯 Extracted JSON object using regex, length:", jsonStr.length)
            } else {
              throw new Error("Found start of JSON object but no valid ending.")
            }
          } else {
            // 4. Last resort: simple brace search
            console.warn("⚠️ Regex extraction failed, falling back to simple search")
            const startIndex = cleanText.indexOf('{')
            const endIndex = cleanText.lastIndexOf('}')
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
              jsonStr = cleanText.substring(startIndex, endIndex + 1)
              console.log("🎯 Extracted JSON object using simple search, length:", jsonStr.length)
            } else {
              throw new Error("No JSON object found in response")
            }
          }
        }

        // Clean any remaining text before/after the JSON object
        jsonStr = cleanExtractedJSON(jsonStr)
        console.log("🧹 Cleaned extracted JSON, length:", jsonStr.length)

        // Verify and fix the extracted JSON starts and ends correctly
        jsonStr = jsonStr.trim()

        if (!jsonStr.startsWith('{')) {
          const startIdx = jsonStr.indexOf('{')
          if (startIdx >= 0) {
            console.warn(`⚠️ Found invalid characters before JSON start, removing ${startIdx} characters`)
            jsonStr = jsonStr.substring(startIdx)
          } else {
            throw new Error("No valid JSON object start found")
          }
        }

        if (!jsonStr.endsWith('}')) {
          const endIdx = jsonStr.lastIndexOf('}')
          if (endIdx >= 0) {
            console.warn(`⚠️ Found invalid characters after JSON end, removing ${jsonStr.length - endIdx - 1} characters`)
            jsonStr = jsonStr.substring(0, endIdx + 1)
          } else {
            throw new Error("No valid JSON object end found")
          }
        }

        if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
          throw new Error("Extracted text is not a valid JSON object")
        }

        console.log("🔧 Validated JSON boundaries, length:", jsonStr.length)

        // Process the extracted JSON with multiple cleaning passes
        let sanitized = jsonStr

        // First pass: basic sanitization
        sanitized = sanitizeJSON(sanitized)
        // sanitized = fixCommonAIErrors(sanitized) // Removed legacy fixer
        sanitized = fixJSONSyntax(sanitized)

        // Ensure it still starts with { after cleaning
        sanitized = sanitized.trim()
        if (!sanitized.startsWith('{')) {
          const braceIdx = sanitized.indexOf('{')
          if (braceIdx >= 0) {
            sanitized = sanitized.substring(braceIdx)
          }
        }

        // Try parsing with progressive cleaning
        let parseAttempts = 0
        const maxAttempts = 4
        let lastError: any = null

        while (parseAttempts < maxAttempts && !parsedData) {
          try {
            const trimmed = sanitized.trim()
            if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
              throw new Error("String doesn't look like a JSON object")
            }

            parsedData = JSON5.parse(trimmed)
            console.log(`✅ Successfully parsed JSON after ${parseAttempts + 1} attempt(s)`)
            break
          } catch (parseErr: any) {
            lastError = parseErr
            parseAttempts++

            if (parseAttempts === 1) {
              console.warn("⚠️ First parse failed, applying aggressive cleaning...")
              sanitized = aggressiveCleanJSON(sanitized)
            } else if (parseAttempts === 2) {
              console.warn("⚠️ Second parse failed, fixing quote issues...")
              sanitized = sanitized.replace(/^[^{]*/, '')
              sanitized = sanitized.replace(/[^}]*$/, '')
              sanitized = aggressiveCleanJSON(sanitized)
            } else if (parseAttempts === 3) {
              console.warn("⚠️ Third parse failed, trying final cleanup...")
              sanitized = aggressiveCleanJSON(sanitized)
              // sanitized = fixCommonAIErrors(sanitized) // Removed legacy fixer
              sanitized = fixJSONSyntax(sanitized)
            }

            if (parseAttempts >= maxAttempts) {
              break
            }
          }
        }

        // Check if we successfully parsed
        if (!parsedData) {
          console.error("❌ All parsing attempts failed. Last error:", lastError?.message)
          throw new Error(`Failed to parse JSON after ${maxAttempts} attempts. ${lastError?.message || 'Unknown error'}`)
        }

      } catch (parseError: any) {
        console.error("❌ Failed to parse extracted JSON after all attempts:", parseError.message)

        // Extract position information
        let errorLine = -1
        let errorCol = -1
        const lineColMatch = parseError.message.match(/(\d+):(\d+)/)

        if (lineColMatch) {
          errorLine = parseInt(lineColMatch[1])
          errorCol = parseInt(lineColMatch[2])

          if (jsonStr) {
            const lines = jsonStr.split('\n')
            if (errorLine > 0 && errorLine <= lines.length) {
              const targetLine = lines[errorLine - 1]
              console.error(`📍 Error at line ${errorLine}, column ${errorCol}:`)
              console.error(`   Line content (first 200 chars): ${JSON.stringify(targetLine.substring(0, 200))}`)
            }
          }
        }

        // Log sample of extracted content
        if (jsonStr) {
          console.error("📄 Extracted JSON (first 1000 chars):", jsonStr.substring(0, 1000))
          console.error("📄 Extracted JSON (last 1000 chars):", jsonStr.substring(Math.max(0, jsonStr.length - 1000)))
        } else {
          console.error("📄 Full AI response (first 2000 chars):", text.substring(0, 2000))
        }

        throw new Error(`Erreur de parsing JSON: ${parseError.message}. Veuillez réessayer.`)
      }
    }

    if (!parsedData) {
      throw new Error("La réponse de l'IA ne contient pas de données valides. Veuillez réessayer.")
    }

    // Override duration with user-provided value if available
    if (userDuration) {
      parsedData.duration = userDuration
    }

    // Clean title and subtitle to remove any filière/module/ID information
    if (parsedData.title) {
      // Remove any filière/module/ID patterns from title
      parsedData.title = parsedData.title
        .replace(/Filière\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/Module\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/CMIX[A-Z0-9]+/g, '')
        .replace(/Faculté\s+des\s+Sciences\s+et\s+Techniques\s*-\s*Filière\s*:?\s*[A-Z0-9]+\s*-\s*Module\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/-\s*Filière\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/-\s*Module\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/\s*-\s*-\s*/g, ' - ')
        .replace(/\s+/g, ' ')
        .replace(/^\s*-\s*|\s*-\s*$/g, '')
        .trim()
    }

    if (parsedData.subtitle) {
      // Remove any filière/module/ID patterns from subtitle
      parsedData.subtitle = parsedData.subtitle
        .replace(/Filière\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/Module\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/CMIX[A-Z0-9]+/g, '')
        .replace(/Faculté\s+des\s+Sciences\s+et\s+Techniques\s*-\s*Filière\s*:?\s*[A-Z0-9]+\s*-\s*Module\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/-\s*Filière\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/-\s*Module\s*:?\s*[A-Z0-9]+/gi, '')
        .replace(/\s*-\s*-\s*/g, ' - ')
        .replace(/\s+/g, ' ')
        .replace(/^\s*-\s*|\s*-\s*$/g, '')
        .trim()
    }

    // Normalize LaTeX and validate
    if (parsedData.exercises) {
      parsedData.exercises = parsedData.exercises.map((ex) => {
        return {
          ...ex,
          problem: latexPreprocessor.normalizeDelimiters(ex.problem),
          solution: latexPreprocessor.normalizeDelimiters(ex.solution),
          spaceLines: ex.spaceLines || 0
        }
      })

      // Validate total points
      const calculatedTotal = parsedData.exercises.reduce((sum, ex) => sum + (ex.points || 0), 0)
      if (Math.abs(calculatedTotal - (parsedData.totalPoints || totalPoints)) > 1) {
        console.warn(`⚠️ Point mismatch: calculated ${calculatedTotal}, expected ${parsedData.totalPoints || totalPoints}`)
        parsedData.totalPoints = calculatedTotal
      }
    }

    return {
      success: true,
      data: parsedData
    }

  } catch (error: any) {
    console.error("❌ Error generating exam:", error)
    console.error("   Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 500) // First 500 chars of stack
    })

    // Check if it's a JSON parsing error (not an API error)
    if (error.message?.includes("JSON") || error.message?.includes("parse") || error.message?.includes("Format de réponse")) {
      return {
        success: false,
        error: error.message || "Erreur lors du parsing de la réponse de l'IA. Veuillez réessayer."
      }
    }

    return {
      success: false,
      error: parseGoogleAIError(error)
    }
  }
}

export async function saveExam(data: GeneratedExam, params: GenerateExamParams, draftId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Add metadata to content for Supérieur exams
    const contentWithMetadata = { ...data } as any
    if (params.cycle === "SUPERIEUR" && params.streamId && params.moduleId) {
      // Fetch stream and lesson names
      try {
        const stream = await prisma.educationalStream.findUnique({
          where: { id: params.streamId },
          select: { name: true }
        })
        const lesson = params.lessons && params.lessons.length > 0
          ? await prisma.lesson.findUnique({
            where: { id: params.lessons[0].id },
            select: { titleFr: true }
          })
          : null

        contentWithMetadata.metadata = {
          streamName: stream?.name || "",
          moduleName: lesson?.titleFr || "", // Store lesson name in moduleName field
          lessonName: lesson?.titleFr || ""
        }
      } catch (error) {
        console.error("Error fetching metadata for exam:", error)
        // Continue without metadata if fetch fails
      }
    }

    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        content: contentWithMetadata, // Store the full JSON with metadata
        cycle: params.cycle,
        level: params.level as EducationalLevel,
        stream: (params.stream as Stream) || "NONE",
        semester: params.cycle === "SUPERIEUR" ? 1 : (params.semester || 1), // For SUPERIEUR, use default 1 (not used)
        type: params.type,
        examType: params.examType,
        controlNumber: params.controlNumber,
        createdById: session.user.id
      }
    })

    // If we have a draftId (from manual creation with uploaded images), 
    // update the images to point to the real exam ID
    if (draftId) {
      await prisma.platformImage.updateMany({
        where: {
          entityType: "exam",
          entityId: draftId
        },
        data: {
          entityId: exam.id
        }
      })
    }

    revalidatePath("/exams-controls")
    revalidatePath("/admin/exams")

    return { success: true, data: exam }
  } catch (error: any) {
    console.error("Error saving exam:", error)
    return { success: false, error: error.message }
  }
}

export async function updateExam(data: GeneratedExam, examId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Verify exam exists and user has permission
    const existingExam = await prisma.exam.findUnique({
      where: { id: examId }
    })

    if (!existingExam) {
      throw new Error("Exam not found")
    }

    // Check if user is the creator or is an admin
    if (existingExam.createdById !== session.user.id) {
      // You might want to add admin check here
      throw new Error("Unauthorized: You can only edit your own exams")
    }

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        content: data as any, // Update the full JSON (includes exercises, duration, totalPoints, etc.)
      }
    })

    revalidatePath("/exams-controls")
    revalidatePath("/admin/exams")
    revalidatePath(`/admin/exams/${examId}/edit`)
    revalidatePath(`/admin/exams/${examId}/pdf`)
    revalidatePath(`/exams-controls/${examId}`)

    return { success: true, data: exam }
  } catch (error: any) {
    console.error("Error updating exam:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteExam(examId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Verify exam exists and user has permission
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    })

    if (!exam) {
      throw new Error("Exam not found")
    }

    // Check if user is the creator or is an admin
    if (exam.createdById !== session.user.id) {
      // You might want to add admin check here
      throw new Error("Unauthorized: You can only delete your own exams")
    }

    await prisma.exam.delete({
      where: { id: examId }
    })

    revalidatePath("/exams-controls")
    revalidatePath("/admin/exams")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting exam:", error)
    return { success: false, error: error.message }
  }
}

export interface ExamFilters {
  cycle?: string
  level?: EducationalLevel
  stream?: Stream
  streamId?: string
  educationalStreamId?: string
  semester?: number
  type?: string
  search?: string
  examType?: string
  sortBy?: 'newest' | 'oldest' | 'title'
}

export async function getPaginatedExams(filters: ExamFilters, limit = 12, offset = 0) {
  try {
    const where: Prisma.ExamWhereInput = {}

    if (filters.cycle) where.cycle = filters.cycle
    if (filters.level) where.level = filters.level
    if (filters.stream) where.stream = filters.stream
    if (filters.semester) where.semester = filters.semester
    if (filters.type) where.type = filters.type
    if (filters.examType) where.examType = filters.examType

    // Text search across title and subtitle
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { subtitle: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Determine sort order
    let orderBy: Prisma.ExamOrderByWithRelationInput = { createdAt: 'desc' }
    if (filters.sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' }
    } else if (filters.sortBy === 'title') {
      orderBy = { title: 'asc' }
    }

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
        include: {
          createdBy: {
            select: { name: true }
          }
        }
      }),
      prisma.exam.count({ where })
    ])

    return {
      success: true,
      data: {
        exams,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    console.error("Error fetching exams:", error)
    return { success: false, error: error.message }
  }
}

export async function getExamById(id: string) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    return { success: true, data: exam }
  } catch (error: any) {
    console.error("Error fetching exam:", error)
    return { success: false, error: error.message }
  }
}

export async function getRelatedExams(examId: string, limit = 6) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { cycle: true, level: true, stream: true, semester: true, type: true }
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    // Find related exams with same level, stream, and semester
    const relatedExams = await prisma.exam.findMany({
      where: {
        id: { not: examId },
        cycle: exam.cycle,
        level: exam.level,
        stream: exam.stream,
        semester: exam.semester
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true }
        }
      }
    })

    return { success: true, data: relatedExams }
  } catch (error: any) {
    console.error("Error fetching related exams:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate an exam from an existing exercise series
 * This creates a high-quality exam by selecting exercises from a series
 */
export async function generateExamFromSeries(params: {
  seriesId: string
  type: "EXAM" | "CONTROL"
  cycle: string
  level: string
  stream?: string
  streamId?: string
  moduleId?: string
  examType?: ExamType
  semester?: number
  controlNumber?: number
  exerciseCount?: number // Number of exercises to select from series
  includeAnswerSpace?: boolean
}) {
  try {
    // Fetch the series with exercises
    const series = await prisma.series.findUnique({
      where: { id: params.seriesId },
      include: {
        exercises: {
          orderBy: { createdAt: 'asc' }
        },
        lesson: {
          select: {
            titleFr: true,
            contentFr: true
          }
        }
      }
    })

    if (!series) {
      return { success: false, error: "Série d'exercices introuvable" }
    }

    if (!series.exercises || series.exercises.length === 0) {
      return { success: false, error: "La série ne contient aucun exercice" }
    }

    // Select exercises with progressive difficulty
    const exerciseCount = params.exerciseCount || Math.min(series.exercises.length, 5)
    const selectedExercises = selectProgressiveExercises(series.exercises, exerciseCount)

    // Calculate points distribution
    const totalPoints = 20
    const pointsPerExercise = Math.floor(totalPoints / selectedExercises.length)
    const remainder = totalPoints % selectedExercises.length

    // Convert exercises to exam format
    const examExercises: GeneratedExercise[] = selectedExercises.map((ex, index) => {
      const points = pointsPerExercise + (index < remainder ? 1 : 0)

      return {
        title: `Exercice ${index + 1}`,
        problem: ex.problemTextFr,
        solution: ex.solutionFr,
        points: points,
        spaceLines: params.includeAnswerSpace ? calculateSpaceLines(ex.problemTextFr.length) : 0
      }
    })

    // Generate exam title
    const title = params.type === "EXAM"
      ? `Examen ${params.examType === "NATIONAL" ? "National" : params.examType === "REGIONAL" ? "Régional" : "Local"} - ${series.title}`
      : `Contrôle N°${params.controlNumber} - Semestre ${params.semester} - ${series.title}`

    const subtitle = params.type === "EXAM"
      ? `${params.cycle} - ${params.level}${params.stream ? ` (${params.stream})` : ''}`
      : `${params.cycle} - ${params.level} - Semestre ${params.semester}`

    const exam: GeneratedExam = {
      title,
      subtitle,
      duration: calculateDuration(exerciseCount, totalPoints),
      exercises: examExercises,
      totalPoints
    }

    return {
      success: true,
      data: exam
    }
  } catch (error: any) {
    console.error("Error generating exam from series:", error)
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de la génération"
    }
  }
}

/**
 * Select exercises with progressive order from a series
 */
function selectProgressiveExercises(exercises: any[], count: number): any[] {
  if (exercises.length <= count) {
    return exercises
  }

  // Sort by order
  const sorted = [...exercises].sort((a, b) => {
    return (a.order || 0) - (b.order || 0)
  })

  // Select evenly distributed exercises
  const selected: any[] = []
  const step = Math.floor(sorted.length / count)

  for (let i = 0; i < count; i++) {
    const index = Math.min(i * step, sorted.length - 1)
    selected.push(sorted[index])
  }

  // Fill remaining slots if needed
  while (selected.length < count && selected.length < sorted.length) {
    const remaining = sorted.filter(e => !selected.includes(e))
    if (remaining.length > 0) {
      selected.push(remaining[0])
    } else {
      break
    }
  }

  // Sort selected by original order
  return selected.sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, count)
}

/**
 * Calculate space lines based on problem length
 */
function calculateSpaceLines(problemLength: number): number {
  const baseLines = Math.ceil(problemLength / 100) // Base on problem length
  return Math.max(5, Math.min(25, baseLines))
}

/**
 * Calculate exam duration based on exercise count and points
 */
function calculateDuration(exerciseCount: number, totalPoints: number): string {
  // Base: 1 hour for 20 points, scale proportionally
  const baseHours = totalPoints / 20
  const exerciseFactor = exerciseCount * 0.1 // 6 minutes per exercise
  const totalHours = baseHours + exerciseFactor

  if (totalHours < 1) {
    return `${Math.ceil(totalHours * 60)} min`
  } else if (totalHours < 2) {
    return `${Math.ceil(totalHours)}h`
  } else {
    const hours = Math.floor(totalHours)
    const minutes = Math.ceil((totalHours - hours) * 60)
    return minutes > 0 ? `${hours}h${minutes > 0 ? minutes : ''}` : `${hours}h`
  }
}
