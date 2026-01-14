"use server"

import { googleGenAIAdmin, parseGoogleAIError, getRotatedAdminClient, getAdminKeyCount } from "@/lib/google-ai"
import { fixLatexJsonEscapes } from "@/lib/ai-utils"
import { prisma } from "@/lib/prisma"

// Define the interface for the review request
interface ReviewLessonParams {
  currentContent: string
  metadata: {
    gradeLevel: string
    stream?: string
    subject?: string
    title: string
  }
  guidelines?: string
  guidelinesImages?: string[] // Base64 strings
  userInstructions?: string
}

// Define the interface for the review response
interface ReviewResult {
  success: boolean
  data?: {
    refinedContent: string
    changesReport: string[]
  }
  error?: string
}

/**
 * Review and refine lesson content based on Moroccan pedagogical guidelines
 */
export async function reviewLessonContent(params: ReviewLessonParams): Promise<ReviewResult> {
  const { currentContent, metadata, guidelines, guidelinesImages, userInstructions } = params

  console.log(`🔍 Starting AI Lesson Review for: ${metadata.title} (${metadata.gradeLevel})`)

  // Initialize loop variables for consistency with other AI actions
  let retryCount = 0;
  const maxRetries = getAdminKeyCount() + 1;
  let lastError: any = null;

  while (retryCount < maxRetries) {
    try {
      // 1. Construct the System Prompt
      const systemPrompt = `Tu es un Inspecteur Pédagogique Expert du Ministère de l'Éducation Nationale au Maroc.
Ta mission est de RÉVISER et CORRIGER le contenu d'une leçon pour qu'elle soit PARFAITEMENT CONFORME aux "Orientations Pédagogiques" (OP) officielles.

CONTEXTE DE LA LEÇON :
- Titre : ${metadata.title}
- Niveau : ${metadata.gradeLevel}
- Filière : ${metadata.stream || "Tronc Commun"}
- Matière : ${metadata.subject || "Mathématiques"}

OBJECTIFS DE LA RÉVISION :
1. VÉRIFIER la conformité stricte avec le programme officiel du niveau et de la filière indiqués.
2. DÉTECTER et SUPPRIMER tout concept hors programme (ex: pas d'intégrales en 1ère Bac, pas de concepts Sci. Math en Sci. Exp).
3. AJOUTER les éléments pédagogiques manquants exigés par les OP fournies (ex: approches introductives spécifiques).
4. CORRIGER le ton ou la formulation pour correspondre aux standards scolaires marocains.
5. RESPECTER strictement le formatage LaTeX ($...$ pour inline, $$...$$ pour block).

INSTRUCTIONS DE SORTIE :
Tu dois fournir ta réponse en format JSON UNIQUE avec la structure suivante :
{
  "refinedContent": "Le contenu complet de la leçon révisée et corrigée (format Markdown/LaTeX)",
  "changesReport": [
    "Description précise de la modification 1 (ex: Suppression de la section X car hors programme)",
    "Description précise de la modification 2 (ex: Ajout de l'exemple Y demandé par les OP)"
  ]
}

RÈGLES CRITIQUES :
- Ne modifie PAS la structure JSON.
- Échappe correctement les caractères dans les chaînes JSON.
- Le contenu 'refinedContent' doit être prêt à l'emploi.
- Si le contenu est déjà parfait, renvoie-le tel quel dans 'refinedContent' et indique "Aucune modification nécessaire" dans 'changesReport'.
`

      // 2. Construct the User Prompt with inputs
      let userPromptText = `Voici le CONTENU ACTUEL de la leçon à réviser :\n\n${currentContent}\n\n`

      if (guidelines) {
        userPromptText += `Voici les TEXTES des Orientations Pédagogiques à respecter :\n${guidelines}\n\n`
      }

      if (userInstructions) {
        userPromptText += `INSTRUCTIONS SUPPLÉMENTAIRES de l'enseignant :\n${userInstructions}\n\n`
      }

      if (guidelinesImages && guidelinesImages.length > 0) {
        userPromptText += `J'ai également joint ${guidelinesImages.length} images des documents officiels des Orientations Pédagogiques. Analyse-les en détail pour extraire les contraintes spécifiques.`
      }

      userPromptText += `\n\nAnalysé le contenu, applique les corrections nécessaires selon les directives (texte et images), et génère le JSON de réponse.`

      // 3. Prepare the Parts for Gemini (Multimodal)
      const parts: any[] = [
        { text: systemPrompt },
        { text: userPromptText }
      ]

      // Add images if present
      if (guidelinesImages && guidelinesImages.length > 0) {
        guidelinesImages.forEach(base64Image => {
          // Extract purely the base64 part if it has a prefix like "data:image/png;base64,"
          const base64Data = base64Image.split(',')[1] || base64Image;

          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg" // Assuming JPEG/PNG, Gemini is flexible usually, but we can detect if needed. For now default to typical upload.
            }
          })
        })
      }

      // 4. Call Gemini API
      console.log(`🤖 Sending request to Gemini (Attempt ${retryCount + 1})...`)

      const client = retryCount > 0 ? getRotatedAdminClient(retryCount) : googleGenAIAdmin;
      const model = client.getGenerativeModel({ model: "gemini-2.5-flash" }); // Use 2.5 Flash for vision/long context speed/cost efficiency

      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      console.log("✅ AI response received, length:", text.length)

      // 5. Parse JSON
      let cleanText = text.trim()
      // Remove markdown code blocks
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "")
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "")
      }

      // Fix common latex escapes before parsing
      cleanText = fixLatexJsonEscapes(cleanText)

      try {
        const parsedData = JSON.parse(cleanText) as { refinedContent: string, changesReport: string[] }

        // Basic validation
        if (!parsedData.refinedContent || !Array.isArray(parsedData.changesReport)) {
          throw new Error("Invalid JSON structure returned by AI")
        }

        return {
          success: true,
          data: parsedData
        }

      } catch (parseError: any) {
        console.error("❌ JSON Parse Error:", parseError.message)
        // Attempt aggressive cleanup if simple parse fails
        try {
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const fixedJsonOne = fixLatexJsonEscapes(jsonMatch[0])
            const parsedData = JSON.parse(fixedJsonOne)
            return { success: true, data: parsedData }
          }
        } catch (e) {
          // Failed
        }
        throw new Error("Impossible de lire la réponse de l'IA. Format JSON invalide.")
      }

    } catch (error: any) {
      console.error(`❌ Error in reviewLessonContent (Attempt ${retryCount + 1}):`, error.message)
      lastError = error;

      // Retry logic for quota/overload
      const isRetriableError = error.status === 429 || error.status === 503 ||
        error.message?.includes("429") ||
        error.message?.includes("503") ||
        error.message?.includes("Quota exceeded");

      if (isRetriableError) {
        console.log(`⚠️ Quota/Service error. Rotating key...`)
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
        continue;
      }

      break;
    }
  }

  return {
    success: false,
    error: parseGoogleAIError(lastError || new Error("Unknown error during review"))
  }
}

// ------ SERIES REVIEW ------

interface ReviewSeriesParams {
  exercises: any[]
  lessonId?: string
  guidelines?: string
  userInstructions?: string
}

interface ReviewSeriesResult {
  success: boolean
  data?: {
    refinedExercises: any[]
    changesReport: string[]
  }
  error?: string
}

export async function reviewSeriesContent(params: ReviewSeriesParams): Promise<ReviewSeriesResult> {
  const { exercises, lessonId, guidelines, userInstructions } = params

  if (!lessonId) {
    return { success: false, error: "L'ID de la leçon est requis pour le contexte." }
  }

  console.log(`🔍 Starting AI Series Review for lesson: ${lessonId}`)

  // Fetch lesson content context
  let lessonContext = "Aucun contenu de leçon disponible.";
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { titleFr: true, contentFr: true }
    })
    if (lesson) {
      lessonContext = `TITRE DE LA LEÇON : ${lesson.titleFr}\n\nCONTENU :\n${lesson.contentFr || ""}`
    }
  } catch (error) {
    console.warn("Could not fetch lesson context", error)
  }

  // Initialize loop variables
  let retryCount = 0;
  const maxRetries = getAdminKeyCount() + 1;
  let lastError: any = null;

  while (retryCount < maxRetries) {
    try {
      const systemPrompt = `Tu es un Expert Pédagogique en Mathématiques (Système Marocain).
Ta mission est de VÉRIFIER et CORRIGER une série d'exercices associée à une leçon spécifique.

OBJECTIFS DE LA RÉVISION :
1. COHÉRENCE : Vérifier que les exercices correspondent bien au contenu de la leçon fournie (pas de hors sujet).
2. EXACTITUDE : Vérifier la justesse mathématique des PRIX (Énoncés) et des SOLUTIONS.
3. PROGRESSION : Vérifier que les indices (hints) sont pertinents.
4. FORMAT : Corriger le LaTeX ($...$ inline, $$...$$ block) et l'orthographe.

CONTEXTE (Leçon de référence) :
---
${lessonContext.substring(0, 50000)} ... (Extrait)
---

INSTRUCTIONS DE SORTIE :
Renvoie un JSON UNIQUE :
{
  "refinedExercises": [ ... même structure que les exercices d'entrée, mais corrigés ... ],
  "changesReport": [ "Description correction 1", "Description correction 2" ]
}

RÈGLES CRITIQUES :
- Ne change PAS les IDs des exercices si présents.
- Si un exercice est totalement hors-sujet par rapport à la leçon, signale-le et propose une version adaptée ou indique le problème dans la solution.
- Vérifie scrupuleusement les calculs dans les solutions.
`

      const exercisesJson = JSON.stringify(exercises, null, 2);
      let userPromptText = `Voici les EXERCICES à réviser (Format JSON) :\n${exercisesJson}\n\n`

      if (guidelines) {
        userPromptText += `DIRECTIVES PÉDAGOGIQUES À RESPECTER :\n${guidelines}\n\n`
      }

      if (userInstructions) {
        userPromptText += `INSTRUCTIONS SUPPLÉMENTAIRES :\n${userInstructions}\n\n`
      }

      userPromptText += `Analyse chaque exercice, corrige les erreurs, vérifie l'alignement avec la leçon, et renvoie le JSON corrigé.`

      console.log(`🤖 Sending Series Request to Gemini (Attempt ${retryCount + 1})...`)

      const client = retryCount > 0 ? getRotatedAdminClient(retryCount) : googleGenAIAdmin;
      // Using 2.5 Flash for large context window (Lesson + Exercises)
      const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent([systemPrompt, userPromptText]);
      const response = await result.response;
      const text = response.text();

      console.log("✅ AI response received, length:", text.length)

      // Extraction Logic (Reuse robust logic)
      let cleanText = text.trim()
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "")
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "")
      }
      cleanText = fixLatexJsonEscapes(cleanText)

      const parsedData = JSON.parse(cleanText)

      if (!parsedData.refinedExercises || !Array.isArray(parsedData.refinedExercises)) {
        throw new Error("Invalid output structure: missing refinedExercises array");
      }

      return {
        success: true,
        data: {
          refinedExercises: parsedData.refinedExercises,
          changesReport: parsedData.changesReport || ["Correction générale effectuée."]
        }
      }

    } catch (error: any) {
      console.error(`❌ Error in reviewSeriesContent (Attempt ${retryCount + 1}):`, error.message)
      lastError = error;

      // Retry logic ...
      const isRetriableError = error.status === 429 || error.status === 503 || error.message?.includes("Quota");
      if (isRetriableError) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
        continue;
      }
      break;
    }
  }

  return {
    success: false,
    error: parseGoogleAIError(lastError || new Error("Unknown error during review"))
  }
}
