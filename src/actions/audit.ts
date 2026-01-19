"use server"

import { prisma } from "@/lib/prisma"
import { google } from "@ai-sdk/google"
import { readFile } from "fs/promises"
import path from "path"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { searchReferences } from "@/actions/references"
import { generateText, LATEX_FORMATTING_SYSTEM_PROMPT } from "@/lib/ai-utils"
import { revalidatePath } from "next/cache"
import { ContentValidator } from "@/lib/content-validator"
import { convertLessonJsonToMarkdown } from "@/lib/markdown-converter"

export async function getReviewCandidates(filters: {
  level?: string
  stream?: string
  semester?: number
  ids?: string[]
}) {
  try {
    const whereClause: any = {}

    if (filters.ids && filters.ids.length > 0) {
      whereClause.id = { in: filters.ids }
    } else {
      if (filters.level) whereClause.level = filters.level
      // Handle stream: "NONE" or valid stream or undefined
      if (filters.stream) {
        if (filters.stream !== "NONE") whereClause.stream = filters.stream
      }
      if (filters.semester) whereClause.semester = filters.semester
    }

    const lessons = await prisma.lesson.findMany({
      where: whereClause,
      select: { id: true, titleFr: true, level: true, stream: true, semester: true },
      orderBy: { titleFr: 'asc' }
    })

    return { success: true, count: lessons.length, lessons }
  } catch (error) {
    console.error("Failed to fetch review candidates:", error)
    return { success: false, error: "Failed to fetch candidates" }
  }
}

export async function reviewLessonWithAI(
  lessonId: string,
  referenceIds: string[],
  instructions: string = ""
) {
  try {
    // 1. Fetch Lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })
    if (!lesson) throw new Error("Lesson not found")

    // 2. Fetch References
    // We fetch full text content of selected references
    // If no specific references selected, we might search relevant ones?
    // User requirement: "i can select references ... also i can select like 3eme anne college and the ai review all"
    // So we support explicit IDs.

    // 2. Fetch References & Build Multimodal Content
    let userContent: any[] = [];
    let refTitleList: string[] = [];
    let references: any[] = [];

    const basePromptInstructions = `
RÔLE: Expert Auditeur de Curriculum (Système Éducatif Marocain).

TÂCHE:
Réviser et mettre à jour le contenu de la leçon suivante pour qu'elle soit STRICTEMENT conforme aux Documents de Référence fournis.

INSTRUCTIONS GÉNÉRALES:
- Supprimez tout contenu hors-programme selon les références.
- Ajoutez les définitions ou théorèmes manquants cités dans les références.
- Corrigez la terminologie pour correspondre aux manuels officiels.
- Améliorez le formatage LaTeX.
- Gardez une structure pédagogique claire.

FORMAT DE SORTIE:
Retournez UNIQUEMENT le contenu complet de la leçon mise à jour au format JSON strict (structure compatible avec MathSphere).
Structure JSON attendue:
{
  "title": "${lesson.titleFr}",
  "introduction": "...",
  "definitions": [ { "term": "...", "definition": "...", "example": "..." } ],
  "theorems": [ { "name": "...", "statement": "...", "proof": "..." } ],
  "sections": [ { "title": "...", "content": "..." } ]
}
`;

    // Fetch references if IDs are provided
    if (referenceIds.length > 0) {
      references = await prisma.pedagogicalReference.findMany({
        where: { id: { in: referenceIds } },
        select: { title: true, textContent: true, fileUrl: true, types: true } // Added 'types'
      })
      refTitleList = references.map(r => r.title)
    }

    // 3. Construct Final Prompt
    // userContent initialized above

    userContent.push({ text: `ANALYSE DE LA LEÇON: "${lesson.titleFr}"\n\nCONTENU ACTUEL:\n${lesson.contentFr || "(Vide)"}` });

    if (referenceIds.length > 0) {
      if (!refTitleList) refTitleList = []

      for (const r of references) {
        if (!refTitleList.includes(r.title)) refTitleList.push(r.title)

        // Multimodal check
        const isLowContent = !r.textContent || r.textContent.length < 500;
        const hasFile = !!r.fileUrl && r.fileUrl.endsWith('.pdf');

        if (hasFile && (isLowContent || r.types.includes("EXERCICE") || r.types.includes("MANUEL"))) {
          try {
            const filePath = path.join(process.cwd(), "public", r.fileUrl);
            const buffer = await readFile(filePath);
            const base64Data = buffer.toString("base64");

            userContent.push({ text: `(Document de référence ci-joint: ${r.title})` });
            userContent.push({
              inlineData: {
                data: base64Data,
                mimeType: 'application/pdf'
              }
            });
          } catch (e) {
            console.error(`Failed to load file for ref ${r.title}:`, e);
            userContent.push({ text: `### DOCUMENT: ${r.title}\n${r.textContent || "(Contenu illisible)"}` });
          }
        } else {
          userContent.push({ text: `### DOCUMENT: ${r.title}\n${r.textContent?.substring(0, 25000)}` });
        }
      }
    } else {
      // Search Fallback
      const searchRes = await searchReferences(lesson.titleFr, lesson.level)
      if (searchRes.success && searchRes.data) {
        refTitleList = searchRes.data.map((r: any) => r.title)
        const refsText = searchRes.data.map((r: any) => `### DOCUMENT: ${r.title}\n${r.snippet}`).join("\n\n")
        userContent.push({ text: "DOCUMENTS RECOMMANDÉS:\n" + refsText });
      }
    }

    if (userContent.length === 0 && referenceIds.length > 0) {
      return { success: false, error: "References could not be loaded." }
    }

    // Add the Task and Lesson Content at the end
    // Add the Task and Lesson Content at the end
    const specificInstructions = instructions ? `INSTRUCTIONS SPÉCIFIQUES:\n${instructions}` : "";
    userContent.push({
      text: `${basePromptInstructions}\n\n${specificInstructions}`
    });

    // 4. Call AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: LATEX_FORMATTING_SYSTEM_PROMPT
    });

    let generatedJson = "";
    let retries = 0;
    const maxRetries = 3;

    while (true) {
      try {
        const result = await model.generateContent(userContent);
        generatedJson = result.response.text();
        console.log("AI Generation Successful. Length:", generatedJson.length);
        break;
      } catch (err: any) {
        console.error(`AI Attempt ${retries + 1} failed:`, err.message);

        if (retries >= maxRetries) {
          return { success: false, error: "AI Error (Max Retries): " + err.message };
        }

        if (err.message.includes("429") || err.status === 429 || err.message.includes("Quota exceeded")) {
          let waitTime = 20000 * (retries + 1);

          const match = err.message.match(/retryDelay"?\s*:\s*"?(\d+)/);
          if (match) {
            waitTime = (parseInt(match[1]) + 5) * 1000;
          } else if (err.message.includes("please retry in")) {
            const matchTime = err.message.match(/please retry in ([0-9.]+)s/i);
            if (matchTime) {
              waitTime = (parseFloat(matchTime[1]) + 5) * 1000;
            }
          }

          console.log(`Rate limit hit (Audit). Waiting ${waitTime / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
        } else {
          return { success: false, error: "AI Error: " + err.message };
        }
      }
    }

    // 5. Parse and Save
    let contentToSave = generatedJson

    // Check if JSON valid
    try {
      const parsed = JSON.parse(generatedJson)
      // Convert to markdown if that's what we save? 
      // Existing system saves Markdown string into contentFr? 
      // Need to check if lesson.contentFr holds Markdown or JSON string.
      // Looking at actions/admin.ts: contentFr: data.content (string).
      // Looking at markdown-converter: convertLessonJsonToMarkdown.

      contentToSave = convertLessonJsonToMarkdown(parsed)
    } catch (e) {
      // If not JSON, maybe it returned Markdown directly?
      // Fallback: assume markdown
      contentToSave = generatedJson
    }

    // Update DB
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        contentFr: contentToSave,
        updatedAt: new Date() // force update
      }
    })

    revalidatePath("/admin/lessons")

    return {
      success: true,
      message: `Updated using references: ${refTitleList.join(", ")}`,
      lessonTitle: lesson.titleFr
    }

  } catch (error: any) {
    console.error("Audit failed:", error)
    return { success: false, error: error.message || "Audit failed" }
  }
}
