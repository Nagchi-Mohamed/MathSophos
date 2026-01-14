"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Import pdf2json for Node.js-compatible PDF parsing (CommonJS module)
const PDFParser = require("pdf2json")

// Validate and load API key
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

// Comprehensive API key validation
if (!apiKey) {
  console.error("❌ CRITICAL: GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables.")
  console.error("Please ensure your .env file contains: GOOGLE_GENERATIVE_AI_API_KEY=your_api_key")
} else {
  console.log("✅ Google Generative AI API Key loaded successfully")
  console.log(`   Key prefix: ${apiKey.substring(0, 10)}...`)
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// Helper function to check if AI is available
function checkAIAvailability(): { available: boolean; error?: string } {
  if (!apiKey) {
    return {
      available: false,
      error: "La clé API Google Generative AI n'est pas configurée. Veuillez contacter l'administrateur."
    }
  }
  if (!genAI) {
    return {
      available: false,
      error: "Le service IA n'a pas pu être initialisé. Veuillez réessayer plus tard."
    }
  }
  return { available: true }
}

interface SolveMathProblemResult {
  solution?: string
  error?: string
}

/**
 * Solve a math problem from text input
 */
export async function solveMathProblemFromText(
  problemText: string,
  context?: { pageType: string; entityTitle?: string }
): Promise<SolveMathProblemResult> {
  console.log("📝 Solving math problem from text...")

  if (!problemText || problemText.trim().length === 0) {
    console.warn("⚠️ Empty problem text provided")
    return { error: "Veuillez entrer un problème mathématique." }
  }

  // Check AI availability
  const aiCheck = checkAIAvailability()
  if (!aiCheck.available) {
    console.error("❌ AI not available:", aiCheck.error)
    return { error: aiCheck.error }
  }

  const contextPrompt = context
    ? `CONTEXTE ACTUEL KNOWLEDGE: L'élève consulte la page "${context.pageType}" intitulée "${context.entityTitle || 'Inconnu'}". Utilise ce contexte pour adapter ta réponse si pertinent (ex: utiliser des notions liées au chapitre).`
    : "";

  const prompt = `Tu es MathSophos AI, un assistant mathématique pour les élèves marocains.
${contextPrompt}

Problème à résoudre :
${problemText}

Instructions :

1. **Introduction** : Une phrase présentant l'équation en texte simple
2. **Étapes numérotées** : Format "1. **Titre** :"
3. **Équations** : 
   - Utilise une liste à puces (-) pour chaque ligne de calcul
   - Pour les FRACTIONS uniquement, utilise $\\frac{numérateur}{dénominateur}$
   - IMPORTANT: Entoure TOUTES les formules mathématiques avec des dollars ($...$) pour le rendu LaTeX.
   - Utilise "×" pour la multiplication
4. **Vérification** : Vérifie en substituant la valeur
5. **Solution finale** : "**Solution** : x = 4"

RÈGLES DE FORMATAGE :
- ESPACEMENT : Assure-toi qu'il y a TOUJOURS des espaces entre les mots.
- LISTES : Utilise UNIQUEMENT des listes à puces markdown (-), JAMAIS \\begin{itemize}.
- LaTeX : Entoure TOUTES les formules avec $.

Style : Concis, texte simple avec fractions LaTeX.

Exemple exact à suivre :

Pour résoudre l'équation 2x + 5 = 13, nous allons isoler x étape par étape.

1. **Soustraire 5 des deux côtés** :
- 2x + 5 - 5 = 13 - 5
- 2x = 8

2. **Diviser les deux côtés par 2** :
- $\\frac{2x}{2}$ = $\\frac{8}{2}$
- x = 4

**Vérification** :
2 × 4 + 5 = 8 + 5 = 13 ✅

**Solution** : x = 4`

  try {
    console.log("🤖 Calling Gemini API...")
    const model = genAI!.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("✅ Solution generated successfully")
    console.log(`   Response length: ${text.length} characters`)

    return { solution: text }
  } catch (error: any) {
    console.error("❌ Error solving problem:", error)
    console.error("   Error details:", {
      message: error.message,
      code: error.code,
      status: error.status
    })

    // Provide user-friendly error messages based on error type
    if (error.message?.includes("API_KEY_INVALID")) {
      return { error: "La clé API est invalide. Veuillez contacter l'administrateur." }
    } else if (error.message?.includes("RATE_LIMIT")) {
      return { error: "Trop de requêtes. Veuillez réessayer dans quelques instants." }
    } else if (error.message?.includes("SAFETY")) {
      return { error: "Le contenu a été bloqué par les filtres de sécurité. Veuillez reformuler votre problème." }
    }

    return { error: `Erreur technique: ${error.message || "Une erreur inattendue s'est produite"}` }
  }
}

/**
 * Solve a math problem from an image file
 */
export async function solveMathProblemFromImage(
  imageBase64: string,
  mimeType: string
): Promise<SolveMathProblemResult> {
  console.log("📸 Solving math problem from image...")
  console.log(`   MIME type: ${mimeType}`)

  if (!imageBase64) {
    console.warn("⚠️ No image provided")
    return { error: "Aucune image fournie." }
  }

  // Validate mime type
  const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
  if (!validImageTypes.includes(mimeType)) {
    console.warn(`⚠️ Invalid image type: ${mimeType}`)
    return { error: "Format d'image non supporté. Utilisez JPG, PNG ou WebP." }
  }

  // Check AI availability
  const aiCheck = checkAIAvailability()
  if (!aiCheck.available) {
    console.error("❌ AI not available:", aiCheck.error)
    return { error: aiCheck.error }
  }

  const textPrompt = `Tu es MathSophos AI, un assistant mathématique pour les élèves marocains.

Analyse l'image et résous le problème.

Format :
1. Introduction en texte simple
2. Étapes numérotées
3. Utilise des puces (-) pour chaque ligne de calcul
4. Pour fractions : utilise $\\frac{a}{b}$ (barre horizontale)
5. IMPORTANT: Entoure TOUTES les formules mathématiques avec des dollars ($...$) pour le rendu LaTeX.
6. Vérification
7. Solution finale

Utilise "×" pour multiplication.`

  try {
    console.log("🤖 Calling Gemini Vision API...")
    const model = genAI!.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Convert base64 to proper format for Gemini
    const imagePart = {
      inlineData: {
        data: imageBase64.split(',')[1] || imageBase64,
        mimeType: mimeType
      }
    }

    const result = await model.generateContent([textPrompt, imagePart])
    const response = await result.response
    const text = response.text()

    console.log("✅ Image analyzed successfully")
    console.log(`   Response length: ${text.length} characters`)

    return { solution: text }
  } catch (error: any) {
    console.error("❌ Error analyzing image:", error)
    console.error("   Error details:", {
      message: error.message,
      code: error.code,
      status: error.status
    })

    // Provide user-friendly error messages
    if (error.message?.includes("API_KEY_INVALID")) {
      return { error: "La clé API est invalide. Veuillez contacter l'administrateur." }
    } else if (error.message?.includes("RATE_LIMIT")) {
      return { error: "Trop de requêtes. Veuillez réessayer dans quelques instants." }
    } else if (error.message?.includes("SAFETY")) {
      return { error: "L'image a été bloquée par les filtres de sécurité." }
    }

    return { error: "Impossible d'analyser l'image. Veuillez réessayer avec une image plus claire." }
  }
}

/**
 * Solve a math problem from a PDF file
 */
export async function solveMathProblemFromPDF(
  pdfBuffer: Buffer
): Promise<SolveMathProblemResult> {
  return new Promise((resolve) => {
    try {
      const pdfParser = new PDFParser()

      // Set up error handler
      pdfParser.on("pdfParser_dataError", (errData: { parserError: Error }) => {
        console.error("Erreur lors de l'analyse du PDF:", errData.parserError)
        resolve({ error: "Impossible de lire le PDF. Assurez-vous que le fichier n'est pas corrompu." })
      })

      // Set up success handler
      pdfParser.on("pdfParser_dataReady", async (pdfData: any) => {
        try {
          // Extract text from all pages
          let extractedText = ""

          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            for (const page of pdfData.Pages) {
              if (page.Texts && Array.isArray(page.Texts)) {
                for (const text of page.Texts) {
                  if (text.R && Array.isArray(text.R)) {
                    for (const run of text.R) {
                      if (run.T) {
                        extractedText += decodeURIComponent(run.T) + " "
                      }
                    }
                  }
                }
                extractedText += "\n"
              }
            }
          }

          if (!extractedText || extractedText.trim().length === 0) {
            resolve({ error: "Aucun texte trouvé dans le PDF. Assurez-vous que le PDF contient du texte lisible." })
            return
          }

          // Use the text solver with extracted content
          const prompt = `Tu es MathSophos AI, un assistant mathématique pour les élèves marocains.

Texte du PDF :
${extractedText}

Format :
1. Introduction en texte simple
2. Étapes numérotées
3. Utilise des puces (-) pour chaque ligne de calcul
4. Pour fractions : utilise $\\frac{a}{b}$ (barre horizontale)
5. IMPORTANT: Entoure TOUTES les formules mathématiques avec des dollars ($...$) pour le rendu LaTeX.
6. Vérification
7. Solution finale

Utilise "×" pour multiplication.`

          if (!genAI) {
            resolve({ error: "La clé API Google Generative AI n'est pas configurée." })
            return
          }
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
          const result = await model.generateContent(prompt)
          const response = await result.response
          const text = response.text()

          resolve({ solution: text })
        } catch (error) {
          console.error("Erreur lors de la génération de la solution:", error)
          resolve({ error: "Impossible de résoudre le problème. Veuillez réessayer." })
        }
      })

      // Parse the PDF buffer
      pdfParser.parseBuffer(pdfBuffer)
    } catch (error) {
      console.error("Erreur lors de l'analyse du PDF:", error)
      resolve({ error: "Impossible de lire le PDF. Assurez-vous que le fichier n'est pas corrompu." })
    }
  })
}

/**
 * Main function to handle all types of math problem solving
 */
export async function solveMathProblem(
  input: {
    type: "text" | "image" | "pdf"
    content: string // For text: the problem text, For image: base64 string, For PDF: base64 string
    mimeType?: string // Required for images
    context?: {
      pageType: string
      entityTitle?: string
    }
  }
): Promise<SolveMathProblemResult> {
  try {
    switch (input.type) {
      case "text":
        return await solveMathProblemFromText(input.content, input.context)

      case "image":
        if (!input.mimeType) {
          return { error: "Type MIME requis pour les images." }
        }
        return await solveMathProblemFromImage(input.content, input.mimeType)

      case "pdf":
        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(input.content, "base64")
        return await solveMathProblemFromPDF(pdfBuffer)

      default:
        return { error: "Type d'entrée non supporté." }
    }
  } catch (error) {
    console.error("Erreur générale lors de la résolution:", error)
    return { error: "Une erreur inattendue s'est produite. Veuillez réessayer." }
  }
}
