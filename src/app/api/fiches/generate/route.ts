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
Ta mission est de transformer tout document source ou consigne en une "Fiche Pédagogique" (Plan de séquence / Scénario pédagogique) conforme au modèle officiel marocain (déroulement en 4 colonnes : Séance, Démarche & Activités, Trace écrite, Évaluation & Applications).

Contexte de la fiche :
${context || "Aucun contexte additionnel"}

Instruction de l'enseignant :
${prompt || "Générer une fiche pédagogique complète conforme au standard marocain."}

========================================================================
CONSIGNES STRICTES DE FORMATAGE (POUR UN RENDU WEB & PDF PARFAIT) :
========================================================================

1. FORMULES MATHÉMATIQUES (RENDU KATEX OBLIGATOIRE) :
   - CHAQUE expression mathématique, variable, symbole ou ensemble DOIT impérativement être encadrée par des dollars.
   - En ligne (inline) : TOUJOURS entourer avec un simple dollar $ ... $.
     Exemples OBLIGATOIRES :
     * $x \in \mathbb{N}$ (et NON x \in N)
     * $\sqrt{25}$ (et NON \sqrt{25})
     * $\frac{12}{3}$ (et NON \frac{12}{3} sans dollars)
     * $a = 2k$ et $a = 2k + 1$
     * $\mathbb{N} = \{0, 1, 2, 3, \dots\}$ et $\mathbb{N}^* = \{1, 2, 3, \dots\}$
     * $p \le \sqrt{n}$
     * $a \mid b$ (divisibilité)
   - En bloc centré (display) : TOUJOURS entre doubles dollars sur leur propre ligne : $$ ... $$.
   - INTERDICTION ABSOLUE des délimiteurs déséquilibrés comme $$a-b$ ou $a-b$$.

2. INTERDICTION DES MACROS LATEX OBSOLÈTES OU BRUTES DANS LE TEXTE :
   - Ne JAMAIS écrire de commandes LaTeX non mathématiques qui ne s'affichent pas dans le navigateur :
     * Au lieu de \\heading{...}, utilise : <strong>Activité : ...</strong>
     * Au lieu de \\sub{Définition.}, utilise : <strong>Définition :</strong>
     * Au lieu de \\sub{Théorème.}, utilise : <strong>Théorème :</strong>
     * Au lieu de \\sub{Propriété.}, utilise : <strong>Propriété :</strong>
     * Au lieu de \\sub{Remarque.}, utilise : <strong>Remarque :</strong>
     * Au lieu de \\sub{Notation.}, utilise : <strong>Notation :</strong>
     * Au lieu de \\appli{}, utilise : <strong>Application :</strong>
     * Au lieu de \\textbf{mot}, utilise : <strong>mot</strong>
     * Au lieu de \\textit{mot}, utilise : <em>mot</em>
     * Au lieu de \\smallskip, \\medskip, \\bigskip, utilise : <br><br>
     * Au lieu de \\begin{center}...\\end{center}, utilise : <p style="text-align:center">...</p>
     * Au lieu de \\begin{itemize}...\\end{itemize}, utilise des puces propres : <ul><li>...</li></ul> ou • Élément

3. ACCENTS ET TYPOGRAPHIE FRANÇAISE :
   - Écris les vrais caractères accentués en UTF-8 : é, è, à, ê, î, ô, ç, É, À.
   - Ne JAMAIS écrire les vieilles séquences TeX comme \'E, \'e ou accents échappés.

4. TABLEAUX DE VALEURS / OPÉRATIONS :
   - Si tu as besoin d'un tableau (ex: table de parité addition/multiplication), utilise un tableau HTML propre :
     <table border="1" style="border-collapse: collapse; width: 100%; text-align: center; margin: 10px 0;">
       <thead><tr style="background-color: #f1f5f9;"><th>$a$</th><th>$b$</th><th>$a+b$</th><th>$a \\times b$</th></tr></thead>
       <tbody>
         <tr><td>pair</td><td>pair</td><td>pair</td><td>pair</td></tr>
         <tr><td>pair</td><td>impair</td><td>impair</td><td>pair</td></tr>
         <tr><td>impair</td><td>pair</td><td>impair</td><td>pair</td></tr>
         <tr><td>impair</td><td>impair</td><td>pair</td><td>impair</td></tr>
       </tbody>
     </table>
   - OU un tableau KaTeX dans $$ :
     $$ \\begin{array}{|c|c|c|c|} \\hline a & b & a+b & a \\times b \\\\ \\hline \\text{pair} & \\text{pair} & \\text{pair} & \\text{pair} \\\\ \\hline \\end{array} $$

========================================================================
STRUCTURE JSON STRICTEMENT ATTENDUE :
========================================================================
Tu dois répondre UNIQUEMENT avec un objet JSON valide :
{
  "lessonTitle": "Titre du chapitre (ex: Arithmétique dans $\\mathbb{N}$)",
  "duration": "Durée globale (ex: 7 heures)",
  "capacities": "Capacités attendues sous forme de liste à puces (• Utiliser la parité...)",
  "programContents": "Contenus du programme sous forme de liste à puces (• Les nombres pairs...)",
  "pedagogicalGuidelines": "Recommandations et orientations pédagogiques",
  "prerequisites": "Prérequis nécessaires",
  "extensions": "Extensions et perspectives",
  "didacticTools": "Outils didactiques (Tableau, craie, manuel scolaire Najah...)",
  "content": [
    {
      "title": "Séance 1 --- Titre explicite",
      "duration": "2 h",
      "demarche": "Démarche détaillée (Activités avec consignes claires, questions guidées, formules entre $...$)",
      "traceEcrite": "Trace écrite (Définitions rigoureuses, Théorèmes, Propriétés, Démonstrations, Exemples rédigés avec mathématiques $...$)",
      "evaluation": "Évaluation & Applications (Exercices d'application directe avec questions précises)"
    }
  ],
  "bilanSequence": "Bilan global de la séquence",
  "difficultiesObserved": "Difficultés constatées",
  "remediationProposed": "Remédiation proposée",
  "observations": "Observations de l'enseignant"
}

Règles impératives :
1. Rédige en français clair et soigné.
2. Tout symbole mathématique doit être entre $...$ ou $$...$$.
3. Ne mets aucun commentaire ni bloc markdown en dehors du JSON. Réponds UNIQUEMENT avec le JSON pur.`

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
