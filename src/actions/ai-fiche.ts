'use server'

import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { LATEX_FORMATTING_SYSTEM_PROMPT } from "@/lib/ai-utils"
import { getRotatedApiKey, getAdminKeyCount, parseGoogleAIError } from "@/lib/google-ai"
// @ts-ignore
import pdf from "pdf-parse"
// @ts-ignore
import mammoth from "mammoth"

// Schema for the AI response matching Moroccan LaTeX Fiche Pédagogique standard
const FicheSchema = z.object({
  lessonTitle: z.string().describe("Titre du chapitre / leçon (ex: 'Arithmétique dans $\\mathbb{N}$')"),
  duration: z.string().describe("Durée globale (ex: '7 heures')"),
  capacities: z.string().describe("Capacités attendues sous forme de liste à puces (• Utiliser la parité...)"),
  programContents: z.string().describe("Contenus du programme sous forme de liste à puces (• Les nombres pairs...)"),
  pedagogicalGuidelines: z.string().describe("Recommandations et orientations pédagogiques"),
  prerequisites: z.string().describe("Prérequis nécessaires pour cette leçon"),
  extensions: z.string().optional().describe("Extensions et activités complémentaires"),
  didacticTools: z.string().describe("Outils didactiques (Tableau, craie, manuel scolaire Najah, GeoGebra...)"),
  content: z.array(z.object({
    title: z.string().describe("Titre de la séance (ex: 'Séance 1 --- Ensemble $\\mathbb{N}$ et Parité')"),
    duration: z.string().describe("Durée de la séance (ex: '2 h' ou '1 h 30')"),
    demarche: z.string().describe("Démarche & Activités (ex: Activités d'initiation, questions guidées, investigations)"),
    traceEcrite: z.string().describe("Trace écrite (Contenu du cours: Définitions, Théorèmes, Propriétés, Exemples avec LaTeX math $...$ et $$...$$)"),
    evaluation: z.string().describe("Évaluation / Applications (Exercices d'application directe)")
  })).describe("Liste des séances de déroulement du plan de séquence"),
  bilanSequence: z.string().optional().describe("Bilan de la séquence"),
  difficultiesObserved: z.string().optional().describe("Difficultés constatées"),
  remediationProposed: z.string().optional().describe("Remédiation proposée"),
  observations: z.string().optional().describe("Observations de l'enseignant")
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
      const model = googleProvider('gemini-2.0-flash');

      // Handle File Content
      if (fileData && mimeType) {
        if (mimeType === 'application/pdf') {
          try {
            const buffer = Buffer.from(fileData, 'base64');
            const data = await pdf(buffer);
            context = (context || "") + `\n\nCONTENU DU FICHIER PDF UPLOADÉ :\n${(data.text || "").substring(0, 20000)}`;
          } catch (e) {
            console.error("Error parsing PDF", e);
            throw new Error("Erreur lors de la lecture du PDF");
          }
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          try {
            const buffer = Buffer.from(fileData, 'base64');
            const result = await mammoth.extractRawText({ buffer: buffer });
            context = (context || "") + `\n\nCONTENU DU FICHIER DOCX UPLOADÉ :\n${(result.value || "").substring(0, 20000)}`;
          } catch (e) {
            console.error("Error parsing DOCX", e);
            throw new Error("Erreur lors de la lecture du fichier Word");
          }
        }
      }

      const systemPrompt = `${LATEX_FORMATTING_SYSTEM_PROMPT}
        
        You are an expert mathematics pedagogue in the Moroccan educational system.
        Your task is to transform any given document or prompt into a professional, highly structured "Fiche Pédagogique" (Lesson Plan) matching the official Moroccan LaTeX standard.
        
        Input Context:
        ${context || "No extra context"}
        
        Output requirements:
        - Strictly follow the structure defined in the schema.
        - Language: French.
        - Structure the sequence into discrete Sessions ("Séances") with:
          1. Title & Duration
          2. Démarche & Activités
          3. Trace écrite (Contenu du cours with rigorous definitions, theorems, LaTeX formulas using $ for inline and $$ for block math)
          4. Évaluation & Applications
        - Include complete pedagogical framework: Capacités attendues (bulleted list), Contenus du programme (bulleted list), Recommandations, Prérequis, Outils didactiques.
        - Ensure mathematical accuracy and clarity.
        `

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || "Générer une fiche pédagogique complète." },
            ...(fileData && mimeType && mimeType.startsWith('image/') ? [{ type: 'image', image: fileData }] : [])
          ] as any
        }
      ];

      const { object } = await generateObject({
        model,
        messages: messages as any,
        schema: FicheSchema,
        temperature: 0.7,
      })

      console.log("AI Generation successful, generated", object.content?.length || 0, "sessions")
      return object;
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ AI Fiche Generation attempt ${retryCount + 1}/${maxRetries} failed:`, error?.message || error);
      retryCount++;
    }
  }

  const parsedError = parseGoogleAIError(lastError);
  throw new Error(parsedError);
}

export async function generateFicheAction(prompt: string, context: string, fileData?: string, mimeType?: string) {
  try {
    const data = await generateFicheInternal(prompt, context, fileData, mimeType);
    return { success: true, data };
  } catch (error: any) {
    console.error("[generateFicheAction] Error:", error);
    return {
      success: false,
      error: error.message || "Erreur lors de la génération de la fiche pédagogique"
    };
  }
}
