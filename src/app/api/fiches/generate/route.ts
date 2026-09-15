import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { LATEX_FORMATTING_SYSTEM_PROMPT } from "@/lib/ai-utils"
import { getRotatedApiKey, getAdminKeyCount, parseGoogleAIError } from "@/lib/google-ai"
import { NextResponse } from "next/server"

// Vercel function timeout
export const maxDuration = 60

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

// Model priority: 2.5 Flash first, fallback to 2.5 Pro, then 2.0 Flash
// Using exact model IDs supported by @ai-sdk/google
const CANDIDATE_MODELS = [
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.0-flash',
]

async function extractTextFromFile(fileData: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    try {
      // Dynamic import to avoid cold-start crash
      const { PDFParse } = await import('pdf-parse')
      const buffer = Buffer.from(fileData, 'base64')
      const parser = new PDFParse({ data: buffer })
      const data = await parser.getText()
      await parser.destroy()
      return (data.text || "").substring(0, 20000)
    } catch (e) {
      console.error("Error parsing PDF", e)
      throw new Error("Erreur lors de la lecture du fichier PDF")
    }
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      // Dynamic import to avoid cold-start crash
      const mammoth = await import('mammoth')
      const buffer = Buffer.from(fileData, 'base64')
      const result = await mammoth.extractRawText({ buffer })
      return (result.value || "").substring(0, 20000)
    } catch (e) {
      console.error("Error parsing DOCX", e)
      throw new Error("Erreur lors de la lecture du fichier Word")
    }
  }

  return ""
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let { prompt, context, fileData, mimeType } = body

    // Extract text from uploaded file if any
    if (fileData && mimeType && !mimeType.startsWith('image/')) {
      const extractedText = await extractTextFromFile(fileData, mimeType)
      if (extractedText) {
        const label = mimeType === 'application/pdf' ? 'PDF' : 'DOCX'
        context = (context || "") + `\n\nCONTENU DU FICHIER ${label} UPLOADÉ :\n${extractedText}`
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
- Ensure mathematical accuracy and clarity.`

    const messages: any[] = [
      { role: 'user', content: prompt || "Générer une fiche pédagogique complète conforme au standard marocain." }
    ]

    // Append image inline if it's an image file
    if (fileData && mimeType && mimeType.startsWith('image/')) {
      messages[0].content = [
        { type: 'text', text: prompt || "Génère une fiche pédagogique à partir de cette image." },
        { type: 'image', image: `data:${mimeType};base64,${fileData}` }
      ]
    }

    let lastError: any = null
    const keyCount = Math.max(1, getAdminKeyCount())

    // Try each model, cycling through rotated keys
    for (const modelName of CANDIDATE_MODELS) {
      for (let k = 0; k < keyCount; k++) {
        try {
          const apiKey = getRotatedApiKey(k)
          if (!apiKey) continue

          const googleProvider = createGoogleGenerativeAI({ apiKey })
          const model = googleProvider(modelName)

          const { object } = await generateObject({
            model,
            system: systemPrompt,
            messages,
            schema: FicheSchema,
            temperature: 0.7,
          })

          console.log(`[AI Fiche] ✅ Generated with model: ${modelName}, key index: ${k}`)
          return NextResponse.json({ success: true, data: object })
        } catch (err: any) {
          lastError = err
          console.warn(`[AI Fiche] ⚠️ Failed with model ${modelName} (key ${k}): ${err?.message || err}`)
        }
      }
    }

    const errMsg = parseGoogleAIError(lastError)
    console.error("[AI Fiche] All models/keys exhausted:", errMsg)
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 })
  } catch (error: any) {
    console.error("[POST /api/fiches/generate]:", error)
    return NextResponse.json({
      success: false,
      error: error?.message || "Erreur lors de la génération de la fiche pédagogique"
    }, { status: 500 })
  }
}
