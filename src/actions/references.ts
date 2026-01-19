"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { unlink, readFile } from "fs/promises"
import path from "path"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { generateText } from "@/lib/ai-utils"

export async function getReferences() {
  try {
    const references = await prisma.pedagogicalReference.findMany({
      orderBy: { createdAt: 'desc' }
    })
    // No mapping needed, frontend will handle arrays
    return { success: true, data: references }
  } catch (error) {
    console.error("Failed to fetch references:", error)
    return { success: false, error: "Failed to fetch references" }
  }
}

export async function getLessonsForSelector() {
  try {
    const lessons = await prisma.lesson.findMany({
      select: { id: true, titleFr: true, level: true, stream: true },
      orderBy: { titleFr: 'asc' }
    })
    return { success: true, data: lessons }
  } catch (error) {
    return { success: false, error: "Failed to fetch lessons" }
  }
}

export async function deleteReference(id: string) {
  try {
    const reference = await prisma.pedagogicalReference.findUnique({
      where: { id }
    })

    if (!reference) {
      return { success: false, error: "Reference not found" }
    }

    if (reference.fileUrl.startsWith("/uploads/references/")) {
      try {
        const filePath = path.join(process.cwd(), "public", reference.fileUrl)
        await unlink(filePath)
      } catch (e) {
        console.warn("Failed to delete local file:", e)
      }
    }

    await prisma.pedagogicalReference.delete({
      where: { id }
    })

    revalidatePath("/admin/references")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete reference:", error)
    return { success: false, error: "Failed to delete reference" }
  }
}

export async function searchReferences(query: string, level: string, stream?: string) {
  try {
    const whereClause: any = {
      textContent: {
        contains: query,
        mode: 'insensitive'
      }
    }

    // Filter by level if provided and valid
    // Note: 'levels' is now an array in DB
    if (level && level !== "UNKNOWN") {
      whereClause.levels = { has: level }
    }

    // We can allow stream filtering if strict
    // if (stream) { whereClause.streams = { has: stream } }

    const references = await prisma.pedagogicalReference.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        types: true,
        textContent: true
      }
    })

    const results = references.map(ref => {
      const text = ref.textContent || ""
      const index = text.toLowerCase().indexOf(query.toLowerCase())
      const start = Math.max(0, index - 500)
      const end = Math.min(text.length, index + 1000)
      const snippet = "..." + text.substring(start, end).replace(/\s+/g, ' ') + "..."

      return {
        id: ref.id,
        title: ref.title,
        types: ref.types,
        snippet
      }
    })

    return { success: true, data: results }
  } catch (error) {
    console.error("Failed to search references:", error)
    return { success: false, error: "Failed to search references" }
  }
}

export async function updateReference(id: string, data: {
  title: string
  types: string[]
  levels: string[]
  streams: string[]
  semesters: number[]
  targetLessonIds: string[]
  targetsAllLessons: boolean
}) {
  try {
    await prisma.pedagogicalReference.update({
      where: { id },
      data: {
        title: data.title,
        types: data.types,
        levels: data.levels as any,
        streams: data.streams as any,
        semesters: data.semesters,
        targetLessonIds: data.targetLessonIds,
        targetsAllLessons: data.targetsAllLessons
      }
    })
    revalidatePath("/admin/references")
    return { success: true }
  } catch (error) {
    console.error("Failed to update reference:", error)
    return { success: false, error: "Failed to update reference" }
  }
}

export async function extractReferenceContent(referenceId: string) {
  try {
    const ref = await prisma.pedagogicalReference.findUnique({ where: { id: referenceId } })
    if (!ref) throw new Error("Reference not found")

    // Load File
    const filePath = path.join(process.cwd(), "public", ref.fileUrl);
    const buffer = await readFile(filePath);
    const base64Data = buffer.toString("base64");

    const prompt = `
    RÔLE: Expert en Ingénierie Pédagogique (Mathématiques).
    
    TÂCHE:
    Analyser ce document PDF complet et en extraire une BASE DE CONNAISSANCE STRUCTURÉE pour l'audit automatique des leçons.
    
    ORGANISATION REQUISE (JSON):
    Organisez le contenu par CHAPITRE ou LEÇON détectée dans le document.
    Pour chaque Leçon:
    - "title": Titre de la leçon
    - "definitions": Liste des définitions (terme, contenu)
    - "theorems": Liste des théorèmes/propriétés (nom, énoncé)
    - "examples": Liste des exemples types (énoncé, solution)
    - "remarks": Remarques pédagogiques ou points d'attention.
    
    FORMAT SORTIE:
    {
      "chapters": [
         {
           "title": "...",
           "definitions": [ {"term": "...", "content": "..."} ],
           "theorems": [ {"name": "...", "statement": "..."} ],
           "examples": [ {"content": "..."} ]
         }
      ]
    }
    
    ATTENTION: Le JSON doit être valide. Ne mettez pas de texte avant ou après.
    `
    // Call AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    let text = "";
    let retries = 0;
    const maxRetries = 3;

    while (true) {
      try {
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf",
            },
          },
        ]);
        text = result.response.text();
        break;
      } catch (error: any) {
        console.error(`AI Attempt ${retries + 1} failed:`, error.message);

        if (retries >= maxRetries) throw error;

        // Check for 429 or Overloaded
        if (error.message.includes("429") || error.status === 429 || error.message.includes("Quota exceeded")) {
          let waitTime = 15000 * (retries + 1); // Default backoff

          // Try to parse retryDelay from error message
          const match = error.message.match(/retryDelay"?\s*:\s*"?(\d+)/);
          if (match) {
            waitTime = (parseInt(match[1]) + 2) * 1000;
          } else if (error.message.includes("please retry in")) {
            const matchTime = error.message.match(/please retry in ([0-9.]+)s/i);
            if (matchTime) {
              waitTime = (parseFloat(matchTime[1]) + 2) * 1000;
            }
          }

          console.log(`Rate limit hit. Waiting ${waitTime / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw error;
        }
      }
    }

    let extractedData = {};
    try {
      const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
      extractedData = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error during extraction", text.substring(0, 100));
      extractedData = { error: "Parse Error", rawText: text }
    }

    await prisma.pedagogicalReference.update({
      where: { id: referenceId },
      data: { extractedData }
    })

    revalidatePath("/admin/references")
    return { success: true }

  } catch (e: any) {
    console.error(e)
    return { success: false, error: e.message }
  }
}
