import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fixLatexJsonEscapes } from "@/lib/ai-utils";
import { getNextAdminClient, getRotatedAdminClient, getAdminKeyCount, parseGoogleAIError } from "@/lib/google-ai";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Candidate models for fallback: gemini-2.0-flash and 1.5-flash have 1,500 free requests/day (vs 20 for 2.5-flash)
const CANDIDATE_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];

// Helper to build SSE message
function sseMessage(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Helper to extract retry delay from 429 error
function getRetryDelayMs(err: any): number {
  if (!err) return 1500;
  const match = err.message?.match(/retry in ([\d.]+)s/i) || err.message?.match(/retryDelay["\s:]+([\d.]+)/i);
  if (match) {
    const sec = parseFloat(match[1]);
    if (!isNaN(sec) && sec > 0) {
      return Math.min(Math.ceil(sec * 1000), 8000); // cap max retry delay to 8s to stay inside request limits
    }
  }
  return 1500;
}

// Process a single lesson with AI and return result
async function processLesson(lesson: any): Promise<{
  success: boolean;
  changesCount: number;
  error?: string;
  keyUsedIndex: number;
}> {
  const maxKeyRetries = getAdminKeyCount();
  const totalAttempts = maxKeyRetries * CANDIDATE_MODELS.length;
  let attempt = 0;
  let lastError: any = null;

  const systemPrompt = `Tu es un Inspecteur Pédagogique Expert du Ministère de l'Éducation Nationale du Maroc.
Ta mission est de RÉVISER ET COMPLÉTER cette leçon pour qu'elle soit PARFAITEMENT CONFORME aux Orientations Pédagogiques Officielles du Système Marocain.

CONSTRUCTS DE BLOCS ET TITRES EXPLICITES :
1. Chaque section de cours doit être dans son bloc Markdown approprié :
   - ### Définition X.Y : Titre de la définition
   - ### Théorème X.Y : Titre du théorème
   - ### Proposition X.Y : Titre de la proposition
   - ### Propriété X.Y : Titre de la propriété
   - ### Exemple X.Y : Titre de l'exemple
   - ### Méthode : Titre de la méthode
   - ### Remarque : / ### Attention :

2. STRUCTURE INTERNE D'UN EXEMPLE (TOUT LE CONTENU À L'INTÉRIEUR DU BLOC EXEMPLE) :
   Exemple 1 : Titre explicite
   Problème : Énoncé du problème.
   Solution :
   Résolution détaillée étape par étape.

3. CONFORMITÉ AUX SYMBOLES DU SYSTÈME MAROCAIN (COLLÈGE / LYCÉE) :
   - Utilise les notations standard marocaines : lim_{x\\to a}, \\mathbb{R}, \\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{D}, \\vec{u}, \\vec{v}, vecteurs, intervalles [a, b], tableaux de variations.

4. COMPLÉTION ET LATEX :
   - Corrige la syntaxe LaTeX ($...$ inline, $$...$$ block).
   - Si du texte est incomplet, complète-le intégralement.

FORMAT JSON DE SORTIE EXCLUSIF :
{
  "refinedContent": "Contenu complet révisé en Markdown/LaTeX",
  "changesReport": ["Changement 1", "Changement 2"]
}`;

  while (attempt < totalAttempts) {
    const keyIndex = attempt % maxKeyRetries;
    const modelIndex = Math.floor(attempt / maxKeyRetries) % CANDIDATE_MODELS.length;
    const modelName = CANDIDATE_MODELS[modelIndex];

    try {
      const client = getRotatedAdminClient(keyIndex);
      const model = client.getGenerativeModel({ model: modelName });

      const promptText = `LEÇON (${lesson.titleFr} - Niveau: ${lesson.level}) :\n\n${lesson.contentFr || ""}\n\nRéviser et corriger le contenu.`;
      const response = await model.generateContent([systemPrompt, promptText]);
      const text = response.response.text();

      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      cleanText = fixLatexJsonEscapes(cleanText);

      const parsed = JSON.parse(cleanText);
      if (parsed.refinedContent) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { contentFr: parsed.refinedContent },
        });
        return {
          success: true,
          changesCount: parsed.changesReport?.length || 1,
          keyUsedIndex: keyIndex,
        };
      }
      throw new Error("refinedContent manquant dans la réponse IA");
    } catch (err: any) {
      lastError = err;
      const isQuota =
        err.status === 429 ||
        err.message?.includes("429") ||
        err.message?.includes("Quota");

      if (isQuota && attempt < totalAttempts - 1) {
        attempt++;
        const waitMs = getRetryDelayMs(err);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      break;
    }
  }

  return {
    success: false,
    changesCount: 0,
    error: parseGoogleAIError(lastError),
    keyUsedIndex: attempt % maxKeyRetries,
  };
}

// Process a single chapter with AI
async function processChapter(chapter: any): Promise<{
  success: boolean;
  changesCount: number;
  error?: string;
  keyUsedIndex: number;
}> {
  const maxKeyRetries = getAdminKeyCount();
  const totalAttempts = maxKeyRetries * CANDIDATE_MODELS.length;
  let attempt = 0;
  let lastError: any = null;

  const systemPrompt = `Tu es un Inspecteur Pédagogique et Enseignant-Chercheur Spécialiste du Système Éducatif Marocain (Niveau Université / Supérieur / CPGE).
Ta mission est de RÉVISER ET COMPLÉTER intégralement ce chapitre de cours pour qu'il soit d'une rigueur absolue.

CONGESTION ET STRUCTURE DU CONTENU :
1. Mettre chaque bloc dans son enveloppe Markdown propre :
   - ### Définition X.Y : Titre de la définition
   - ### Théorème X.Y : Titre du théorème
   - ### Exemple X.Y : Titre de l'exemple
   - ### Méthode : Titre de la méthode
   - ### Remarque : / ### Attention :

2. RIGUEUR DU NIVEAU SUPÉRIEUR :
   - Utilise les symboles mathématiques universitaires : \\forall, \\exists, \\mathbb{R}^n, \\mathbb{C}^n, espaces vectoriels, normes.

3. COMPLÉTION ET LATEX :
   - Corrige toute erreur de syntaxe LaTeX ($...$ inline, $$...$$ block).
   - Si du texte est incomplet, complète-le entièrement.

FORMAT JSON DE SORTIE EXCLUSIF :
{
  "refinedContent": "Contenu complet révisé en Markdown/LaTeX",
  "changesReport": ["Changement 1", "Changement 2"]
}`;

  const title = `${chapter.lesson?.titleFr || "Leçon"} — Ch.${chapter.chapterNumber}: ${chapter.titleFr}`;

  while (attempt < totalAttempts) {
    const keyIndex = attempt % maxKeyRetries;
    const modelIndex = Math.floor(attempt / maxKeyRetries) % CANDIDATE_MODELS.length;
    const modelName = CANDIDATE_MODELS[modelIndex];

    try {
      const client = getRotatedAdminClient(keyIndex);
      const model = client.getGenerativeModel({ model: modelName });

      const promptText = `CONTENU DU CHAPITRE (${title}) :\n\n${chapter.contentFr || ""}\n\nRéviser et corriger le contenu.`;
      const response = await model.generateContent([systemPrompt, promptText]);
      const text = response.response.text();

      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      cleanText = fixLatexJsonEscapes(cleanText);

      const parsed = JSON.parse(cleanText);
      if (parsed.refinedContent) {
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: { contentFr: parsed.refinedContent },
        });
        return {
          success: true,
          changesCount: parsed.changesReport?.length || 1,
          keyUsedIndex: keyIndex,
        };
      }
      throw new Error("refinedContent manquant dans la réponse IA");
    } catch (err: any) {
      lastError = err;
      const isQuota =
        err.status === 429 ||
        err.message?.includes("429") ||
        err.message?.includes("Quota");

      if (isQuota && attempt < totalAttempts - 1) {
        attempt++;
        const waitMs = getRetryDelayMs(err);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      break;
    }
  }

  return {
    success: false,
    changesCount: 0,
    error: parseGoogleAIError(lastError),
    keyUsedIndex: attempt % maxKeyRetries,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const cycle = searchParams.get("cycle") || "ALL";
  const level = searchParams.get("level") || "ALL";
  const stream = searchParams.get("stream") || "ALL";
  const semester = searchParams.get("semester") || "ALL";
  const lessonId = searchParams.get("lessonId") || "ALL";
  const titleQuery = searchParams.get("titleQuery") || "";
  const skipParam = searchParams.get("skip") || ""; // comma-separated already-processed IDs

  const skipIds = skipParam ? skipParam.split(",").filter(Boolean) : [];

  // Check admin auth
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    return new Response(
      sseMessage("error", { message: "Non autorisé" }),
      {
        status: 403,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        try {
          controller.enqueue(encoder.encode(sseMessage(event, data)));
        } catch {
          // client disconnected
        }
      };

      try {
        const isSuperieur = cycle === "SUPERIEUR" || level === "UNIVERSITY";

        if (isSuperieur) {
          // ---- SUPERIEUR: process chapters ----
          const chapterWhere: any = {};
          if (lessonId && lessonId !== "ALL") {
            chapterWhere.lessonId = lessonId;
          } else {
            chapterWhere.lesson = {};
          }
          if (titleQuery) {
            chapterWhere.titleFr = { contains: titleQuery, mode: "insensitive" };
          }

          const chapters = await prisma.chapter.findMany({
            where: chapterWhere,
            include: {
              lesson: {
                include: {
                  module: { include: { educationalStream: true } },
                },
              },
            },
            take: 200,
          });

          const toProcess = chapters.filter((c) => !skipIds.includes(c.id));
          const alreadyDone = chapters.length - toProcess.length;

          send("start", {
            total: chapters.length,
            toProcess: toProcess.length,
            alreadyDone,
          });

          let successful = alreadyDone;
          let failed = 0;
          let index = alreadyDone;

          for (const chapter of toProcess) {
            index++;
            const title = `${chapter.lesson?.titleFr || "Leçon"} — Ch.${chapter.chapterNumber}: ${chapter.titleFr}`;
            const streamName = chapter.lesson?.module?.educationalStream?.name || "Supérieur";

            send("processing", {
              id: chapter.id,
              title,
              type: "chapter",
              level: "Université",
              stream: streamName,
              semester: null,
              index,
              total: chapters.length,
            });

            const result = await processChapter(chapter);

            if (result.success) {
              successful++;
            } else {
              failed++;
            }

            send("progress", {
              id: chapter.id,
              title,
              type: "chapter",
              level: "Université",
              stream: streamName,
              semester: null,
              success: result.success,
              changesCount: result.changesCount,
              error: result.error,
              keyUsedIndex: result.keyUsedIndex,
              index,
              total: chapters.length,
              successful,
              failed,
            });

            // 2s pause between items to stay well below the 15 requests/min free tier rate limit
            await new Promise((r) => setTimeout(r, 2000));
          }

          send("done", {
            total: chapters.length,
            successful,
            failed,
          });
        } else {
          // ---- COLLEGE / LYCEE / ALL: process lessons ----
          const lessonWhere: any = {};

          if (lessonId && lessonId !== "ALL") {
            lessonWhere.id = lessonId;
          } else {
            if (level && level !== "ALL") {
              lessonWhere.level = level;
            } else if (cycle && cycle !== "ALL") {
              if (cycle === "COLLEGE") {
                lessonWhere.level = { in: ["COLLEGE_1AC", "COLLEGE_2AC", "COLLEGE_3AC"] };
              } else if (cycle === "LYCEE") {
                lessonWhere.level = { in: ["LYCEE_TC", "LYCEE_1BAC", "LYCEE_2BAC"] };
              }
            }
            if (stream && stream !== "ALL") {
              lessonWhere.stream = stream;
            }
            if (semester && semester !== "ALL") {
              lessonWhere.semester = Number(semester);
            }
            if (titleQuery) {
              lessonWhere.titleFr = { contains: titleQuery, mode: "insensitive" };
            }
          }

          const lessons = await prisma.lesson.findMany({
            where: lessonWhere,
            orderBy: [{ level: "asc" }, { semester: "asc" }, { titleFr: "asc" }],
            take: 300,
          });

          const toProcess = lessons.filter((l) => !skipIds.includes(l.id));
          const alreadyDone = lessons.length - toProcess.length;

          send("start", {
            total: lessons.length,
            toProcess: toProcess.length,
            alreadyDone,
          });

          let successful = alreadyDone;
          let failed = 0;
          let index = alreadyDone;

          for (const lesson of toProcess) {
            index++;

            // Human-readable level label
            const levelLabel = getLevelLabel(lesson.level);
            const semesterLabel = lesson.semester ? `Semestre ${lesson.semester}` : null;

            send("processing", {
              id: lesson.id,
              title: lesson.titleFr,
              type: "lesson",
              level: levelLabel,
              stream: lesson.stream || null,
              semester: semesterLabel,
              index,
              total: lessons.length,
            });

            const result = await processLesson(lesson);

            if (result.success) {
              successful++;
            } else {
              failed++;
            }

            send("progress", {
              id: lesson.id,
              title: lesson.titleFr,
              type: "lesson",
              level: levelLabel,
              stream: lesson.stream || null,
              semester: semesterLabel,
              success: result.success,
              changesCount: result.changesCount,
              error: result.error,
              keyUsedIndex: result.keyUsedIndex,
              index,
              total: lessons.length,
              successful,
              failed,
            });

            // 2s pause between items to stay well below the 15 requests/min free tier rate limit
            await new Promise((r) => setTimeout(r, 2000));
          }

          send("done", {
            total: lessons.length,
            successful,
            failed,
          });
        }
      } catch (err: any) {
        send("error", { message: err.message || "Erreur inattendue du serveur" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function getLevelLabel(level: string): string {
  const map: Record<string, string> = {
    COLLEGE_1AC: "1AC • Collège",
    COLLEGE_2AC: "2AC • Collège",
    COLLEGE_3AC: "3AC • Collège",
    LYCEE_TC: "Tronc Commun • Lycée",
    LYCEE_1BAC: "1ère Bac • Lycée",
    LYCEE_2BAC: "2ème Bac • Lycée",
    UNIVERSITY: "Université",
  };
  return map[level] || level;
}
