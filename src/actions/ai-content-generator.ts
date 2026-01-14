"use server"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { openai, createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import { Lesson, Exercise } from "@/types/content"
import { prisma } from "@/lib/prisma"
import { latexPreprocessor } from "@/lib/latex-preprocessor"
import { googleGenAIAdmin, parseGoogleAIError, getRotatedAdminClient, getAdminKeyCount } from "@/lib/google-ai"

// Configure Google Gemini provider (Vercel AI SDK - kept for compatibility)
// Use admin key for content generation
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY_ADMIN || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Configure DeepSeek provider
const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export type ModelConfig = {
  provider: 'google' | 'openai' | 'deepseek';
  modelId: string;
}

function getModel(config: ModelConfig) {
  switch (config.provider) {
    case 'openai':
      return openai(config.modelId);
    case 'deepseek':
      return deepseek(config.modelId);
    case 'google':
    default:
      return google(config.modelId);
  }
}

// Simplified lesson template for better AI generation
const SIMPLIFIED_LESSON_TEMPLATE = {
  title: "Titre de la leçon",
  introduction: "Introduction engageante avec contexte",
  definitions: [
    {
      "term": "Terme mathématique",
      "definition": "Définition claire et précise",
      "example": "Exemple simple"
    }
  ],
  theorems: [
    {
      "name": "Nom du théorème",
      "statement": "Énoncé du théorème",
      "proof": "Démonstration (si approprié pour le niveau)",
      "application": "Application pratique"
    }
  ],
  formulas: [
    {
      "formula": "Formule en LaTeX (ex: $ax^2 + bx + c = 0$)",
      explanation: "Explication de la formule",
      variables: "Description des variables"
    }
  ],
  examples: [
    {
      "title": "Exemple d'application",
      "problem": "Énoncé du problème",
      "solution": "Solution détaillée étape par étape",
      "explanation": "Pourquoi cette méthode fonctionne"
    }
  ],
  exercises: [
    {
      "question": "Question d'exercice",
      "answer": "Réponse attendue",
      "hints": ["Indice 1", "Indice 2"]
    }
  ],
  summary: "Résumé des points clés de la leçon",
  commonMistakes: ["Erreur courante 1", "Erreur courante 2"]
}

const SIMPLIFIED_EXERCISE_TEMPLATE = {
  title: "Titre de l'exercice",
  problem: "Énoncé du problème",
  difficulty: "easy|medium|hard",
  solution: "Solution détaillée",
  hints: ["Indice 1", "Indice 2"],
  points: 10
}

interface GenerateContentParams {
  contentType: "lesson" | "exercise"
  topic: string
  difficulty: string
  gradeLevel: string
  stream?: string
  additionalInstructions?: string
  includeExamples?: boolean
  includeVisuals?: boolean
  modelConfig?: ModelConfig
}

/**
 * Generate content using AI
 */
export async function generateMathContent(params: GenerateContentParams) {
  const {
    contentType,
    topic,
    difficulty,
    gradeLevel,
    stream,
    additionalInstructions,
    modelConfig = { provider: 'google', modelId: 'gemini-2.5-flash' }
  } = params

  // Initialize loop variables
  let retryCount = 0;
  const maxRetries = getAdminKeyCount() + 1; // Try all keys once + 1 original
  let lastError: any = null;

  while (retryCount < maxRetries) {
    try {
      const template = contentType === "lesson" ? SIMPLIFIED_LESSON_TEMPLATE : SIMPLIFIED_EXERCISE_TEMPLATE

      // Build the prompt with enhanced instructions
      const { AGGRESSIVE_MATH_CONTENT_PROTOCOL } = await import("@/lib/ai-prompts")
      const systemPrompt = `${AGGRESSIVE_MATH_CONTENT_PROTOCOL}

Tu es un professeur de mathématiques expert pour le système éducatif marocain.
    Ton objectif est de créer du contenu pédagogique de haute qualité pour des élèves de niveau ${gradeLevel} ${stream ? `(${stream})` : ""}.
    
    ⚠️ RÈGLES CRITIQUES POUR LE FORMAT JSON:
    1. Réponds UNIQUEMENT avec un objet JSON valide qui respecte strictement la structure demandée
    2. Ne mets PAS de markdown (pas de \`\`\`json, pas de code blocks)
    3. Pas d'introduction, pas de conclusion, pas de texte avant ou après le JSON
    4. Commence directement par { et termine par }
    5. 🚨 CRITICAL: ÉCHAPPEMENT DES CARACTÈRES SPÉCIAUX dans les chaînes JSON:
       - 🚫 NE JAMAIS utiliser \\n ou \\\\n pour les retours à la ligne
       - ✅ TOUJOURS utiliser de VRAIES NEWLINES (appuyer sur Entrée) dans les chaînes JSON
       - ✅ JSON supporte les vraies newlines dans les chaînes - utilise-les directement !
       - Les tabulations doivent être \\t (ou vraies tabulations si nécessaire)
       - Les guillemets dans les chaînes doivent être \\"
       - Les backslashes doivent être \\\\ (double backslash)
       - Les caractères de contrôle doivent être échappés avec \\uXXXX
    6. Toutes les chaînes JSON doivent être entre guillemets doubles "
    7. Vérifie que ton JSON est valide avant de le renvoyer (pas d'erreurs de syntaxe)
    8. EXEMPLE CORRECT pour plusieurs équations sur des lignes séparées:
       "proof": "Texte introductif $ ... $ 
       $ première équation $ 
       $ deuxième équation $ 
       $ troisième équation $"
       (Remarque: les vraies newlines entre les équations)`

      const userPrompt = `Génère un contenu de type "${contentType}" sur le sujet : "${topic}".
    Niveau de difficulté : ${difficulty}
    ${gradeLevel ? `Niveau éducatif : ${gradeLevel}` : ""}
    ${stream ? `Filière/Stream : ${stream}` : ""}
    
    ${additionalInstructions ? `\n📝 INSTRUCTIONS DÉTAILLÉES:\n${additionalInstructions}\n` : ""}
    
    📋 STRUCTURE JSON ATTENDUE (respecte EXACTEMENT cette structure) :
    ${JSON.stringify(template, null, 2)}
    
    RÈGLES DE FORMATAGE :
    1. Utilise LaTeX pour TOUTES les formules mathématiques.
    2. Pour les formules en ligne, utilise $...$ (ex: $f(x) = x^2$)
    3. Pour les formules centrées, utilise $$...$$ (ex: $$\\int_0^1 x dx$$)
    4. N'utilise JAMAIS \\( ... \\) ou \\[ ... \\]
    5. Échappe correctement les backslashes en JSON (ex: "\\\\frac{1}{2}")
    6. Le contenu doit être en FRANÇAIS.
    
    RÈGLES CRITIQUES POUR LES TABLEAUX DE VARIATIONS (OBLIGATOIRE) :
    🚫 INTERDICTIONS ABSOLUES :
    - N'utilise JAMAIS l'environnement 'tabular' - utilise UNIQUEMENT 'array'
    - N'utilise JAMAIS de tableaux Markdown (pas de | ... | ... |) pour les tableaux de variations
    - N'utilise JAMAIS f'(α) ou f'(\\alpha) - utilise TOUJOURS f'(x)
    - N'utilise JAMAIS α seul dans la ligne f(x) - utilise TOUJOURS f(α) ou f(\\alpha)
    - N'utilise JAMAIS ∞ et + dans des colonnes séparées - utilise TOUJOURS +∞ dans une seule colonne
    - N'oublie JAMAIS les flèches de variation (\\\\searrow et \\\\nearrow)
    
    ✅ FORMAT STANDARD OBLIGATOIRE pour les tableaux de variations :
    Utilise EXCLUSIVEMENT ce format dans un bloc $$...$$ :
    
    $$
    \\\\begin{array}{|c|c|c|c|c|c|}
    \\\\hline
    x & 0 & & \\\\alpha & & +\\\\infty \\\\
    \\\\hline
    f'(x) & & - & 0 & + & \\\\
    \\\\hline
    f(x) & +\\\\infty & \\\\searrow & f(\\\\alpha) & \\\\nearrow & +\\\\infty \\\\
    \\\\hline
    \\\\end{array}
    $$
    
    STRUCTURE OBLIGATOIRE :
    - Environnement : \\\\begin{array}{|c|c|c|c|c|c|} ... \\\\end{array}
    - Lignes horizontales : \\\\hline après chaque ligne de données
    - Colonnes : 6 colonnes (x, 0, vide, α, vide, +∞)
    - Ligne f'(x) : Doit avoir f'(x) (JAMAIS f'(α)), puis -, 0, + dans les bonnes colonnes
    - Ligne f(x) : Doit avoir +∞, \\\\searrow, f(\\\\alpha), \\\\nearrow, +∞
    - Cellules vides : Utilise & & pour créer des cellules vides entre les valeurs importantes
    
    EXEMPLE COMPLET CORRECT pour f(x) = (x-1)(ln x - 1) :
    $$
    \\\\begin{array}{|c|c|c|c|c|c|}
    \\\\hline
    x & 0 & & \\\\alpha & & +\\\\infty \\\\
    \\\\hline
    f'(x) & & - & 0 & + & \\\\
    \\\\hline
    f(x) & +\\\\infty & \\\\searrow & f(\\\\alpha) & \\\\nearrow & +\\\\infty \\\\
    \\\\hline
    \\\\end{array}
    $$

    ${contentType === "exercise" ? `
    RÈGLES SPÉCIFIQUES POUR LES EXERCICES :
    - Les exercices DOIVENT être alignés sur le programme marocain pour le niveau ${gradeLevel}
    - Utilise des difficultés appropriées : "easy", "medium", "hard" selon le niveau
    - Inclut des applications concrètes quand possible
    - Les solutions doivent être pédagogiques et détaillées
    - Les indices doivent guider l'élève sans donner la réponse complète
    - Exemple d'exercice pour ${gradeLevel} : créer des problèmes similaires aux examens officiels marocains
    ` : `
    RÈGLES SPÉCIFIQUES POUR LES LEÇONS/CHAPITRES :
    - Le contenu DOIT être aligné sur le programme marocain pour le niveau ${gradeLevel}
    - Inclut des définitions claires, des théorèmes avec démonstrations si appropriées
    - Ajoute des exemples concrets et des applications pratiques
    - Structure le contenu de manière progressive et pédagogique
    - Utilise un langage adapté au niveau ${gradeLevel}
    `}

    ⚠️ RAPPEL FINAL: Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après.
    Commence directement par { et termine par }.
    
    Génère le JSON maintenant :`

      console.log(`🤖 Generating ${contentType} content with AI (${modelConfig.provider} - ${modelConfig.modelId})...`)

      let text = "";

      if (modelConfig.provider === 'google') {
        // Use direct Google SDK for Google models
        console.log(`   Using direct Google Generative AI SDK (Attempt ${retryCount + 1}/${maxRetries})`)
        const client = retryCount > 0 ? getRotatedAdminClient(retryCount) : googleGenAIAdmin;
        const model = client.getGenerativeModel({ model: modelConfig.modelId });
        const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt);
        const response = await result.response;
        text = response.text();
      } else {
        // Use Vercel AI SDK for other providers
        console.log("   Using Vercel AI SDK")
        const result = await generateText({
          model: getModel(modelConfig),
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          maxRetries: 3,
        })
        text = result.text;
      }

      console.log("✅ AI response received, length:", text.length)

      let cleanText = text.trim()

      // Remove markdown code blocks
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "")
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "")
      }

      // Remove any leading/trailing whitespace or newlines
      cleanText = cleanText.trim()

      // Fix LaTeX/JSON escape collisions (e.g. \neq -> \n + eq)
      // We must do this BEFORE parsing JSON
      const { fixLatexJsonEscapes } = await import("@/lib/ai-utils")
      cleanText = fixLatexJsonEscapes(cleanText)

      // Remove any text before the first { or after the last }
      const firstBrace = cleanText.indexOf('{')
      const lastBrace = cleanText.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1)
      }

      // Parse JSON with enhanced error handling and retry with fixes
      let parsedData
      let parseAttempts = 0
      const maxAttempts = 3

      while (parseAttempts < maxAttempts) {
        try {
          parsedData = JSON.parse(cleanText)
          console.log("✅ JSON parsed successfully")
          break
        } catch (parseError: any) {
          parseAttempts++
          console.error(`❌ JSON Parse Error (attempt ${parseAttempts}/${maxAttempts}):`, parseError.message)


          if (parseAttempts >= maxAttempts) {
            // Last attempt: try to fix common issues using centralized robust logic
            try {
              console.log("⚠️ Using fixCommonAIErrors for aggressive cleanup...")
              const fixedText = cleanText

              // Still try to fix trailing commas as fixCommonAIErrors might not catch all JSON specific syntax errors
              const jsonSyntaxFixed = fixedText.replace(/,(\s*[}\]])/g, '$1')

              parsedData = JSON.parse(jsonSyntaxFixed)
              console.log("✅ JSON parsed after standardized AI error fixing")
              break
            } catch (finalError: any) {
              // Attempt to find JSON object if mixed with text as a final fallback
              const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                try {
                  parsedData = JSON.parse(jsonMatch[0])
                  console.log("✅ JSON extracted from mixed content")
                  break
                } catch (e: any) {
                  console.error("❌ Failed to parse extracted JSON:", e.message)
                  console.log("📄 Cleaned text (first 1000 chars):", cleanText.substring(0, 1000))
                  console.log("📄 Cleaned text (last 500 chars):", cleanText.substring(Math.max(0, cleanText.length - 500)))
                  throw new Error(`Impossible de parser la réponse AI en JSON: ${e.message}. La réponse AI n'est pas dans le format JSON attendu. Position de l'erreur: ${parseError.message.includes('position') ? parseError.message : 'inconnue'}`)
                }
              } else {
                throw new Error(`Format de réponse invalide. Aucun objet JSON trouvé dans la réponse. Réponse reçue: ${text.substring(0, 200)}...`)
              }
            }
          } else {
            // Try to fix the specific error mentioned
            if (parseError.message.includes('Bad escaped character')) {
              // More robust fix for bad escaped characters
              // This function properly handles backslashes in JSON strings
              const sanitizeEscapes = (jsonStr: string): string => {
                let result = ""
                let inString = false
                let i = 0

                while (i < jsonStr.length) {
                  const char = jsonStr[i]

                  if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\' || (i > 1 && jsonStr[i - 2] === '\\'))) {
                    // Toggle string state, but handle escaped quotes
                    let backslashCount = 0
                    let j = i - 1
                    while (j >= 0 && jsonStr[j] === '\\') {
                      backslashCount++
                      j--
                    }
                    if (backslashCount % 2 === 0) {
                      inString = !inString
                    }
                    result += char
                    i++
                    continue
                  }

                  if (inString && char === '\\') {
                    // We're inside a string and found a backslash
                    if (i + 1 < jsonStr.length) {
                      const nextChar = jsonStr[i + 1]
                      // Valid escape sequences
                      if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(nextChar)) {
                        result += char + nextChar
                        i += 2
                        continue
                      }
                      // Unicode escape
                      if (nextChar === 'u' && i + 5 < jsonStr.length) {
                        const hex = jsonStr.substring(i + 2, i + 6)
                        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                          result += char + nextChar + hex
                          i += 6
                          continue
                        }
                      }
                      // Invalid escape - escape the backslash itself
                      result += '\\\\' + nextChar
                      i += 2
                      continue
                    } else {
                      // Backslash at end of string - escape it
                      result += '\\\\'
                      i++
                      continue
                    }
                  }

                  // Regular character
                  result += char
                  i++
                }

                return result
              }

              cleanText = sanitizeEscapes(cleanText)
              console.log("🔧 Fixed bad escaped characters in JSON")
            }
          }
        }
      }

      // Normalize LaTeX in generated content to fix malformed AI output and add delimiters before storage
      if (contentType === "exercise") {
        if (parsedData?.problem) {
          parsedData.problem = latexPreprocessor.normalizeDelimiters(parsedData.problem);
        }
        if (parsedData?.solution) {
          parsedData.solution = latexPreprocessor.normalizeDelimiters(parsedData.solution);
        }
        if (parsedData?.hints && Array.isArray(parsedData.hints)) {
          parsedData.hints = parsedData.hints.map((hint: string) => latexPreprocessor.normalizeDelimiters(hint));
        }
      }

      return {
        success: true,
        data: parsedData
      }

    } catch (error: any) {
      console.error(`❌ Error generating content (Attempt ${retryCount + 1}):`, error.message)
      lastError = error;

      // Check for quota error
      // Check for quota error or service unavailable
      const isRetriableError = error.status === 429 || error.status === 503 ||
        error.message?.includes("429") ||
        error.message?.includes("503") ||
        error.message?.includes("Quota exceeded") ||
        error.message?.includes("quota") ||
        error.message?.includes("overloaded");

      if (isRetriableError && modelConfig.provider === 'google') {
        console.log(`⚠️ Quota exceeded or service overloaded. Rotating API key and retrying in 2s...`)
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
        continue;
      }

      // If not a quota error, we stop retrying
      break;
    }
  }

  // If we get here, it means we exhausted retries or had a non-retriable error
  return {
    success: false,
    error: parseGoogleAIError(lastError || new Error("Unknown error during generation"))
  }
}

/**
 * Generate AI reply for forum posts
 */
export async function generateAIReply(postContent: string, contextId?: string) {
  // Default system prompt

  // NOTE: For development, return a placeholder reply
  return { data: "(AI reply placeholder)" };
}
