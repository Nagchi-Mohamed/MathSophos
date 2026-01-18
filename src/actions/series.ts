"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { EducationalLevel, Stream } from "@prisma/client"
import JSON5 from 'json5'
import { latexPreprocessor } from "@/lib/latex-preprocessor"
import { googleGenAIAdmin, parseGoogleAIError, getRotatedAdminClient, getAdminKeyCount } from "@/lib/google-ai"
import { fixLatexJsonEscapes } from "@/lib/ai-utils"

export interface SeriesFilters {
  cycle?: string
  level?: string
  stream?: string
  semester?: string
  educationalStreamId?: string
  moduleId?: string
  lessonId?: string
}

/**
 * Fetch paginated series for a given context.
 */
export async function getPaginatedSeries(
  filters: SeriesFilters,
  limit: number = 12,
  offset: number = 0
) {
  try {
    console.log('📊 getPaginatedSeries called with filters:', filters, 'limit:', limit, 'offset:', offset)
    const startTime = Date.now()

    // Cap limit to prevent excessive data fetching
    const safeLimit = Math.min(limit, 100)

    // Build Prisma where clause
    const where: any = {}

    if (filters.cycle) {
      where.cycle = filters.cycle
    }

    if (filters.level) {
      const validLevels = [
        'COLLEGE_1AC', 'COLLEGE_2AC', 'COLLEGE_3AC',
        'LYCEE_TC', 'LYCEE_1BAC', 'LYCEE_2BAC', 'UNIVERSITY'
      ]
      if (validLevels.includes(filters.level)) {
        where.level = filters.level as EducationalLevel
      }
    }

    if (filters.semester) {
      where.semester = Number(filters.semester)
    }

    if (filters.stream) {
      const validStreams = [
        'TC_LETTRES', 'TC_SCIENCES', 'TC_TECHNOLOGIE', 'SC_MATH_A', 'SC_MATH_B',
        'SC_EXPERIMENTAL', 'SC_PHYSIQUE', 'SC_VIE_TERRE', 'SC_ECONOMIE',
        'LETTRES_HUMAINES', 'NONE'
      ]
      if (validStreams.includes(filters.stream)) {
        where.stream = filters.stream as Stream
      }
    }

    if (filters.educationalStreamId) {
      where.educationalStreamId = filters.educationalStreamId
    }

    if (filters.lessonId) {
      where.lessonId = filters.lessonId
    }

    if (filters.moduleId) {
      where.moduleId = filters.moduleId
    }

    console.log('📊 Prisma where clause:', JSON.stringify(where))

    // Use Promise.race to implement timeout
    const queryTimeout = 10000 // 10 seconds timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), queryTimeout)
    })

    // Fetch series with exercises in a single query
    const dataPromise = Promise.all([
      prisma.series.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: safeLimit,
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              problemTextFr: true,
              solutionFr: true,
              order: true,
              seriesId: true,
            }
          }
        },
      }),
      prisma.series.count({ where }),
    ])

    const [series, total] = await Promise.race([
      dataPromise,
      timeoutPromise
    ]) as [any[], number]

    const elapsed = Date.now() - startTime
    console.log(`✅ getPaginatedSeries completed in ${elapsed}ms, found ${series.length} series`)

    return { success: true, data: { series, total } }
  } catch (error: any) {
    const elapsed = Date.now() - Date.now()
    console.error(`❌ Error fetching series (after ${elapsed}ms):`, error)

    // Handle timeout errors
    if (error?.message?.includes('timeout') ||
      error?.message?.includes('Query timeout')) {
      console.error("⏱️ Database query timeout")
      return {
        success: false,
        error: "La requête a pris trop de temps. Veuillez affiner vos filtres.",
        data: { series: [], total: 0 }
      }
    }

    // Handle connection errors
    if (error?.message?.includes('connection') ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNREFUSED') {
      console.error("🔌 Database connection error")
      return {
        success: false,
        error: "Erreur de connexion à la base de données. Veuillez réessayer.",
        data: { series: [], total: 0 }
      }
    }

    // Generic error
    return {
      success: false,
      error: error.message || "Erreur lors du chargement des séries",
      data: { series: [], total: 0 }
    }
  }
}


/**
 * Fetch lessons that match the given parameters.
 */
export async function getLessonsForParams(filters: SeriesFilters) {
  try {
    const where: any = {}

    // Filter by level (map to DB field `level`)
    if (filters.level) {
      where.level = filters.level
    }

    // Filter by stream
    if (filters.stream) {
      where.stream = filters.stream
    }



    // Filter by educationalStreamId
    if (filters.educationalStreamId) {
      where.educationalStreamId = filters.educationalStreamId
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { order: "asc" },
      select: {
        id: true,
        titleFr: true,
        titleEn: true,
        level: true,
        stream: true,
        semester: true,
      }
    })

    return { success: true, data: { lessons } }
  } catch (error: any) {
    console.error("Error fetching lessons for series:", error)

    // Handle connection/timeout errors gracefully
    if (error?.message?.includes('timeout') ||
      error?.message?.includes('connection') ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNREFUSED') {
      console.error("Database connection error")
      return {
        success: false,
        error: "Database connection timeout. Please check your database connection.",
        data: { lessons: [] }
      }
    }

    return { success: false, error: error.message || "Error fetching lessons" }
  }
}

/**
 * AI generation for exercise series with structured content.
 */
export async function generateSeriesWithAI(params: {
  lessonId: string
  chapterId?: string
  cycle: string
  level: string
  stream?: string | null
  semester: string
  exerciseCount?: number
  additionalInstructions?: string
  educationalStreamId?: string
}) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    throw new Error("Non autorisé")
  }

  if (params.cycle === "PRIMAIRE" || params.cycle === "PRIMARY") {
    throw new Error("Cycle PRIMAIRE supprimé de l'application")
  }
  const count = params.exerciseCount || 20
  try {
    // 1. Fetch lesson for context
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      select: { titleFr: true, contentFr: true },
    })
    if (!lesson) {
      throw new Error("Leçon introuvable")
    }

    // 2. Fetch chapter if chapterId is provided (for Supérieur)
    let chapter: any = null
    let contentToUse = lesson.contentFr || ""
    let titleToUse = lesson.titleFr
    let isChapter = false

    if (params.chapterId) {
      chapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        select: { titleFr: true, contentFr: true, chapterNumber: true },
      })
      if (chapter) {
        contentToUse = chapter.contentFr || ""
        titleToUse = `Chapitre ${chapter.chapterNumber}: ${chapter.titleFr}`
        isChapter = true
      }
    }

    // 3. Build AI prompt
    const contentLabel = isChapter ? "chapitre" : "leçon"
    const { AGGRESSIVE_MATH_CONTENT_PROTOCOL } = await import("@/lib/ai-prompts")
    const prompt = `
      ${AGGRESSIVE_MATH_CONTENT_PROTOCOL}
      
      Rôle : Expert en pédagogie des mathématiques pour le système éducatif marocain (Cycle: ${params.cycle}, Niveau: ${params.level}, Filière: ${params.stream || "Indéfinie"}).

      OBJECTIF : Générer une série progressive de EXACTEMENT ${count} exercices pour le ${contentLabel} "${titleToUse}".
      
      RÈGLES CRITIQUES SUR LA QUANTITÉ :
      - Tu DOIS générer EXACTEMENT ${count} exercices. C'est la priorité absolue.
      - Si le nombre d'exercices est élevé, sois plus concis dans chaque exercice pour ne pas dépasser la limite de longueur.
      - Ne t'arrête jamais avant d'avoir atteint ${count} exercices.

      RÈGLES DE STRUCTURE (CRITIQUE) :
      - CHAQUE exercice DOIT contenir AU MOINS 5 questions ou sous-questions distinctes. (1., 2., 3., 4., 5. ou 1.a, 1.b, 2.a, ...).
      - Il est INTERDIT de générer des exercices à question unique.

      RÈGLES DE PROGRESSION :
      La série doit suivre une progression stricte en difficulté :
      1.  **Applications Directes** (Premiers 25%) : Exercices simples pour fixer les bases (~5 questions).
      2.  **Problèmes Classiques** (25% suivants) : Exercices de niveau moyen, type contrôle continu (~5-7 questions).
      3.  **Problèmes Complexes** (25% suivants) : Exercices nécessitant plus de réflexion, synthèse (~7-10 questions).
      4.  **Défis & Olympiades** (Derniers 25%) : Exercices très difficiles, abstraits ou problèmes ouverts typés Olympiades/Concours d'excellence.

      FORMAT DU CONTENU :
      -   **LaTeX** : Utilise LaTeX pour TOUTES les expressions mathématiques.
          -   Inline : $...$ (ex: $f(x) = x^2$)
          -   Display : $$...$$ (ex: $$\\int_0^1 f(x) dx$$)
          -   IMPORTANT : Échappe correctement les backslashes dans le JSON (ex: "\\frac" pour \frac).
      -   **Structure des questions** : Dans "problemTextFr", numérote clairement les questions (1., 2., a), b)...) et assure-toi qu'il y en a au moins 5.
      -   **Contexte** : Adapte le contenu au programme marocain (${params.level}).
      
      📊 RÈGLES CRITIQUES POUR LES TABLEAUX DE VARIATIONS (OBLIGATOIRE) :
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

      FORMAT DE SORTIE (JSON STRICT) :
      Réponds UNIQUEMENT avec un tableau JSON valide contenant exactement ${count} objets.
      NE PAS utiliser de blocs de code Markdown (pas de \`\`\`json).
      NE PAS inclure de texte avant ou après le JSON.
      Structure de chaque objet :
      {
        "problemTextFr": "Énoncé complet avec AU MOINS 5 questions numérotées. Markdown et LaTeX autorisés.",
        "solutionFr": "Solution détaillée question par question.",
        "hints": ["Indice 1", "Indice 2"],
        "difficulty": "EASY" | "MEDIUM" | "HARD"
      }

      Contexte du ${contentLabel} pour référence :
      ${contentToUse ? contentToUse.substring(0, 1500) : "Pas de contenu détaillé."}
      ${params.additionalInstructions ? `Instructions utilisateur : ${params.additionalInstructions}` : ""}
    `
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY_ADMIN || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY_ADMIN or GOOGLE_GENERATIVE_AI_API_KEY not configured")
    }
    const genAI = googleGenAIAdmin

    console.log("🤖 Calling Gemini API for series generation...")

    // Determine max retries based on available keys
    // We want to try all keys at least once if we hit quota limits
    const { getRotatedAdminClient, getAdminKeyCount } = await import("@/lib/google-ai");
    const totalKeys = getAdminKeyCount();
    const maxRetries = Math.max(3, totalKeys); // Ensure at least 3 retries, or one per key

    let text: string = "";
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        console.log(`🤖 Calling Gemini API (Key Index: ${attempt % totalKeys}) for series generation...`)
        const genAI = getRotatedAdminClient(attempt);

        // Adjust token limit based on exercise count (increased for large exercises)
        const estimatedTokensPerExercise = 1000; // Increased to account for 5+ questions
        const baseTokens = 2000; // For prompt overhead
        const requestedTokens = Math.min(65536, baseTokens + (count * estimatedTokensPerExercise));

        console.log(`📊 Requesting ${requestedTokens} tokens for ${count} exercises`)

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            maxOutputTokens: requestedTokens,
            temperature: 0.7,
          }
        })

        const result = await model.generateContent(prompt)
        console.log(`🤖 API call attempt ${attempt + 1}/${maxRetries + 1} completed, extracting response...`)
        const response = await result.response
        console.log("🤖 Response object received, extracting text...")
        text = response.text()
        console.log(`🤖 Text extracted successfully (${text.length} chars)`)

        // Check if response appears truncated
        const trimmed = text.trim()
        if (!trimmed.endsWith(']') && !trimmed.endsWith('}')) {
          console.warn(`⚠️ WARNING: Response may be truncated (doesn't end with ] or })`)
          console.warn(`⚠️ Last 200 chars: ${text.substring(Math.max(0, text.length - 200))}`)

          // If it's clearly truncated and we have retries left, try again with more tokens
          if (attempt < maxRetries) {
            console.warn(`⚠️ Retrying with increased token limit...`)
            attempt++;
            continue;
          }
        }

        break; // Success, exit loop
      } catch (error: any) {
        attempt++;

        const isQuotaError = error.status === 429 ||
          error.message?.includes("429") ||
          error.message?.includes("Quota exceeded") ||
          error.message?.includes("quota");

        const isOverloadedError = error.status === 503 ||
          error.message?.includes('503') ||
          error.message?.includes('overloaded');

        if (attempt <= maxRetries && (isQuotaError || isOverloadedError)) {
          const errorType = isQuotaError ? "Quota Limit" : "Service Overloaded";
          const waitTime = isQuotaError ? 1000 : 2000 * attempt;

          console.warn(`⚠️ Google AI ${errorType}. Rotating to next API key. Retrying in ${waitTime / 1000}s... (Attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          if (attempt > maxRetries) {
            console.error(`❌ Google AI API Error (Exhausted all ${maxRetries} attempts):`, error.message);
          } else {
            console.error("❌ Basic API Error:", error.message);
          }
          throw new Error(parseGoogleAIError(error));
        }
      }
    }

    console.log("🤖 AI Response received, length:", text.length)
    console.log("🤖 AI Response preview (first 500 chars):", text.substring(0, 500))
    console.log("🤖 AI Response preview (last 500 chars):", text.substring(Math.max(0, text.length - 500)))

    // Check if response appears to be truncated
    const trimmedText = text.trim()
    if (!trimmedText.endsWith(']') && !trimmedText.endsWith('}')) {
      console.warn("⚠️ WARNING: AI response may be truncated - doesn't end with ] or }")
      console.warn("⚠️ Last 200 characters:", text.substring(Math.max(0, text.length - 200)))
    }

    // Helper function to sanitize and fix common JSON issues
    const sanitizeJSON = (jsonStr: string): string => {
      let processed = jsonStr;
      let result = '';
      let inString = false;
      let i = 0;

      while (i < processed.length) {
        const char = processed[i];

        // 1. Handle Quotes
        if (char === '"') {
          if (!inString) {
            inString = true;
            result += char;
            i++;
            continue;
          }
          // Check for escaped quote
          let backslashCount = 0;
          let j = i - 1;
          while (j >= 0 && processed[j] === '\\') {
            backslashCount++;
            j--;
          }
          if (backslashCount % 2 === 0) {
            // Even number of backslashes means the quote is NOT escaped
            inString = false;
          }

          result += char;
          i++;
          continue;
        }

        // 2. Inside String Logic
        if (inString) {
          if (char === '\\') {
            if (i + 1 < processed.length) {
              const nextChar = processed[i + 1];
              // Valid escapes
              if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(nextChar)) {
                result += char + nextChar;
                i += 2;
                continue;
              }
              // Unicode
              if (nextChar === 'u') {
                // Simplified check, just assume it's valid or let JSON parse fail if not
                // But strictly we should check 4 hex digits.
                // For now, let's just pass it through.
                result += char + nextChar;
                i += 2;
                continue;
              }
              // INVALID escape -> Escape the backslash
              result += '\\\\' + nextChar;
              i += 2;
              continue;
            }
          }
          // Handle literal control chars inside strings if needed
          if (char === '\n') { result += '\\n'; i++; continue; }
          if (char === '\r') { result += '\\r'; i++; continue; }
          if (char === '\t') { result += '\\t'; i++; continue; }

          result += char;
          i++;
          continue;
        }

        // 3. Outside String Logic
        // Preserve whitespace, ignore backslashes?
        result += char;
        i++;
      }
      return result;
    }

    // Helper function to fix common JSON syntax issues
    const fixJSONSyntax = (jsonStr: string): string => {
      let fixed = jsonStr;

      // Remove trailing commas before closing braces/brackets
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

      // Fix missing commas between array elements or object properties
      // This is a simple heuristic - look for patterns like } { or ] [ or } " or ] "
      // But be careful not to break valid JSON
      fixed = fixed.replace(/}(\s*)"([^"]*?)":/g, '},$1"$2":');
      fixed = fixed.replace(/](\s*)"([^"]*?)":/g, '],$1"$2":');
      fixed = fixed.replace(/}(\s*){/g, '},{');
      fixed = fixed.replace(/](\s*)\[/g, '],[');

      return fixed;
    }

    // Helper to remove any text that might be before or after the JSON array
    const cleanExtractedJSON = (jsonStr: string): string => {
      let cleaned = jsonStr.trim();

      // Remove any text before the first opening bracket
      const firstBracket = cleaned.indexOf('[');
      if (firstBracket > 0) {
        cleaned = cleaned.substring(firstBracket);
      }

      // Find the last closing bracket and remove everything after it
      let lastBracket = -1;
      let depth = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = cleaned.length - 1; i >= 0; i--) {
        const char = cleaned[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\' && inString) {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === ']') {
            if (depth === 0) {
              lastBracket = i;
            }
            depth++;
          } else if (char === '[') {
            depth--;
          }
        }
      }

      if (lastBracket >= 0 && lastBracket < cleaned.length - 1) {
        cleaned = cleaned.substring(0, lastBracket + 1);
      }

      return cleaned;
    }

    // Helper to extract JSON array by properly matching brackets
    const extractJSONArray = (text: string): string | null => {
      // Find the start of the array
      const startMatch = text.match(/\[\s*\{/);
      if (!startMatch || startMatch.index === undefined) {
        return null;
      }

      let startIndex = startMatch.index;
      let depth = 0;
      let inString = false;
      let escapeNext = false;
      let arrayStart = -1;

      // Find the actual start of the array bracket
      for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\' && inString) {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '[') {
            if (depth === 0) {
              arrayStart = i;
            }
            depth++;
          } else if (char === ']') {
            depth--;
            if (depth === 0 && arrayStart !== -1) {
              return text.substring(arrayStart, i + 1);
            }
          }
        }
      }

      return null;
    }

    // Helper to fallback extract JSON array using a simple stack approach
    const fallbackExtractJSON = (text: string): string | null => {
      const startIdx = text.indexOf('[');
      if (startIdx === -1) return null;

      let depth = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = startIdx; i < text.length; i++) {
        const ch = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (ch === '\\' && inString) {
          escapeNext = true;
          continue;
        }

        if (ch === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (ch === '[') depth++;
          else if (ch === ']') {
            depth--;
            if (depth === 0) {
              return text.substring(startIdx, i + 1);
            }
          }
        }
      }
      return null;
    };

    // Helper to extract valid objects from a potentially truncated array
    const extractValidObjectsAsArray = (text: string): string | null => {
      const startIdx = text.indexOf('[');
      if (startIdx === -1) return null;

      const objects: string[] = [];
      let currentObjectStart = -1;
      let depth = 0;
      let inString = false;
      let escapeNext = false;

      // Start scanning from the first bracket
      for (let i = startIdx; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\' && inString) {
          escapeNext = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '[') {
            depth++;
          } else if (char === ']') {
            depth--;
          } else if (char === '{') {
            depth++;
            // If depth becomes 2 (Array -> Object), this is the start of an item
            if (depth === 2) {
              currentObjectStart = i;
            }
          } else if (char === '}') {
            // If depth drops to 1 (Object -> Array), this is the end of an item
            if (depth === 2 && currentObjectStart !== -1) {
              objects.push(text.substring(currentObjectStart, i + 1));
              currentObjectStart = -1;
            }
            depth--;
          }
        }
      }

      if (objects.length > 0) {
        console.log(`♻️ Recovered ${objects.length} valid objects from truncated response`);
        return `[${objects.join(',')}]`;
      }
      return null;
    };

    // Consolidated cleaning and normalization of extracted JSON string
    const normalizeAndCleanJSON = (jsonStr: string): string => {
      let cleaned = jsonStr;
      // Remove comments
      cleaned = cleaned.replace(/\/\*[^]*?\*\//g, '');
      cleaned = cleaned.replace(/\/\/.*$/gm, '');
      // Remove control characters except allowed whitespace
      cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      // Fix common syntax issues
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1'); // trailing commas
      cleaned = cleaned.replace(/}(\s*)\"([^\"]*?)\":/g, '},$1\"$2\":');
      cleaned = cleaned.replace(/](\s*)\"([^\"]*?)\":/g, '],$1\"$2\":');
      cleaned = cleaned.replace(/}(\s*){/g, '},{');
      cleaned = cleaned.replace(/](\s*)\[/g, '],[');
      return cleaned.trim();
    };

    // Try to parse the JSON response
    let generatedExercises: any = null;
    try {
      const safeText = fixLatexJsonEscapes(text)
      generatedExercises = JSON5.parse(safeText)
      console.log("✅ Successfully parsed JSON directly with JSON5, exercises count:", generatedExercises.length)
    } catch (directParseError: any) {
      console.log("❌ Direct parse failed:", directParseError.message)
      console.log("Trying extraction...")

      let jsonStr = "";

      try {


        // Helper to aggressively clean JSON string
        const aggressiveCleanJSON = (jsonStr: string): string => {
          let cleaned = jsonStr;

          // Remove any text that looks like it's outside JSON structure
          // Try to find the actual JSON array boundaries more carefully
          const firstBracket = cleaned.indexOf('[');
          const lastBracket = cleaned.lastIndexOf(']');

          if (firstBracket >= 0 && lastBracket > firstBracket) {
            cleaned = cleaned.substring(firstBracket, lastBracket + 1);
          }

          // Remove any comments or explanatory text that might be embedded
          cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
          cleaned = cleaned.replace(/\/\/.*$/gm, ''); // Remove // comments

          // Remove any control characters except newlines and tabs (which might be valid in JSON strings)
          cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

          // Try to fix common issues: unescaped quotes, newlines in strings
          // This is a more careful approach - only fix obvious issues
          let inString = false;
          let escapeNext = false;
          let result = '';

          for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];

            if (escapeNext) {
              result += char;
              escapeNext = false;
              continue;
            }

            if (char === '\\') {
              result += char;
              escapeNext = true;
              continue;
            }

            if (char === '"' && !escapeNext) {
              inString = !inString;
              result += char;
              continue;
            }

            if (inString) {
              // Inside a string, escape problematic characters
              if (char === '\n' && cleaned[i - 1] !== '\\') {
                result += '\\n';
              } else if (char === '\r' && cleaned[i - 1] !== '\\') {
                result += '\\r';
              } else if (char === '\t' && cleaned[i - 1] !== '\\') {
                result += '\\t';
              } else {
                result += char;
              }
            } else {
              result += char;
            }
          }

          return result;
        }


        // 1. Strip Markdown Code Blocks
        let cleanText = text.trim();
        console.log("📝 AI response length:", text.length);
        console.log("📝 AI response preview (first 500 chars):", text.substring(0, 500));
        console.log("📝 AI response preview (last 500 chars):", text.substring(Math.max(0, text.length - 500)));

        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/```(?:json)?\s*\n?/gi, "");
          cleanText = cleanText.replace(/\n?\s*```/g, "");
          cleanText = cleanText.trim();
          console.log("🧹 Removed markdown code fences");
        }

        // 2. Try robust bracket-matching extraction first
        let extracted = extractJSONArray(cleanText);

        if (!extracted) {
          console.warn("⚠️ Primary extraction failed, trying fallback...");
          extracted = fallbackExtractJSON(cleanText);
        }

        if (!extracted) {
          console.warn("⚠️ Fallback failed, trying truncation recovery (Scavenger)...");
          extracted = extractValidObjectsAsArray(cleanText);
        }

        if (!extracted) {
          console.warn("⚠️ Scavenger failed, trying brute force regex as last resort...");
          // 3. Brute force: find first [ and last ]
          const firstBracket = cleanText.indexOf('[');
          const lastBracket = cleanText.lastIndexOf(']');

          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            extracted = cleanText.substring(firstBracket, lastBracket + 1);
            console.log("⚠️ Brute force extraction successful");
          }
        }

        if (!extracted) {
          console.error("❌ All extraction methods failed!");
          const preview = cleanText.length > 200 ? cleanText.substring(0, 200) + "..." : cleanText;
          const endPreview = cleanText.length > 200 ? "..." + cleanText.substring(cleanText.length - 200) : "";

          throw new Error(`Failed to extract JSON array from AI response. Length: ${cleanText.length}. Preview: ${preview} ${endPreview}`);
        }


        jsonStr = normalizeAndCleanJSON(extracted);
        console.log("✅ Extracted and normalized JSON array, length:", jsonStr.length);

        // Try parsing with progressive cleaning
        let parseAttempts = 0;
        const maxAttempts = 4;
        let lastError: any = null;


        while (parseAttempts < maxAttempts && !generatedExercises) {
          try {
            // Validate the string looks like JSON before parsing
            const trimmed = jsonStr.trim();
            if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
              throw new Error("String doesn't look like a JSON array");
            }

            generatedExercises = JSON5.parse(trimmed);
            console.log(`✅ Successfully parsed JSON after ${parseAttempts + 1} attempt(s), exercises count:`, generatedExercises.length);
            break;
          } catch (parseErr: any) {
            lastError = parseErr;
            parseAttempts++;

            if (parseAttempts === 1) {
              // First retry: apply additional sanitization
              console.warn("⚠️ First parse failed, applying additional sanitization...");
              jsonStr = sanitizeJSON(jsonStr);
              // jsonStr = fixCommonAIErrors(jsonStr);
            } else if (parseAttempts === 2) {
              // Second retry: apply aggressive cleaning
              console.warn("⚠️ Second parse failed, applying aggressive cleaning...");
              jsonStr = aggressiveCleanJSON(jsonStr);
            } else if (parseAttempts === 3) {
              // Third retry: try to extract individual valid objects
              console.warn("⚠️ Third parse failed, trying to extract individual objects...");
              try {
                // Use a more sophisticated regex to find JSON objects
                const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
                const objectMatches = jsonStr.match(objectPattern);

                if (objectMatches && objectMatches.length > 0) {
                  const validObjects: any[] = [];
                  for (const objStr of objectMatches) {
                    try {
                      const parsed = JSON5.parse(objStr);
                      if (parsed && typeof parsed === 'object' && parsed.problemTextFr) {
                        validObjects.push(parsed);
                      }
                    } catch (e) {
                      // Skip invalid objects
                      continue;
                    }
                  }
                  if (validObjects.length > 0) {
                    generatedExercises = validObjects;
                    console.log(`✅ Extracted ${validObjects.length} valid exercise objects from malformed JSON`);
                    break;
                  }
                }
              } catch (e) {
                // Continue to next attempt
              }
            }

            // If this was the last attempt, we'll throw the error
            if (parseAttempts >= maxAttempts) {
              break;
            }
          }
        }

        // Check if we successfully parsed exercises
        if (!generatedExercises) {
          console.error("❌ All parsing attempts failed. Last error:", lastError?.message);

          // FINAL ATTEMPT: Try to recover from truncated response
          console.warn("🔧 Attempting truncation recovery...");
          try {
            // Try to find the last complete exercise object
            const lastCompleteObjectMatch = jsonStr.match(/\{[^}]*"problemTextFr"[^}]*"solutionFr"[^}]*\}/g);
            if (lastCompleteObjectMatch && lastCompleteObjectMatch.length > 0) {
              const validObjects: any[] = [];
              for (const objStr of lastCompleteObjectMatch) {
                try {
                  const parsed = JSON5.parse(objStr);
                  if (parsed && typeof parsed === 'object' && parsed.problemTextFr && parsed.solutionFr) {
                    validObjects.push(parsed);
                  }
                } catch (e) {
                  // Skip invalid objects
                  continue;
                }
              }

              if (validObjects.length > 0) {
                generatedExercises = validObjects;
                console.log(`✅ Recovered ${validObjects.length} valid exercises from truncated response`);
              } else {
                throw new Error(`Failed to parse JSON after ${maxAttempts} attempts. ${lastError?.message || 'Unknown error'}`);
              }
            } else {
              throw new Error(`Failed to parse JSON after ${maxAttempts} attempts. ${lastError?.message || 'Unknown error'}`);
            }
          } catch (recoveryError: any) {
            console.error("❌ Truncation recovery failed:", recoveryError.message);
            throw new Error(`Failed to parse JSON after ${maxAttempts} attempts. ${lastError?.message || 'Unknown error'}`);
          }
        }

        // Normalize LaTeX
        generatedExercises = generatedExercises.map((ex: any) => ({
          ...ex,
          problemTextFr: latexPreprocessor.normalizeLatex(ex.problemTextFr || ""),
          solutionFr: latexPreprocessor.normalizeLatex(ex.solutionFr || ""),
          hints: (ex.hints || []).map((hint: string) => latexPreprocessor.normalizeLatex(hint))
        }))

      } catch (parseError: any) {
        console.error("❌ Failed to parse extracted JSON after all attempts:", parseError.message)

        // Extract position information from JSON5 error format (line:column)
        let errorLine = -1;
        let errorCol = -1;
        const lineColMatch = parseError.message.match(/(\d+):(\d+)/);

        if (lineColMatch) {
          errorLine = parseInt(lineColMatch[1]);
          errorCol = parseInt(lineColMatch[2]);

          if (jsonStr) {
            const lines = jsonStr.split('\n');
            if (errorLine > 0 && errorLine <= lines.length) {
              const targetLine = lines[errorLine - 1]; // Convert to 0-based
              console.error(`📍 Error at line ${errorLine}, column ${errorCol}:`);
              console.error(`   Line content (first 200 chars): ${JSON.stringify(targetLine.substring(0, 200))}`);

              if (errorCol > 0 && errorCol <= targetLine.length) {
                const beforeChar = targetLine.substring(Math.max(0, errorCol - 50), errorCol - 1);
                const atChar = targetLine[errorCol - 1];
                const afterChar = targetLine.substring(errorCol, Math.min(targetLine.length, errorCol + 50));
                console.error(`   Before: ${JSON.stringify(beforeChar.slice(-30))}`);
                console.error(`   At column ${errorCol}: ${JSON.stringify(atChar)} (char code: ${atChar?.charCodeAt(0)})`);
                console.error(`   After: ${JSON.stringify(afterChar.slice(0, 30))}`);
              }
            }
          }
        }

        // Log sample of extracted content for debugging
        if (jsonStr) {
          console.error("📄 Extracted JSON (first 1000 chars):", jsonStr.substring(0, 1000));
          console.error("📄 Extracted JSON (last 1000 chars):", jsonStr.substring(Math.max(0, jsonStr.length - 1000)));
          console.error("📄 Extracted JSON length:", jsonStr.length);
        } else {
          console.error("📄 Full AI response (first 2000 chars):", text.substring(0, 2000));
          console.error("📄 Full AI response (last 2000 chars):", text.substring(Math.max(0, text.length - 2000)));
        }

        // Provide a more user-friendly error message
        throw new Error(`Erreur lors de la génération de la série. La réponse de l'IA n'a pas pu être analysée correctement. Veuillez réessayer ou utiliser le mode manuel. Détails: ${parseError.message}`)
      }
    }

    if (!generatedExercises || !Array.isArray(generatedExercises) || generatedExercises.length === 0) {
      console.error("❌ Generated exercises is not a valid array:", generatedExercises)
      throw new Error("La réponse de l'IA ne contient pas d'exercices valides. Veuillez réessayer.")
    }

    console.log("📊 Validating", generatedExercises.length, "exercises...")

    // 3. Prepare exercises payload
    const exercisesPayload = generatedExercises.map((ex, i) => ({
      problemTextFr: ex.problemTextFr ?? "",
      solutionFr: ex.solutionFr ?? "",
      hints: ex.hints ?? [],
      slug: `gen - ex - ${Date.now()} -${i} -${Math.random().toString(36).substring(7)} `,
      order: i,
    }))

    // 4. Create series with exercises
    const seriesTitle = isChapter
      ? `Série: ${chapter.titleFr}`
      : `Série: ${lesson.titleFr}`

    const seriesData: any = {
      title: seriesTitle,
      description: params.additionalInstructions || "",
      cycle: params.cycle,
      level: params.level as EducationalLevel,
      semester: Number(params.semester),
      lessonId: params.lessonId || undefined,
      educationalStreamId: params.educationalStreamId || undefined,
      exercises: { create: exercisesPayload },
    }

    // Only include stream if it's provided, otherwise let Prisma use the default
    if (params.stream) {
      seriesData.stream = params.stream as Stream
    }

    const series = await prisma.series.create({
      data: seriesData,
      include: { exercises: true },
    })

    // 5. Revalidate cache and return
    revalidatePath("/admin/exercises/series")
    revalidatePath(`/ admin / exercises / series / ${series.id} `)
    return series
  } catch (error: any) {
    console.error("Error generating series:", error)
    throw new Error(parseGoogleAIError(error))
  }
}

/**
 * Create a series with a custom list of exercises (manual mode).
 */
export async function createSeriesWithExercises(params: {
  title: string
  description?: string
  cycle: string
  level: string
  stream?: string | null
  semester: string
  lessonId: string
  educationalStreamId?: string
  exercises: {
    problemTextFr: string
    solutionFr: string
    hints: string[]
  }[]
}) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    if (params.cycle === "PRIMAIRE" || params.cycle === "PRIMARY") {
      throw new Error("Cycle PRIMAIRE supprimé de l'application")
    }
    const series = await prisma.series.create({
      data: {
        title: params.title,
        description: params.description,
        cycle: params.cycle,
        level: params.level as EducationalLevel,
        stream: params.stream && params.stream !== "NONE" ? (params.stream as Stream) : Stream.NONE,
        semester: Number(params.semester),
        lessonId: params.lessonId,
        educationalStreamId: params.educationalStreamId,
        exercises: {
          create: params.exercises.map((ex, i) => ({
            problemTextFr: ex.problemTextFr,
            solutionFr: ex.solutionFr,
            hints: ex.hints,
            slug: `manual - ex - ${Date.now()} -${i} -${Math.random().toString(36).substring(7)} `,
            order: i,
          })),
        },
      },
      include: { exercises: true },
    })
    revalidatePath("/admin/exercises/series")
    revalidatePath(`/admin/exercises/series/${series.id}`)
    return { success: true, data: series }
  } catch (error: any) {
    console.error("Error creating series with exercises:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetch a single series by its ID.
 */
export async function getSeriesById(id: string) {
  try {
    const series = await prisma.series.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        titleEn: true,
        description: true,
        descriptionEn: true,
        slug: true,
        cycle: true,
        level: true,
        stream: true,
        semester: true,
        public: true,
        lessonId: true,
        educationalStreamId: true,
        imagesUsed: true,
        createdAt: true,
        updatedAt: true,
        exercises: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            slug: true,
            problemTextFr: true,
            problemTextEn: true,
            solutionFr: true,
            solutionEn: true,
            hints: true,
            order: true,
            lessonId: true,
            seriesId: true,
            exerciseType: true,
            qcmOptions: true,
            correctAnswer: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        lesson: {
          select: {
            id: true,
            titleFr: true,
            titleEn: true,
            slug: true,
            level: true,
            stream: true,
            semester: true,
            category: true,
            moduleId: true,
            educationalStreamId: true,
            module: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                educationalStreamId: true,
                order: true,
              }
            },
            educationalStream: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                level: true,
                semesterCount: true,
              }
            },
            chapters: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                titleFr: true,
                titleEn: true,
                slug: true,
                chapterNumber: true,
                order: true,
              }
            }
          }
        },
        educationalStream: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            level: true,
            semesterCount: true,
          }
        }
      },
    });
    return { success: true, data: series }
  } catch (error: any) {
    console.error("Error fetching series by ID:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Toggle the visibility (public/private) of a series.
 */
export async function toggleSeriesVisibility(id: string) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    const series = await prisma.series.findUnique({
      where: { id },
      select: { public: true }
    })

    if (!series) {
      throw new Error("Series not found")
    }

    const updatedSeries = await prisma.series.update({
      where: { id },
      data: { public: !series.public }
    })

    revalidatePath(`/ admin / exercises / series / ${id} `)
    revalidatePath("/admin/exercises/series")

    return { success: true, data: updatedSeries }
  } catch (error: any) {
    console.error("Error toggling series visibility:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing series and its exercises.
 */
export async function updateSeries(
  id: string,
  data: {
    title: string
    description?: string
    semester: number
    exercises: {
      id?: string
      problemTextFr: string
      solutionFr: string
      hints: string[]
    }[]
  }
) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    // 1. Update series details
    const series = await prisma.series.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        semester: data.semester,
      },
    })

    // 2. Handle exercises
    // We'll use a transaction or just sequential operations for simplicity
    // First, get existing exercises to know which ones to delete if needed
    // For now, we'll just upsert or delete.
    // A simpler approach for this MVP:
    // - Delete all existing exercises for this series (or mark deleted)
    // - Create new ones
    // BUT that loses history/stats if we had them.
    // Better: Update existing ones, create new ones, delete removed ones.

    const existingExercises = await prisma.exercise.findMany({
      where: { seriesId: id },
      select: { id: true }
    })
    const existingIds = existingExercises.map(e => e.id)
    const incomingIds = data.exercises.map(e => e.id).filter(Boolean) as string[]

    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))

    // Delete removed exercises
    if (idsToDelete.length > 0) {
      await prisma.exercise.deleteMany({
        where: { id: { in: idsToDelete } }
      })
    }

    // Upsert exercises
    for (const [index, ex] of data.exercises.entries()) {
      const exerciseData = {
        problemTextFr: ex.problemTextFr,
        solutionFr: ex.solutionFr,
        hints: ex.hints,
        order: index,
      }

      if (ex.id) {
        // Update
        await prisma.exercise.update({
          where: { id: ex.id },
          data: exerciseData
        })
      } else {
        // Create
        await prisma.exercise.create({
          data: {
            ...exerciseData,
            seriesId: id,
            slug: `manual - ex - ${Date.now()} -${index} -${Math.random().toString(36).substring(7)} `,
          }
        })
      }
    }

    revalidatePath("/admin/exercises/series")
    revalidatePath(`/admin/exercises/series/${id}`)
    revalidatePath(`/print/exercises/${id}`)
    return { success: true, data: series }
  } catch (error: any) {
    console.error("Error updating series:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a series and all its exercises.
 */
export async function deleteSeries(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Seul un administrateur peut supprimer une série" }
  }

  try {
    // Delete all exercises first (cascade should handle this, but being explicit)
    await prisma.exercise.deleteMany({
      where: { seriesId: id }
    })

    // Delete the series
    await prisma.series.delete({
      where: { id }
    })

    revalidatePath("/admin/exercises/series")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting series:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete an exercise from a series.
 */
export async function deleteExercise(exerciseId: string, seriesId: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Seul un administrateur peut supprimer un exercice" }
  }

  try {
    await prisma.exercise.delete({
      where: { id: exerciseId }
    })

    revalidatePath(`/admin/exercises/series/${seriesId}`)
    revalidatePath(`/ admin / exercises / series / ${seriesId}/edit`)
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting exercise:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Reorder exercises in a series.
 */
export async function reorderExercises(seriesId: string, exerciseIds: string[]) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    // Update each exercise with its new order
    await Promise.all(
      exerciseIds.map((id, index) =>
        prisma.exercise.update({
          where: { id },
          data: { order: index }
        })
      )
    )

    revalidatePath(`/admin/exercises/series/${seriesId}`)
    revalidatePath(`/admin/exercises/series/${seriesId}/edit`)
    revalidatePath(`/print/exercises/${seriesId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error reordering exercises:", error)
    return { success: false, error: error.message }
  }
}
