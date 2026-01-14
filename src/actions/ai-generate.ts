"use server"

import { googleGenAIAdmin, parseGoogleAIError, getRotatedAdminClient, getAdminKeyCount } from "@/lib/google-ai"
import { generateText, getModel, LATEX_FORMATTING_SYSTEM_PROMPT, fixLatexJsonEscapes } from "@/lib/ai-utils"
import { prisma } from "@/lib/prisma"
import { ContentValidator } from "@/lib/content-validator"
import { convertLessonJsonToMarkdown } from "@/lib/markdown-converter"
import { latexPreprocessor } from "@/lib/latex-preprocessor"

// ... inside function
// Replace fixCommonAIErrors(content) with content
// Replace normalizeLatex(content) with latexPreprocessor.normalizeDelimiters(content)

import { STRICT_EXAM_EXERCISE_PROMPT, STRICT_MATH_LESSON_PROMPT, AGGRESSIVE_MATH_CONTENT_PROTOCOL } from "@/lib/ai-prompts"

export interface ModelConfig {
  provider: 'google' | 'openai' | 'anthropic'
  modelId: string
}

/**
 * Generate lesson content using AI
 */
export async function generateLessonContent(
  topic: string,
  level: string,
  contextId?: string,
  instructions?: string,
  extractedText?: string,
  modelConfig: ModelConfig = { provider: 'google', modelId: 'gemini-2.5-flash' }
) {
  // Initialize loop variables
  let retryCount = 0;
  const maxRetries = getAdminKeyCount() + 1; // Try all keys once + 1 original
  let lastError: any = null;

  while (retryCount < maxRetries) {
    try {
      // Fetch AI context
      let systemPrompt = STRICT_MATH_LESSON_PROMPT

      if (contextId) {
        const aiContext = await prisma.aiContext.findUnique({
          where: { id: contextId },
        })
        if (aiContext) {
          systemPrompt = aiContext.systemPrompt + "\n\n" + STRICT_MATH_LESSON_PROMPT
        }
      }

      /* Large duplicated prompt block removed to fix parse errors.
         Original content contained an unclosed/duplicated template literal which caused the
         Next/Turbopack dev server to fail when building server chunks. If you need this prompt,
         re-add a single well-formed template literal assignment to `prompt` here.
      */
      if (contextId) {
        const aiContext = await prisma.aiContext.findUnique({
          where: { id: contextId },
        })
        if (aiContext) {
          systemPrompt = aiContext.systemPrompt + "\n\n" + STRICT_MATH_LESSON_PROMPT
        }
      }

      // Build the prompt with strict LaTeX formatting instructions
      const prompt = `${LATEX_FORMATTING_SYSTEM_PROMPT}

${systemPrompt}

Génère une leçon complète sur le sujet: "${topic}"

Spécifications:
- Niveau : ${level} (Système Éducatif Marocain)
${instructions ? `- Instructions supplémentaires : ${instructions}` : ""}
${extractedText ? `- Contenu source à utiliser :
${extractedText.substring(0, 2000)}` : ""
        }

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
              ]
}

⚠️🚨 CRITICAL: FOR NEWLINES IN JSON STRINGS - ABSOLUTELY MANDATORY:
- 🚫 NEVER use \\n, \\\\n, or ANY escaped newline characters
- ✅ ALWAYS use REAL NEWLINES (actual line breaks - press Enter) in JSON strings
- ✅ When you need to go to the next line, you MUST press Enter and create a real newline character
- ✅ JSON strings support real newlines - use them directly!
- Example CORRECT format for proof with multiple equations (notice the REAL newlines):
  "proof": "En utilisant la relation de Chasles $ \\vec{GA} = \\vec{GM} + \\vec{MA} $ et $ \\vec{GB} = \\vec{GM} + \\vec{MB} $: 
  $ \\alpha (\\vec{GM} + \\vec{MA}) + \\beta (\\vec{GM} + \\vec{MB}) = \\vec{0} \\\\ $ 
  $ (\\alpha + \\beta) \\vec{GM} + \\alpha \\vec{MA} + \\beta \\vec{MB} = \\vec{0} \\\\ $ 
  $ (\\alpha + \\beta) \\vec{MG} = \\alpha \\vec{MA} + \\beta \\vec{MB} \\\\ $"
- ❌ WRONG: "proof": "... $ ... $ \\n $ ... $"
- ❌ WRONG: "proof": "... $ ... $ \\\\n $ ... $"
- ✅ CORRECT: "proof": "... $ ... $ 
  $ ... $"
- **REMEMBER**: In JSON, you can have real newlines inside strings. When generating the JSON, press Enter to create a new line. Do NOT write \\n or \\\\n.

Génère maintenant la leçon complète :`

      console.log(`🤖 Generating lesson content with AI (${modelConfig.provider} - ${modelConfig.modelId})...`)

      let text = "";

      if (modelConfig.provider === 'google') {
        // Use direct Google SDK for Google models (matching math-solver.ts)
        console.log(`   Using direct Google Generative AI SDK (Attempt ${retryCount + 1}/${maxRetries})`)

        // Use rotated client if this is a retry or we are checking rotation
        const client = retryCount > 0 ? getRotatedAdminClient(retryCount) : googleGenAIAdmin;

        const model = client.getGenerativeModel({ model: modelConfig.modelId });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
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

      // Parse JSON with multiple strategies
      let parsedData
      try {
        // Strategy 1: Direct parse
        const safeText = fixLatexJsonEscapes(text)
        parsedData = JSON.parse(safeText)
        console.log("✅ Successfully parsed JSON directly")
      } catch (e1) {
        console.log("⚠️ Direct parse failed, trying cleanup...")

        try {
          // Strategy 2: Remove markdown code blocks
          const cleanText = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
          // Improve raw text by fixing LaTeX escape issues that break JSON
          const escapedText = fixLatexJsonEscapes(cleanText)
          // Apply centralized fix for common AI errors (e.g. \beta -> \\beta in JSON strings)
          const fixedText = escapedText
          parsedData = JSON.parse(fixedText)
          console.log("✅ Successfully parsed after removing markdown and fixing AI errors")
        } catch (e2) {
          console.log("⚠️ Markdown cleanup failed, trying regex extraction...")

          // Strategy 3: Extract JSON object
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const escapedMatch = fixLatexJsonEscapes(jsonMatch[0])
            parsedData = JSON.parse(escapedMatch)
            console.log("✅ Successfully parsed extracted JSON")
          } else {
            throw new Error("No valid JSON found in response")
          }
        }
      }

      // Validate and sanitize the parsed JSON as string
      const jsonString = JSON.stringify(parsedData)
      const validation = ContentValidator.validateContent(jsonString)
      if (validation.shouldReject) {
        console.error("❌ Generated content rejected:", validation.errors)
        return { error: "Generated content invalid; retry suggested" }
      }
      if (!validation.isValid) {
        console.log("⚠️ Sanitizing content...")
        const sanitized = ContentValidator.sanitizeContent(jsonString)
        if (sanitized.wasModified) {
          console.log("✅ Content sanitized")
          parsedData = JSON.parse(sanitized.sanitized)
        }
      }

      // Convert to markdown
      const markdown = convertLessonJsonToMarkdown(parsedData)

      // Apply LaTeX normalization
      const normalizedMarkdown = latexPreprocessor.normalizeDelimiters(markdown)

      return { data: normalizedMarkdown }
    } catch (error: any) {
      console.error(`❌ Error generating lesson content (Attempt ${retryCount + 1}):`, error.message)
      lastError = error;

      // Check if we should retry (Quota exceeded or Rate limit)
      // Check if we should retry (Quota exceeded, Rate limit, or Service Unavailable)
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
        // Loop continues
      } else {
        // Not a quota error or not Google, stop retrying
        break;
      }
    }
  }

  // If we exit loop, return error
  return { error: parseGoogleAIError(lastError) }
}

export async function generateExerciseContent(
  topic: string,
  contextId: string,
  modelConfig: ModelConfig = { provider: 'google', modelId: 'gemini-2.5-flash' }
) {
  // Initialize loop variables
  let retryCount = 0;
  const maxRetries = getAdminKeyCount() + 1; // Try all keys once + 1 original
  let lastError: any = null;

  while (retryCount < maxRetries) {
    try {
      let systemPrompt = STRICT_EXAM_EXERCISE_PROMPT

      if (contextId) {
        const aiContext = await prisma.aiContext.findUnique({
          where: { id: contextId },
        })
        if (aiContext) {
          systemPrompt = aiContext.systemPrompt + "\n\n" + STRICT_EXAM_EXERCISE_PROMPT
        }
      }

      const prompt = `${LATEX_FORMATTING_SYSTEM_PROMPT}

${systemPrompt}

Génère un exercice de mathématiques sur le sujet: "${topic}"

Spécifications:
- Contexte : Système Éducatif Marocain
- Niveau : Aligné avec le curriculum officiel

STRUCTURE ATTENDUE (JSON) :
{
  "title": "Titre descriptif de l'exercice",
  "problemText": "Énoncé complet du problème (contexte)",
  "questions": [
    {
      "number": 1,
      "text": "Énoncé de la question",
      "solution": "Solution détaillée étape par étape"
    }
  ],
  "hints": ["Indice 1", "Indice 2"],
  "difficulty": "EASY | MEDIUM | HARD"
}

IMPORTANT:
- Réponds UNIQUEMENT avec du JSON valide
- PAS de markdown autour du JSON
- Contenu en français avec ESPACEMENT CORRECT
- TOUS les symboles mathématiques dans $...$ ou $$...$$
- Tableaux de variations doivent utiliser le format 'array' strict défini plus haut

Génère maintenant l'exercice complet :`

      console.log(`🤖 Generating exercise content with AI (${modelConfig.provider} - ${modelConfig.modelId})...`)

      let text = "";

      if (modelConfig.provider === 'google') {
        // Use direct Google SDK for Google models
        console.log(`   Using direct Google Generative AI SDK (Attempt ${retryCount + 1}/${maxRetries})`)
        const client = retryCount > 0 ? getRotatedAdminClient(retryCount) : googleGenAIAdmin;
        const model = client.getGenerativeModel({ model: modelConfig.modelId });
        const result = await model.generateContent(prompt);
        const output = await result.response;
        text = output.text();
      } else {
        const result = await generateText({
          model: getModel(modelConfig),
          prompt: prompt,
          temperature: 0.7,
          maxRetries: 3,
        })
        text = result.text;
      }

      console.log("✅ AI response received, length:", text.length)

      // Parse JSON with multiple strategies
      let parsedData
      try {
        const safeText = fixLatexJsonEscapes(text)
        parsedData = JSON.parse(safeText)
      } catch (e1) {
        try {
          const cleanText = text.replace(/```json\n ? /gi, "").replace(/```\n?/g, "").trim()
          const escapedText = fixLatexJsonEscapes(cleanText)
          parsedData = JSON.parse(escapedText)
        } catch (e2) {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const escapedMatch = fixLatexJsonEscapes(jsonMatch[0])
            parsedData = JSON.parse(escapedMatch)
          } else {
            // Fallback: return as plain text
            return {
              problemText: text,
              solution: "Solution à compléter manuellement"
            }
          }
        }
      }

      // Validate and sanitize the parsed JSON as string
      const jsonString = JSON.stringify(parsedData)
      const validation = ContentValidator.validateContent(jsonString)
      if (validation.shouldReject) {
        console.error("❌ Generated exercise content rejected:", validation.errors)
        return { error: "Generated exercise content invalid; retry suggested" }
      }
      if (!validation.isValid) {
        console.log("⚠️ Sanitizing exercise content...")
        const sanitized = ContentValidator.sanitizeContent(jsonString)
        if (sanitized.wasModified) {
          console.log("✅ Exercise content sanitized")
          parsedData = JSON.parse(sanitized.sanitized)
        }
      }

      // Apply LaTeX normalization to problem text and all questions/solutions
      const normalizedProblemText = latexPreprocessor.normalizeDelimiters(parsedData.problemText || "")

      // Normalize each question and solution
      const normalizedQuestions = (parsedData.questions || []).map((q: any) => ({
        number: q.number,
        text: latexPreprocessor.normalizeDelimiters(q.text || ""),
        solution: latexPreprocessor.normalizeDelimiters(q.solution || "")
      }))

      return {
        title: parsedData.title || "Exercice d'examen",
        problemText: normalizedProblemText,
        questions: normalizedQuestions,
        hints: parsedData.hints || []
      }
    } catch (error: any) {
      console.error(`❌ Error generating exercise content (Attempt ${retryCount + 1}):`, error.message)
      lastError = error;

      // Check if we should retry (Quota exceeded, Rate limit, or Service Unavailable)
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
      break;
    }
  }
  return { error: parseGoogleAIError(lastError) }
}

/**
 * Generate AI reply for forum posts
 */
export async function generateAIReply(postContent: string, contextId?: string) {
  // Default system prompt if no context provided
  let systemPrompt = "Tu es un professeur de mathématiques bienveillant et pédagogique. Aide l'élève à trouver la solution par lui-même en lui donnant des indices, sans donner la réponse directement."

  if (contextId) {
    const aiContext = await prisma.aiContext.findUnique({
      where: { id: contextId },
    })
    if (aiContext) {
      systemPrompt = aiContext.systemPrompt
    }
  }

  const prompt = `${LATEX_FORMATTING_SYSTEM_PROMPT}

${AGGRESSIVE_MATH_CONTENT_PROTOCOL}

${systemPrompt}

Réponds à l'élève en utilisant les délimiteurs LaTeX corrects ($...$ pour inline, $$...$$ pour bloc).
      `;

  // NOTE: For development, return a placeholder reply to avoid external AI calls while we
  // stabilize the code. Replace this with the real AI invocation when ready.
  return { data: "(AI reply placeholder)" };

}
