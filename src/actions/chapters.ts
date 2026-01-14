"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { LessonStatus } from "@prisma/client"
import { convertLessonJsonToMarkdown } from "@/lib/markdown-converter"
import { latexPreprocessor } from "@/lib/latex-preprocessor"
import { STRICT_MATH_LESSON_PROMPT } from "@/lib/ai-prompts"
import { googleGenAIAdmin, parseGoogleAIError, getRotatedAdminClient, getAdminKeyCount } from "@/lib/google-ai"
import { generateText, getModel, LATEX_FORMATTING_SYSTEM_PROMPT, fixLatexJsonEscapes } from "@/lib/ai-utils"
import { ContentValidator } from "@/lib/content-validator"

export interface ModelConfig {
  provider: 'google' | 'openai' | 'anthropic'
  modelId: string
}

export type CreateChapterParams = {
  title: string
  lessonId: string
  content?: string
  chapterNumber: number
  order?: number
  status?: LessonStatus
  createdById?: string
}

export async function createChapter(params: CreateChapterParams) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    // Get lesson details for context
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        module: {
          include: {
            educationalStream: true,
          },
        },
      },
    })

    if (!lesson) {
      return { success: false, error: "Lesson not found" }
    }

    // Generate a slug from the title
    const slug = params.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

    // Use chapterNumber as order if order is not provided
    // For SUPERIEUR cycle, chapterNumber serves as the order
    let order = params.order
    if (!order) {
      // Use chapterNumber as order by default
      order = params.chapterNumber
    }

    const chapter = await prisma.chapter.create({
      data: {
        titleFr: params.title,
        slug: `${slug}-${Date.now()}`,
        lessonId: params.lessonId,
        contentFr: params.content,
        chapterNumber: params.chapterNumber,
        order,
        status: params.status || LessonStatus.DRAFT,
        createdById: params.createdById,
      },
    })

    console.log("✅ Chapter created successfully:", {
      id: chapter.id,
      title: chapter.titleFr,
      lessonId: chapter.lessonId,
      chapterNumber: chapter.chapterNumber,
    })

    // Revalidate all relevant paths - use layout to clear all cached pages
    revalidatePath("/admin/lessons", "layout")
    revalidatePath(`/admin/lessons/${params.lessonId}/edit`)
    revalidatePath("/lessons", "layout") // Also revalidate public lessons page

    // Force immediate revalidation by also using page-level revalidation
    revalidatePath("/admin/lessons", "page")
    revalidatePath("/lessons", "page")

    return { success: true, data: chapter }
  } catch (error: any) {
    console.error("Error creating chapter:", error)
    return { success: false, error: error.message }
  }
}

export async function getChaptersByLesson(lessonId: string) {
  try {
    console.log(`🔍 Fetching chapters for lesson: ${lessonId}`)
    const chapters = await prisma.chapter.findMany({
      where: { lessonId },
      orderBy: [
        { order: "asc" },
        { chapterNumber: "asc" }
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    console.log(`📚 Found ${chapters.length} chapters for lesson ${lessonId}`)
    if (chapters.length > 0) {
      console.log("Chapters:", chapters.map(c => ({
        id: c.id,
        title: c.titleFr,
        chapterNumber: c.chapterNumber,
        slug: c.slug,
        order: c.order
      })))
    } else {
      console.log(`⚠️ No chapters found for lesson ${lessonId} - checking if lesson exists...`)
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
      console.log(`Lesson exists: ${!!lesson}, lessonId: ${lessonId}`)
    }
    return { success: true, data: chapters }
  } catch (error: any) {
    console.error("❌ Error fetching chapters:", error)
    return { success: false, error: error.message }
  }
}

export async function getChapterById(id: string) {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: {
        id: true,
        titleFr: true,
        titleEn: true,
        slug: true,
        contentFr: true,
        contentEn: true,
        chapterNumber: true,
        lessonId: true,
        order: true,
        status: true,
        createdById: true,
        imagesUsed: true,
        createdAt: true,
        updatedAt: true,
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
                educationalStream: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return { success: true, data: chapter };
  } catch (error: any) {
    console.error("Error fetching chapter:", error)
    return { success: false, error: error.message }
  }
}

export async function getChapterBySlug(slug: string) {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { slug },
      select: {
        id: true,
        titleFr: true,
        titleEn: true,
        slug: true,
        contentFr: true,
        contentEn: true,
        chapterNumber: true,
        lessonId: true,
        order: true,
        status: true,
        createdById: true,
        imagesUsed: true,
        createdAt: true,
        updatedAt: true,
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
                educationalStream: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              },
            },
            educationalStream: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return { success: true, data: chapter };
  } catch (error: any) {
    console.error("Error fetching chapter by slug:", error)
    return { success: false, error: error.message }
  }
}

export type UpdateChapterParams = {
  id: string
  title?: string
  content?: string
  chapterNumber?: number
  order?: number
  status?: LessonStatus
}

export async function updateChapter(params: UpdateChapterParams) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    const updateData: any = {}

    if (params.title !== undefined) {
      updateData.titleFr = params.title
      // Regenerate slug if title changes
      const slug = params.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      updateData.slug = `${slug}-${Date.now()}`
    }

    if (params.content !== undefined) {
      updateData.contentFr = params.content
    }

    if (params.chapterNumber !== undefined) {
      updateData.chapterNumber = params.chapterNumber
    }

    if (params.order !== undefined) {
      updateData.order = params.order
    }

    if (params.status !== undefined) {
      updateData.status = params.status
    }

    const chapter = await prisma.chapter.update({
      where: { id: params.id },
      data: updateData,
    })

    revalidatePath("/admin/lessons")
    revalidatePath("/lessons", "layout")
    if (chapter.slug) {
      revalidatePath(`/chapters/${chapter.slug}`)
    }
    return { success: true, data: chapter }
  } catch (error: any) {
    console.error("Error updating chapter:", error)
    return { success: false, error: error.message }
  }
}

export async function renameChapter(id: string, newTitle: string) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    // Generate a new slug from the title
    const slug = newTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

    const chapter = await prisma.chapter.update({
      where: { id },
      data: {
        titleFr: newTitle,
        slug: `${slug}-${Date.now()}`,
      },
    })

    revalidatePath("/admin/lessons")
    revalidatePath("/lessons", "layout")
    if (chapter.slug) {
      revalidatePath(`/chapters/${chapter.slug}`)
    }
    return { success: true, data: chapter }
  } catch (error: any) {
    console.error("Error renaming chapter:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteChapter(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Seul un administrateur peut supprimer un chapitre" }
  }

  try {
    // Get chapter info before deleting for revalidation
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: { slug: true, lessonId: true },
    })

    await prisma.chapter.delete({
      where: { id },
    })

    revalidatePath("/admin/lessons")
    revalidatePath("/lessons", "layout")
    if (chapter?.slug) {
      revalidatePath(`/chapters/${chapter.slug}`)
    }
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting chapter:", error)
    return { success: false, error: error.message }
  }
}

export type GenerateChapterWithAIParams = {
  lessonId: string
  chapterTitle: string
  chapterNumber: number
  additionalInstructions?: string
  modelConfig?: ModelConfig
  createdById?: string
}

export async function generateChapterWithAI(params: GenerateChapterWithAIParams) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    // Get lesson details for context with all related information
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        module: {
          include: {
            educationalStream: {
              include: {
                // Get level information if available
              }
            },
          },
        },
        educationalStream: true,
      },
    })

    if (!lesson) {
      return { success: false, error: "Lesson not found" }
    }

    // Extract all context information dynamically
    const cycle = "SUPERIEUR" // Chapters are only for university level
    const filiereName = lesson.module?.educationalStream?.name || lesson.educationalStream?.name || "Non spécifiée"
    const moduleName = lesson.module?.name || "Non spécifié"
    const lessonName = lesson.titleFr
    const chapterTitle = params.chapterTitle
    const chapterNumber = params.chapterNumber
    const level = lesson.level || "UNIVERSITY"

    // Build the complete path for context (e.g., Supérieur/MIP/Analyse/Analyse 1/ chapitre 1: Les suites numerique)
    const fullPath = `${cycle} / ${filiereName} / ${moduleName} / ${lessonName} / Chapitre ${chapterNumber}: ${chapterTitle}`

    // Build comprehensive context-aware prompt with full path
    const contextInstructions = `
CONTEXTE PÉDAGOGIQUE COMPLET:

📍 CHEMIN COMPLET DU CHAPITRE:
${fullPath}

📚 INFORMATIONS STRUCTURELLES DÉTAILLÉES:
- Cycle: ${cycle}
- Niveau: ${level}
- Filière: ${filiereName}
- Module: ${moduleName}
- Leçon: ${lessonName}
- Chapitre ${chapterNumber}: ${chapterTitle}

🎯 OBJECTIF PÉDAGOGIQUE:
Ce chapitre fait partie du programme universitaire de la Faculté des Sciences et Techniques.
Le contenu doit être:
- Adapté au niveau universitaire (${level})
- Aligné avec le programme officiel de la filière "${filiereName}"
- Cohérent avec le module "${moduleName}" et la leçon "${lessonName}"
- Structuré de manière progressive et pédagogique
- En français, avec un langage clair et précis
- Un chapitre en Supérieur est équivalent à une leçon au Lycée en termes de profondeur et de structure

📖 CONTENU ATTENDU:
Le chapitre "${chapterTitle}" doit couvrir son sujet de manière complète et approfondie.
Il doit inclure des définitions, théorèmes, formules, exemples et exercices adaptés au niveau universitaire.
Le contenu doit être cohérent avec les chapitres précédents de la leçon "${lessonName}".

`

    // Combine context with user-provided instructions
    const userInstructions = params.additionalInstructions && params.additionalInstructions.trim()
      ? `\n\n📝 INSTRUCTIONS SPÉCIFIQUES DE L'UTILISATEUR:\n${params.additionalInstructions}\n\nIMPORTANT: Ces instructions doivent être suivies précisément tout en respectant le contexte pédagogique défini ci-dessus.`
      : ""

    const fullInstructions = contextInstructions + userInstructions

    const modelConfig: ModelConfig = params.modelConfig || {
      provider: 'google',
      modelId: 'gemini-2.5-flash'
    }

    // Use the same system prompt as lesson generator for consistency
    let systemPrompt = STRICT_MATH_LESSON_PROMPT

    // Build the prompt with the same detailed LaTeX instructions as lesson generator
    const { AGGRESSIVE_MATH_CONTENT_PROTOCOL } = await import("@/lib/ai-prompts")
    const prompt = `${LATEX_FORMATTING_SYSTEM_PROMPT}

${AGGRESSIVE_MATH_CONTENT_PROTOCOL}

${systemPrompt}

Génère une leçon complète sur le sujet: "${chapterTitle} - ${lessonName}"

Spécifications:
- Niveau : ${level} (Système Éducatif Marocain - Niveau Supérieur)
- Filière : ${filiereName}
- Module : ${moduleName}
- Leçon : ${lessonName}
- Chapitre ${chapterNumber} : ${chapterTitle}
${params.additionalInstructions ? `- Instructions supplémentaires : ${params.additionalInstructions}` : ""}

${fullInstructions}

STRUCTURE ATTENDUE(JSON) :
{
  "title": "Titre de la leçon",
    "introduction": "Introduction engageante avec contexte réel",
      "definitions": [
        {
          "term": "Terme mathématique",
          "definition": "Définition claire et précise",
          "example": "Exemple simple"
        }
      ],
        "theorems": [
          {
            "name": "Nom du théorème",
            "statement": "Énoncé du théorème",
            "proof": "Démonstration (si approprié)",
            "application": "Application pratique"
          }
        ],
          "formulas": [
            {
              "formula": "Formule en LaTeX",
              "explanation": "Explication de la formule",
              "variables": "Description des variables"
            }
          ],
            "examples": [
              {
                "title": "Titre de l'exemple",
                "problem": "Énoncé du problème",
                "solution": "Solution détaillée étape par étape",
                "explanation": "Pourquoi cette méthode fonctionne"
              }
            ],
              "exercises": [
                {
                  "question": "Question d'exercice",
                  "answer": "Réponse attendue",
                  "hints": ["Indice 1", "Indice 2"]
                }
              ],
                "summary": "Résumé des points clés",
                  "commonMistakes": ["Erreur courante 1", "Erreur courante 2"]
}

RÈGLES CRITIQUES POUR LaTeX:
1. Utilise UNIQUEMENT $...$ pour les expressions mathématiques inline
2. Utilise UNIQUEMENT $$...$$ pour les expressions mathématiques en bloc
3. N'utilise JAMAIS \\(...\\) ou \\[...\\]
4. N'utilise JAMAIS \\begin{itemize}, \\begin{enumerate}, ou \\item - utilise UNIQUEMENT le markdown standard
5. Pour les commandes LaTeX, utilise DOUBLE backslash: \\\\frac, \\\\ln, \\\\log, \\\\lim, \\\\sum, etc.
6. SYNTAXE SIMPLE OBLIGATOIRE:
   - Fractions : Toujours deux arguments \\frac{numérateur}{dénominateur}
   - Limites : Toujours \\lim_{x \\to a} f(x) (avec underscore)
   - Logarithmes : Toujours \\ln(x) avec parenthèses
   - Pas de structures complexes imbriquées inutilement
7. Exemples corrects:
   - Inline : "La fonction $f(x) = \\ln(x)$ est définie pour $x > 0$"
   - Bloc : "$$\\lim_{x \\to +\\infty} \\frac{1}{x} = 0$$"

RÈGLES CRITIQUES DE FORMATAGE:
1. ESPACEMENT OBLIGATOIRE : Assure-toi qu'il y a TOUJOURS des espaces entre les mots
2. LISTES EN MARKDOWN : Utilise UNIQUEMENT le format markdown pour les listes:
   - Pour les listes à puces : Utilise de VRAIES NEWLINES (appuyer sur Entrée):
     "- Premier élément
     - Deuxième élément"
   - Pour les listes numérotées : Utilise de VRAIES NEWLINES:
     "1. Premier
     2. Deuxième"
   - N'utilise JAMAIS \\begin{itemize} ou \\begin{enumerate}
3. 🚨 SAUTS DE LIGNE : 🚫 NE JAMAIS utiliser \\n ou \\\\n
   ✅ TOUJOURS utiliser de VRAIES NEWLINES (appuyer sur Entrée) pour séparer les paragraphes et les éléments de liste
   ✅ JSON supporte les vraies newlines dans les chaînes - utilise-les directement !
4. PONCTUATION : Assure-toi qu'il y a un espace après chaque ponctuation (. , ; : ! ?)

EXEMPLES DE FORMATAGE CORRECT:
✅ CORRECT : "La fonction logarithme népérien, notée $\\ln$, est la fonction réciproque..."
❌ INCORRECT : "Lafonctionlogarithmenépérien,notée$\\ln$,estlafonctionréciproque..."

✅ CORRECT pour les listes:
"Pour tous réels $x > 0$ et $y > 0$, on a les propriétés suivantes :
- $\\ln(xy) = \\ln(x) + \\ln(y)$
- $\\ln(\\frac{x}{y}) = \\ln(x) - \\ln(y)$
- $\\ln(x^r) = r \\ln(x)$"

❌ INCORRECT : N'utilise PAS "\\begin{itemize}\\item $\\ln(xy)$..."

IMPORTANT:
- Réponds UNIQUEMENT avec du JSON valide
- PAS de markdown (pas de code blocks json)
- PAS d'explications avant ou après
- Contenu en français avec ESPACEMENT CORRECT
- Minimum 3-4 exemples et 5-6 exercices
- Sois généreux sur le contenu
- VÉRIFIE que tous les mots sont séparés par des espaces

Génère maintenant la leçon complète :`

    console.log(`🤖 Generating chapter content with AI (${modelConfig.provider} - ${modelConfig.modelId})...`)

    let text = "";

    if (modelConfig.provider === 'google') {
      // Use direct Google SDK for Google models (matching lesson generator)
      console.log("   Using direct Google Generative AI SDK")

      const totalKeys = getAdminKeyCount();
      const maxRetries = Math.max(3, totalKeys);

      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          console.log(`🤖 Calling Gemini API (Key Index: ${attempt % totalKeys}) for chapter generation...`)
          const genAI = getRotatedAdminClient(attempt);
          const model = genAI.getGenerativeModel({ model: modelConfig.modelId });

          const result = await model.generateContent(prompt);
          const response = await result.response;
          text = response.text();

          // Validate we got a response
          if (!text || text.trim().length === 0) {
            throw new Error("Empty response from AI");
          }

          console.log(`✅ Received response (${text.length} chars)`)
          break; // Success
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
            }
            throw error; // Throw original error for other cases or exhaustion
          }
        }
      }
    } else {
      // Use Vercel AI SDK for other providers
      console.log("   Using Vercel AI SDK")
      const result = await generateText({
        model: getModel(modelConfig),
        prompt: prompt,
        temperature: 0.7,
        maxRetries: 3,
      })
      text = result.text;
    }

    console.log("✅ AI response received, length:", text.length)

    // Validate response is not empty
    if (!text || text.trim().length === 0) {
      throw new Error("AI returned an empty response. Please try again.");
    }

    console.log("📄 Response preview (first 200 chars):", text.substring(0, 200))
    console.log("📄 Response preview (last 200 chars):", text.substring(Math.max(0, text.length - 200)))

    // Parse JSON with multiple strategies (same as lesson generator)
    let parsedData

    // Pre-clean text to remove markdown code blocks globally
    const cleanText = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()

    console.log("🧹 Cleaned text length:", cleanText.length)

    try {
      // Strategy 1: Direct parse of CLEAN text with LaTeX escaping
      const safeText = fixLatexJsonEscapes(cleanText)
      parsedData = JSON.parse(safeText)
      console.log("✅ Successfully parsed cleaned JSON directly")
    } catch (e1) {
      console.log("⚠️ Direct cleaned parse failed, trying cleanup...")
      console.error("Parse error:", (e1 as Error).message)

      try {
        // Strategy 2: Fix common AI errors with LaTeX escaping
        const escapedText = fixLatexJsonEscapes(cleanText)
        parsedData = JSON.parse(escapedText)
        console.log("✅ Successfully parsed after fixing AI errors")
      } catch (e2) {
        console.log("⚠️ Markdown cleanup failed, trying regex extraction...")
        console.error("Parse error:", (e2 as Error).message)

        try {
          // Strategy 3: Extract JSON object and fix escape issues
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const escapedMatch = fixLatexJsonEscapes(jsonMatch[0])
            parsedData = JSON.parse(escapedMatch)
            console.log("✅ Successfully parsed extracted JSON after fixing escapes")
          } else {
            throw new Error("No valid JSON found in response")
          }
        } catch (e3) {
          // Strategy 4: Try JSON5 as last resort on CLEAN text
          console.log("⚠️ Standard JSON parsing failed, trying JSON5...")
          console.error("Parse error:", (e3 as Error).message)

          try {
            const JSON5 = await import('json5')
            const escapedCleanText = fixLatexJsonEscapes(cleanText)
            parsedData = JSON5.default.parse(escapedCleanText)
            console.log("✅ Successfully parsed with JSON5")
          } catch (e4) {
            console.error("❌ All parsing strategies failed")
            console.error("Final error:", (e4 as Error).message)
            console.error("Clean text sample:", cleanText.substring(0, 500))
            throw new Error(`Failed to parse AI response: ${(e4 as Error).message}. The AI may have returned invalid JSON. Please try again.`)
          }
        }
      }
    }

    // Validate and sanitize the parsed JSON as string (same as lesson generator)
    const jsonString = JSON.stringify(parsedData)
    const validation = ContentValidator.validateContent(jsonString)
    if (validation.shouldReject) {
      console.error("❌ Generated content rejected:", validation.errors)
      return {
        success: false,
        error: "Generated content invalid; retry suggested"
      }
    }
    if (!validation.isValid) {
      console.log("⚠️ Sanitizing content...")
      const sanitized = ContentValidator.sanitizeContent(jsonString)
      if (sanitized.wasModified) {
        console.log("✅ Content sanitized")
        parsedData = JSON.parse(sanitized.sanitized)
      }
    }

    // Convert to markdown (same as lesson generator)
    const markdown = convertLessonJsonToMarkdown(parsedData)

    // Apply LaTeX normalization (same as lesson generator)
    const normalizedMarkdown = latexPreprocessor.normalizeDelimiters(markdown)

    // Return the generated content without creating the chapter yet
    // The user will review and save it manually
    // Note: Header is displayed via ChapterHeader component, not in markdown
    return {
      success: true,
      data: {
        contentFr: normalizedMarkdown,
        titleFr: chapterTitle,
        chapterNumber: chapterNumber
      }
    }
  } catch (error: any) {
    console.error("❌ Error generating chapter with AI:", error)
    return {
      success: false,
      error: parseGoogleAIError(error) || error.message || "Une erreur est survenue lors de la génération du chapitre"
    }
  }
}
