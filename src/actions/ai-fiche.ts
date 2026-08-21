'use server'

import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { LATEX_FORMATTING_SYSTEM_PROMPT } from "@/lib/ai-utils"
import { getRotatedApiKey, getAdminKeyCount, parseGoogleAIError } from "@/lib/google-ai"
import { PDFParse } from "pdf-parse"
// @ts-ignore
import mammoth from "mammoth"

// Schema for the AI response
const FicheSchema = z.object({
  pedagogicalGuidelines: z.string().describe("Directives pédagogiques basées sur les orientations officielles du Ministère de l'Éducation Nationale du Maroc"),
  prerequisites: z.string().describe("Pré-requis nécessaires pour cette leçon"),
  extensions: z.string().describe("Extensions et activités complémentaires"),
  didacticTools: z.string().describe("Outils didactiques suggérés (calculatrice, GeoGebra, fiches d'exercices)"),
  content: z.array(z.object({
    type: z.string().describe("Type of step: 'Activité', 'Définition', 'Théorème', 'Exemple', 'Remarque', 'Propriété', 'Preuve', 'Exercice'"),
    duration: z.string().optional().describe("Duration estimate, e.g., '15 min'"),
    content: z.string().describe("Content of the step in HTML format with LaTeX math using $ for inline and $$ for block. If a figure is needed, include the GeoGebra commands in a <pre> block labeled 'GeoGebra'."),
    observations: z.string().optional().describe("Notes for the teacher (Orientations pédagogiques et gestion de la classe)")
  })).describe("List of steps for the lesson")
})

export async function generateFicheInternal(prompt: string, context?: string, fileData?: string, mimeType?: string) {
  let retryCount = 0;
  const maxRetries = getAdminKeyCount() + 1;
  let lastError: any = null;

  while (retryCount < maxRetries) {
    try {
      const apiKey = getRotatedApiKey(retryCount);
      if (!apiKey) {
        throw new Error("Clé API Google AI non configurée.");
      }

      const googleProvider = createGoogleGenerativeAI({ apiKey });
      const model = googleProvider('gemini-2.5-flash');

    let finalPrompt = prompt;
    let images: any[] = [];

    // Handle File Content
    if (fileData && mimeType) {
      if (mimeType === 'application/pdf') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const parser = new PDFParse({ data: buffer });
          const data = await parser.getText();
          await parser.destroy();
          context = (context || "") + `\n\nCONTENU DU FICHIER PDF UPLOADÉ :\n${data.text.substring(0, 20000)}`; // Limit text length
        } catch (e) {

          console.error("Error parsing PDF", e);
          throw new Error("Erreur lors de la lecture du PDF");
        }
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const result = await mammoth.extractRawText({ buffer: buffer });
          context = (context || "") + `\n\nCONTENU DU FICHIER DOCX UPLOADÉ :\n${result.value.substring(0, 20000)}`;
        } catch (e) {
          console.error("Error parsing DOCX", e);
          throw new Error("Erreur lors de la lecture du fichier Word");
        }
      } else if (mimeType.startsWith('image/')) {
        // Push image to content
        // generateObject 'messages' prop supports mixed content
      }
    }

    const systemPrompt = `${LATEX_FORMATTING_SYSTEM_PROMPT}
      
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
      - **GEOGEBRA INSTRUCTIONS**: Whenever a geometric figure or graph is relevant, provide the **GeoGebra Classic Input Bar commands** to construct it.
        - Place these commands inside the 'content' field, wrapped in a markdown code block like:
          \`\`\`geogebra
          A = (0,0)
          B = (2,3)
          Polygon(A, B, C)
          \`\`\`
        - Or explicitly list them so the user can copy-paste them into GeoGebra.
      - Keep responses concise but complete.
      `

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...(fileData && mimeType && mimeType.startsWith('image/') ? [{ type: 'image', image: fileData }] : [])
        ] as any
      }
    ];

    const { object } = await generateObject({
      model,
      messages: messages as any, // Cast to any because generic messages type can be tricky with SDK versions
      schema: FicheSchema,
      temperature: 0.7,
    })

      console.log("AI Generation successful, generated", object.content?.length || 0, "steps")
      return object;
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ AI Fiche Generation attempt ${retryCount + 1}/${maxRetries} failed:`, error?.message || error);
      retryCount++;
    }
  }

  const parsedError = parseGoogleAIError(lastError);
  throw new Error(`Échec de la génération de la fiche pédagogique : ${parsedError}`);
}

export async function generateFicheAction(prompt: string, context: string, fileData?: string, mimeType?: string) {
  return await generateFicheInternal(prompt, context, fileData, mimeType)
}
