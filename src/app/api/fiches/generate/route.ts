import { NextResponse } from "next/server"
import { LATEX_FORMATTING_SYSTEM_PROMPT, fixLatexJsonEscapes } from "@/lib/ai-utils"
import { getRotatedAdminClient, googleGenAIAdmin, getAdminKeyCount, parseGoogleAIError } from "@/lib/google-ai"

export const maxDuration = 60

// Strictly Gemini 2.5 models as requested (no 1.5, no deprecated 2.0)
const CANDIDATE_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"]

async function extractTextFromFile(fileData: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    try {
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

function parseFicheJson(rawText: string): any {
  // Strategy 1: Direct parse after fixing LaTeX escapes
  try {
    const safeText = fixLatexJsonEscapes(rawText)
    return JSON.parse(safeText)
  } catch {}

  // Strategy 2: Strip markdown codeblocks
  try {
    const cleanText = rawText.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
    const safeClean = fixLatexJsonEscapes(cleanText)
    return JSON.parse(safeClean)
  } catch {}

  // Strategy 3: Regex extract JSON object
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const safeMatch = fixLatexJsonEscapes(jsonMatch[0])
    return JSON.parse(safeMatch)
  }

  throw new Error("Format JSON non valide reçu de l'IA")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let { prompt, context, fileData, mimeType } = body

    // Extract text from uploaded document (PDF or DOCX)
    if (fileData && mimeType && !mimeType.startsWith('image/')) {
      const extractedText = await extractTextFromFile(fileData, mimeType)
      if (extractedText) {
        const label = mimeType === 'application/pdf' ? 'PDF' : 'DOCX'
        context = (context || "") + `\n\nCONTENU DU FICHIER ${label} UPLOADÉ :\n${extractedText}`
      }
    }

    const fullPrompt = `${LATEX_FORMATTING_SYSTEM_PROMPT}

Tu es un inspecteur et pédagogue expert en mathématiques dans le système éducatif marocain.
Ta mission est de transformer tout document source ou consigne en une "Fiche Pédagogique" (Plan de séquence / Scénario pédagogique) conforme au modèle officiel marocain (4 colonnes de déroulement).

Contexte de la fiche :
${context || "Aucun contexte additionnel"}

Instruction de l'enseignant :
${prompt || "Générer une fiche pédagogique complète conforme au standard marocain."}

IMPORTANT : Tu dois répondre UNIQUEMENT avec un objet JSON valide respectant STRICTEMENT la structure suivante :
{
  "lessonTitle": "Titre du chapitre / leçon (ex: Arithmétique dans $\\mathbb{N}$)",
  "duration": "Durée globale (ex: 7 heures)",
  "capacities": "Capacités attendues sous forme de liste à puces (• Utiliser la parité...)",
  "programContents": "Contenus du programme sous forme de liste à puces (• Les nombres pairs...)",
  "pedagogicalGuidelines": "Recommandations et orientations pédagogiques",
  "prerequisites": "Prérequis nécessaires",
  "extensions": "Extensions et perspectives",
  "didacticTools": "Outils didactiques (Tableau, craie, manuel scolaire Najah...)",
  "content": [
    {
      "title": "Séance 1 --- Titre de la séance",
      "duration": "2 h",
      "demarche": "Démarche & Activités (Activités d'initiation, questions guidées avec LaTeX math)",
      "traceEcrite": "Trace écrite (Définitions, Théorèmes, Propriétés, Exemples avec LaTeX math $...$ et $$...$$)",
      "evaluation": "Évaluation / Applications (Exercices d'application directe)"
    }
  ],
  "bilanSequence": "Bilan global de la séquence",
  "difficultiesObserved": "Difficultés constatées chez les élèves",
  "remediationProposed": "Remédiation proposée",
  "observations": "Observations de l'enseignant"
}

Règles impératives :
1. Rédige en français soigné.
2. Formules mathématiques en LaTeX standard : $ pour inline et $$ pour bloc.
3. Ne mets aucun texte en dehors du JSON.`

    const parts: any[] = [fullPrompt]

    // Attach image if uploaded
    if (fileData && mimeType && mimeType.startsWith('image/')) {
      parts.push({
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      })
    }

    let lastError: any = null
    const keyCount = Math.max(1, getAdminKeyCount())

    // Iterate through Gemini 2.5 models and rotated keys
    for (const modelName of CANDIDATE_MODELS) {
      for (let k = 0; k <= keyCount; k++) {
        try {
          const client = k === 0 ? googleGenAIAdmin : getRotatedAdminClient(k)
          const model = client.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            }
          })

          console.log(`[AI Fiche] Attempting generation with ${modelName} (key index ${k})...`)
          const result = await model.generateContent(parts)
          const response = await result.response
          const text = response.text()

          if (!text) throw new Error("Réponse vide reçue de l'IA")

          const parsedData = parseFicheJson(text)
          console.log(`[AI Fiche] ✅ Generation successful with ${modelName} (key index ${k}), sessions: ${parsedData.content?.length || 0}`)
          return NextResponse.json({ success: true, data: parsedData })
        } catch (err: any) {
          lastError = err
          console.warn(`[AI Fiche] ⚠️ ${modelName} (key ${k}) failed:`, err?.message || err)
        }
      }
    }

    const parsedError = parseGoogleAIError(lastError)
    console.error("[AI Fiche] All 2.5 attempts exhausted:", parsedError)
    return NextResponse.json({ success: false, error: parsedError }, { status: 500 })
  } catch (error: any) {
    console.error("[POST /api/fiches/generate Error]:", error)
    return NextResponse.json({
      success: false,
      error: error?.message || "Erreur lors de la génération de la fiche pédagogique"
    }, { status: 500 })
  }
}
