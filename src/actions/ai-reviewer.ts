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

// ------ BATCH REVIEW FOR ALL LESSONS & CHAPTERS ------

export interface BatchReviewFilterParams {
  cycle?: string
  level?: string
  stream?: string
  semester?: string
  streamId?: string
  moduleId?: string
  lessonId?: string
  titleQuery?: string
}

export interface BatchItemResult {
  id: string
  title: string
  type: 'lesson' | 'chapter' | 'series'
  success: boolean
  changesCount: number
  error?: string
  keyUsedIndex?: number
}

/**
 * Fetch lessons list for selector dropdown
 */
export async function getLessonsListForSelector(params?: { cycle?: string; level?: string; stream?: string }) {
  try {
    const where: any = {};
    if (params?.level && params.level !== 'ALL') {
      where.level = params.level;
    } else if (params?.cycle && params.cycle !== 'ALL') {
      if (params.cycle === 'COLLEGE') where.level = { in: ['COLLEGE_1AC', 'COLLEGE_2AC', 'COLLEGE_3AC'] };
      if (params.cycle === 'LYCEE') where.level = { in: ['LYCEE_TC', 'LYCEE_1BAC', 'LYCEE_2BAC'] };
      if (params.cycle === 'SUPERIEUR') where.level = 'UNIVERSITY';
    }
    if (params?.stream && params.stream !== 'ALL') where.stream = params.stream;

    const lessons = await prisma.lesson.findMany({
      where,
      select: { id: true, titleFr: true, level: true, stream: true, semester: true },
      orderBy: [{ level: 'asc' }, { semester: 'asc' }, { titleFr: 'asc' }],
      take: 200
    });
    return { success: true, lessons };
  } catch (error: any) {
    return { success: false, lessons: [], error: error.message };
  }
}

/**
 * Batch review all lessons or chapters with multi-key rotation and strict Moroccan curriculum alignment
 */
export async function batchReviewLessons(params: BatchReviewFilterParams): Promise<{
  success: boolean
  totalItems: number
  processed: number
  successful: number
  failed: number
  results: BatchItemResult[]
  error?: string
}> {
  const session = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!session) {
    return { success: false, totalItems: 0, processed: 0, successful: 0, failed: 0, results: [], error: "Non autorisé" };
  }

  console.log("🚀 Starting Batch AI Review for Lessons/Chapters with params:", params);

  const results: BatchItemResult[] = [];
  let successful = 0;
  let failed = 0;

  try {
    const isSuperieur = params.cycle === 'SUPERIEUR' || params.level === 'UNIVERSITY';

    if (isSuperieur) {
      // Review Chapters in Supérieur
      const chapterWhere: any = {};
      if (params.lessonId && params.lessonId !== 'ALL') {
        chapterWhere.lessonId = params.lessonId;
      } else if (params.moduleId || params.streamId) {
        chapterWhere.lesson = {
          ...(params.moduleId ? { moduleId: params.moduleId } : {}),
          ...(params.streamId ? { educationalStreamId: params.streamId } : {})
        };
      }
      if (params.titleQuery) {
        chapterWhere.titleFr = { contains: params.titleQuery, mode: 'insensitive' };
      }

      const chapters = await prisma.chapter.findMany({
        where: chapterWhere,
        include: {
          lesson: {
            include: {
              module: {
                include: { educationalStream: true }
              }
            }
          }
        },
        take: 100
      });

      console.log(`📚 Found ${chapters.length} chapters to review for Supérieur.`);

      for (const chapter of chapters) {
        let retryCount = 0;
        const maxRetries = getAdminKeyCount() + 1;
        let itemSuccess = false;
        let itemError = '';
        let changesCount = 0;

        const gradeLevel = "Université / Supérieur";
        const streamName = chapter.lesson?.module?.educationalStream?.name || "Supérieur";
        const title = `${chapter.lesson?.titleFr || 'Leçon'} — Chapitre ${chapter.chapterNumber}: ${chapter.titleFr}`;

        while (retryCount < maxRetries) {
          try {
            const systemPrompt = `Tu es un Inspecteur Pédagogique et Enseignant-Chercheur Spécialiste du Système Éducatif Marocain (Niveau Université / Supérieur / CPGE).
Ta mission est de RÉVISER ET COMPLÉTER intégralement ce chapitre de cours pour qu'il soit d'une rigueur absolue.

CONGESTION ET STRUCTURE DU CONTENU :
1. Mettre chaque bloc dans son enveloppe Markdown propre :
   - ### Définition X.Y : Titre de la définition
   - ### Théorème X.Y : Titre du théorème
   - ### Proposition X.Y : Titre de la proposition
   - ### Propriété X.Y : Titre de la propriété
   - ### Exemple X.Y : Titre de l'exemple
   - ### Méthode : Titre de la méthode
   - ### Remarque : / ### Attention :

2. TOUT LE CONTENU DOIT RESTER STRICTEMENT À L'INTÉRIEUR DU BLOC :
   - Pour les exemples :
     Exemple 1 : Titre
     Problème : Énoncé du problème mathématique.
     Solution :
     Résolution étape par étape.
   - Pour les théorèmes/propositions :
     Énoncé mathématique rigoureux...
     Démonstration :
     Preuve formelle.

3. RIGUEUR DU NIVEAU SUPÉRIEUR (UNIVERSITÉ / CPGE) :
   - Utilise les symboles mathématiques universitaires avancés : \\forall, \\exists, \\mathbb{R}^n, \\mathbb{C}^n, \\varepsilon-\\delta, matrices, espaces vectoriels, normes ||.||, topologie.

4. COMPLÉTION ET LATEX :
   - Si du texte est incomplet, complète-le entièrement sans laisser de texte tronqué.
   - Corrige toute erreur de syntaxe LaTeX ($...$ inline, $$...$$ block).

FORMAT JSON DE SORTIE EXCLUSIF :
{
  "refinedContent": "Contenu complet révisé en Markdown/LaTeX",
  "changesReport": ["Changement 1", "Changement 2"]
}`;

            const client = getRotatedAdminClient(retryCount);
            const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

            const promptText = `CONTENU DU CHAPITRE (${title}) :\n\n${chapter.contentFr || ""}\n\nRéviser et corriger le contenu.`;
            const response = await model.generateContent([systemPrompt, promptText]);
            const text = response.response.text();

            let cleanText = text.trim();
            if (cleanText.startsWith("```json")) {
              cleanText = cleanText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
            } else if (cleanText.startsWith("```")) {
              cleanText = cleanText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "");
            }
            cleanText = fixLatexJsonEscapes(cleanText);

            const parsed = JSON.parse(cleanText);
            if (parsed.refinedContent) {
              await prisma.chapter.update({
                where: { id: chapter.id },
                data: { contentFr: parsed.refinedContent }
              });
              changesCount = parsed.changesReport?.length || 1;
              itemSuccess = true;
              break;
            }
          } catch (err: any) {
            console.error(`Error processing chapter ${chapter.id} (Attempt ${retryCount + 1}):`, err.message);
            const isQuota = err.status === 429 || err.message?.includes("429") || err.message?.includes("Quota");
            if (isQuota && retryCount < maxRetries - 1) {
              console.log("⚠️ Quota hit. Rotating to next API key...");
              retryCount++;
              await new Promise(r => setTimeout(r, 1500));
              continue;
            }
            itemError = err.message || "Erreur de traitement";
            break;
          }
        }

        if (itemSuccess) {
          successful++;
          results.push({ id: chapter.id, title, type: 'chapter', success: true, changesCount, keyUsedIndex: retryCount });
        } else {
          failed++;
          results.push({ id: chapter.id, title, type: 'chapter', success: false, changesCount: 0, error: itemError });
        }
      }
    } else {
      // Review Lessons in Collège / Lycée / All
      const lessonWhere: any = {};
      if (params.lessonId && params.lessonId !== 'ALL') {
        lessonWhere.id = params.lessonId;
      } else {
        if (params.level && params.level !== 'ALL') {
          lessonWhere.level = params.level;
        } else if (params.cycle && params.cycle !== 'ALL') {
          if (params.cycle === 'COLLEGE') {
            lessonWhere.level = { in: ['COLLEGE_1AC', 'COLLEGE_2AC', 'COLLEGE_3AC'] };
          } else if (params.cycle === 'LYCEE') {
            lessonWhere.level = { in: ['LYCEE_TC', 'LYCEE_1BAC', 'LYCEE_2BAC'] };
          }
        }
        if (params.stream && params.stream !== 'ALL') {
          lessonWhere.stream = params.stream;
        }
        if (params.semester && params.semester !== 'ALL') {
          lessonWhere.semester = Number(params.semester);
        }
        if (params.titleQuery) {
          lessonWhere.titleFr = { contains: params.titleQuery, mode: 'insensitive' };
        }
      }

      const lessons = await prisma.lesson.findMany({
        where: lessonWhere,
        take: 100
      });

      console.log(`📚 Found ${lessons.length} lessons to review.`);

      for (const lesson of lessons) {
        let retryCount = 0;
        const maxRetries = getAdminKeyCount() + 1;
        let itemSuccess = false;
        let itemError = '';
        let changesCount = 0;

        const title = lesson.titleFr;
        const gradeLevel = lesson.level;

        while (retryCount < maxRetries) {
          try {
            const systemPrompt = `Tu es un Inspecteur Pédagogique Expert du Ministère de l'Éducation Nationale du Maroc.
Ta mission est de RÉVISER ET COMPLÉTER cette leçon pour qu'elle soit PARFAITEMENT CONFORME aux Orientations Pédagogiques Officielles du Système Marocain.

CONSTRUCTS DE BLOCS ET TITRES EXPLICITES :
1. Chaque section de cours doit être dans son bloc Markdown approprié :
   - ### Définition X.Y : Titre de la définition
   - ### Théorème X.Y : Titre du théorème
   - ### Proposition X.Y : Titre de la proposition
   - ### Propriété X.Y : Titre de la propriété
   - ### Exemple X.Y : Titre de l'exemple
   - ### Méthode : Titre de la méthode
   - ### Remarque : / ### Attention :

2. STRUCTURE INTERNE D'UN EXEMPLE (TOUT LE CONTENU À L'INTÉRIEUR DU BLOC EXEMPLE) :
   Exemple 1 : Titre explicite
   Problème : Énoncé du problème.
   Solution :
   Résolution détaillée étape par étape.

3. CONFORMITÉ AUX SYMBOLES DU SYSTÈME MAROCAIN (COLLÈGE / LYCÉE) :
   - Utilise les notations standard marocaines : lim_{x\\to a}, \\mathbb{R}, \\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{D}, \\vec{u}, \\vec{v}, vecteurs, intervalles [a, b], tableaux de variations.

4. COMPLÉTION ET LATEX :
   - Corrige la syntaxe LaTeX ($...$ inline, $$...$$ block).
   - Si du texte est incomplet, complète-le intégralement.

FORMAT JSON DE SORTIE EXCLUSIF :
{
  "refinedContent": "Contenu complet révisé en Markdown/LaTeX",
  "changesReport": ["Changement 1", "Changement 2"]
}`;

            const client = getRotatedAdminClient(retryCount);
            const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

            const promptText = `LEÇON (${title} - Niveau: ${gradeLevel}) :\n\n${lesson.contentFr || ""}\n\nRéviser et corriger le contenu.`;
            const response = await model.generateContent([systemPrompt, promptText]);
            const text = response.response.text();

            let cleanText = text.trim();
            if (cleanText.startsWith("```json")) {
              cleanText = cleanText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
            } else if (cleanText.startsWith("```")) {
              cleanText = cleanText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "");
            }
            cleanText = fixLatexJsonEscapes(cleanText);

            const parsed = JSON.parse(cleanText);
            if (parsed.refinedContent) {
              await prisma.lesson.update({
                where: { id: lesson.id },
                data: { contentFr: parsed.refinedContent }
              });
              changesCount = parsed.changesReport?.length || 1;
              itemSuccess = true;
              break;
            }
          } catch (err: any) {
            console.error(`Error processing lesson ${lesson.id} (Attempt ${retryCount + 1}):`, err.message);
            const isQuota = err.status === 429 || err.message?.includes("429") || err.message?.includes("Quota");
            if (isQuota && retryCount < maxRetries - 1) {
              console.log("⚠️ Quota hit. Rotating to next API key...");
              retryCount++;
              await new Promise(r => setTimeout(r, 1500));
              continue;
            }
            itemError = err.message || "Erreur de traitement";
            break;
          }
        }

        if (itemSuccess) {
          successful++;
          results.push({ id: lesson.id, title, type: 'lesson', success: true, changesCount, keyUsedIndex: retryCount });
        } else {
          failed++;
          results.push({ id: lesson.id, title, type: 'lesson', success: false, changesCount: 0, error: itemError });
        }
      }
    }

    return {
      success: true,
      totalItems: results.length,
      processed: results.length,
      successful,
      failed,
      results
    };
  } catch (error: any) {
    console.error("❌ Batch Review Error:", error);
    return {
      success: false,
      totalItems: 0,
      processed: 0,
      successful,
      failed,
      results,
      error: error.message || "Erreur lors du traitement par lot"
    };
  }
}

/**
 * Batch review all exercise series with multi-key rotation and strict Moroccan curriculum alignment
 */
export async function batchReviewSeries(params: BatchReviewFilterParams): Promise<{
  success: boolean
  totalItems: number
  processed: number
  successful: number
  failed: number
  results: BatchItemResult[]
  error?: string
}> {
  const session = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!session) {
    return { success: false, totalItems: 0, processed: 0, successful: 0, failed: 0, results: [], error: "Non autorisé" };
  }

  console.log("🚀 Starting Batch AI Review for Series with params:", params);

  const results: BatchItemResult[] = [];
  let successful = 0;
  let failed = 0;

  try {
    const seriesWhere: any = {};
    if (params.lessonId && params.lessonId !== 'ALL') {
      seriesWhere.lessonId = params.lessonId;
    } else {
      if (params.level && params.level !== 'ALL') {
        seriesWhere.level = params.level;
      } else if (params.cycle && params.cycle !== 'ALL') {
        if (params.cycle === 'COLLEGE') {
          seriesWhere.level = { in: ['COLLEGE_1AC', 'COLLEGE_2AC', 'COLLEGE_3AC'] };
        } else if (params.cycle === 'LYCEE') {
          seriesWhere.level = { in: ['LYCEE_TC', 'LYCEE_1BAC', 'LYCEE_2BAC'] };
        }
      }
      if (params.stream && params.stream !== 'ALL') {
        seriesWhere.stream = params.stream;
      }
      if (params.semester && params.semester !== 'ALL') {
        seriesWhere.semester = Number(params.semester);
      }
      if (params.titleQuery) {
        seriesWhere.title = { contains: params.titleQuery, mode: 'insensitive' };
      }
    }

    const seriesList = await prisma.series.findMany({
      where: seriesWhere,
      include: {
        exercises: true
      },
      take: 100
    });

    console.log(`✏️ Found ${seriesList.length} series to review.`);

    for (const series of seriesList) {
      if (!series.exercises || series.exercises.length === 0) continue;

      let retryCount = 0;
      const maxRetries = getAdminKeyCount() + 1;
      let itemSuccess = false;
      let itemError = '';

      while (retryCount < maxRetries) {
        try {
          const result = await reviewSeriesContent({
            exercises: series.exercises,
            lessonId: series.lessonId || undefined
          });

          if (result.success && result.data?.refinedExercises) {
            // Update exercises
            for (const ex of result.data.refinedExercises) {
              if (ex.id) {
                await prisma.exercise.update({
                  where: { id: ex.id },
                  data: {
                    statement: ex.statement || ex.problemTextFr || '',
                    solution: ex.solution || ex.solutionFr || '',
                    hints: ex.hints || []
                  }
                });
              }
            }
            itemSuccess = true;
            break;
          } else {
            throw new Error(result.error || "Échec de la révision de la série");
          }
        } catch (err: any) {
          console.error(`Error processing series ${series.id} (Attempt ${retryCount + 1}):`, err.message);
          const isQuota = err.status === 429 || err.message?.includes("429") || err.message?.includes("Quota");
          if (isQuota && retryCount < maxRetries - 1) {
            console.log("⚠️ Quota hit. Rotating to next API key...");
            retryCount++;
            await new Promise(r => setTimeout(r, 1500));
            continue;
          }
          itemError = err.message || "Erreur de traitement";
          break;
        }
      }

      if (itemSuccess) {
        successful++;
        results.push({ id: series.id, title: series.title, type: 'series', success: true, changesCount: series.exercises.length, keyUsedIndex: retryCount });
      } else {
        failed++;
        results.push({ id: series.id, title: series.title, type: 'series', success: false, changesCount: 0, error: itemError });
      }
    }

    return {
      success: true,
      totalItems: results.length,
      processed: results.length,
      successful,
      failed,
      results
    };
  } catch (error: any) {
    console.error("❌ Batch Series Review Error:", error);
    return {
      success: false,
      totalItems: 0,
      processed: 0,
      successful,
      failed,
      results,
      error: error.message || "Erreur lors du traitement des séries"
    };
  }
}

