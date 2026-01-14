'use server'

import { generateObject } from "ai"
import { z } from "zod"
import { LATEX_FORMATTING_SYSTEM_PROMPT, getModel } from "@/lib/ai-utils"

// Schema for the AI response
const FicheSchema = z.object({
  pedagogicalGuidelines: z.string().describe("Directives pédagogiques basées sur les orientations officielles"),
  prerequisites: z.string().describe("Pré-requis nécessaires pour cette leçon"),
  extensions: z.string().describe("Extensions et activités complémentaires"),
  didacticTools: z.string().describe("Outils didactiques suggérés"),
  content: z.array(z.object({
    type: z.string().describe("Type of step: 'Activité', 'Définition', 'Théorème', 'Exemple', 'Remarque', 'Propriété', 'Preuve', 'Exercice'"),
    duration: z.string().optional().describe("Duration estimate, e.g., '15 min'"),
    content: z.string().describe("Content of the step in HTML format with LaTeX math using $ delimiters"),
    observations: z.string().optional().describe("Notes for the teacher")
  })).describe("List of steps for the lesson")
})

export async function generateFicheInternal(prompt: string, context?: string) {
  // Check API key
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key not configured")
  }

  try {
    const model = getModel({ provider: 'google', modelId: 'gemini-2.5-flash' })

    const { object } = await generateObject({
      model,
      system: `${LATEX_FORMATTING_SYSTEM_PROMPT}
      
      You are an expert mathematics pedagogue in the Moroccan educational system.
      Your task is to generate a detailed "Fiche Pédagogique" (Lesson Plan) based on the user's request.
      
      Input Context:
      ${context || "No extra context"}
      
      Output requirements:
      - Strictly follow the structure defined in the schema.
      - Use French language.
      - Ensure mathematical rigor.
      - Format math using LaTeX with $ for inline and $$ for block.
      - Content should be in HTML format with proper tags (p, ul, li, strong, etc.)
      - Keep responses concise but complete.
      `,
      prompt: prompt,
      schema: FicheSchema,
      temperature: 0.7,
    })

    console.log("AI Generation successful, generated", object.content?.length || 0, "steps")
    return object
  } catch (error: any) {
    console.error("AI Generation Error Details:", {
      message: error?.message,
      cause: error?.cause,
      response: error?.response?.data,
      status: error?.response?.status,
    })

    // Return more specific error message
    const errorMessage = error?.message || "Unknown error"
    throw new Error(`Failed to generate fiche content: ${errorMessage}`)
  }
}

export async function generateFicheAction(prompt: string, context: string) {
  return await generateFicheInternal(prompt, context)
}
