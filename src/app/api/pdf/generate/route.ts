
import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer-core"

export const maxDuration = 60; // Set max execution time to 60s for Vercel
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { generatePdfHtml } from "@/lib/pdf/templates"
import { processMarkdownForPdf } from "@/lib/pdf/markdown"
import { prisma } from "@/lib/prisma"
import { formatLevel } from "@/utils/formatters"

import { getPuppeteerOptions } from "@/lib/puppeteer-config"

// Helper to get browser instance
const getBrowser = async () => {
  const options = await getPuppeteerOptions();
  return puppeteer.launch(options);
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    console.log("[PDF API] Session User:", session?.user?.email, "Role:", session?.user?.role);


    const body = await req.json();
    console.log("[PDF API] Request payload:", { type: body.type, id: body.id, title: body.title });

    // Authorization check
    // 1. Solver/Custom types are allowed for all authenticated users (or even public if needed)
    // 2. Database resources (Exam/Lesson/Series) are restricted to Admin/Editor
    const isPublicType = body.type === 'solver' || body.type === 'custom';

    if (!isPublicType && (!session?.user || !canAccessAdmin(session.user.role))) {
      console.warn("[PDF API] Unauthorized access attempt to restricted resource", session?.user?.email);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, id, content: rawContent, title: paramTitle } = body;

    let htmlContent = "";
    let title = paramTitle || "Document";
    let subtitle = "";
    let meta = body.metadata || {};
    let headerType = type || "lesson";

    if (type === 'custom' || type === 'solver') {
      // Playground Mode & AI Solver
      title = paramTitle || (type === 'solver' ? "Solution MathSophos" : "Custom Document");
      const processedContent = await processMarkdownForPdf(rawContent || "");

      // Default meta for solver if not provided
      if (type === 'solver' && !meta.category) {
        meta = {
          category: "INTELLIGENCE ARTIFICIELLE",
          // Professor name should be consistent with other docs
          professor: process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof: Mohamed Nagchi",
          ...meta
        };
      }

      htmlContent = generatePdfHtml({
        title,
        content: processedContent,
        headerType: headerType as any,
        meta: { ...meta, "Generated": new Date().toLocaleDateString() }
      });
    } else if (type === 'lesson' && id) {
      // Fetch Lesson
      console.log("[PDF API] Fetching lesson with ID:", id);
      const lesson = await prisma.lesson.findUnique({ where: { id } });
      if (!lesson) {
        console.error("[PDF API] Lesson not found:", id);
        throw new Error("Lesson not found");
      }

      title = lesson.titleFr;
      console.log("[PDF API] Processing lesson:", title);

      // Process lesson content
      let contentToProcess = lesson.contentFr || "";
      let isPreNumbered = false;

      console.log("[PDF API] Content length:", contentToProcess.length);

      // Check if content is too large (> 500KB might cause issues)
      const MAX_CONTENT_SIZE = 500000; // 500KB
      if (contentToProcess.length > MAX_CONTENT_SIZE) {
        console.warn("[PDF API] Content exceeds max size, truncating...");
        contentToProcess = contentToProcess.substring(0, MAX_CONTENT_SIZE) + "\n\n...(content truncated for PDF generation)";
      }

      // 1. Normalize LaTeX delimiters FIRST (before JSON parse might scramble them)
      // Actually, if it's JSON, we should parse first, then normalize text values.
      // But commonly content is stored as stringified JSON.

      try {
        console.log("[PDF API] Attempting to parse lesson content as JSON...");
        // Attempt to parse if it's JSON
        let json = JSON.parse(contentToProcess);
        if (typeof json === 'string') json = JSON.parse(json); // Double encoded check

        // Check if it's a structured lesson (App Format)
        if (json && (json.lesson || json.introduction || json.definitions)) {
          console.log("[PDF API] Detected structured lesson format");
          const { convertLessonJsonToMarkdown } = await import("@/lib/markdown-converter");
          contentToProcess = convertLessonJsonToMarkdown(json);
          isPreNumbered = true;
          console.log("[PDF API] Converted structured lesson JSON to Markdown");
        } else {
          console.log("[PDF API] Using recursive text extractor for generic content");
          // Fallback: Use Recursive Extractor for generic editor content
          // Helper to extract text recursively from ANY deep structure
          const extractTextFromNode = (node: any): string => {
            if (!node) return "";
            if (typeof node === 'string') return node;
            if (typeof node === 'number') return String(node);

            if (Array.isArray(node)) {
              // Join array items with double newline
              return node.map(extractTextFromNode).join("\n\n");
            }

            if (typeof node === 'object') {
              // Priority 1: Handle Header Nodes (EditorJS / Tiptap / Custom)
              const isHeader =
                (node.type === 'header' || node.type === 'heading') ||
                (node.level && typeof node.level === 'number');

              if (isHeader) {
                let text = node.text || node.data?.text || node.content; // Content might be string or array

                // If content is array (Tiptap), recurse
                if (typeof text !== 'string' && Array.isArray(text)) {
                  text = text.map((c: any) => extractTextFromNode(c)).join('');
                } else if (typeof text === 'object') {
                  // recursing object?
                  text = extractTextFromNode(text);
                }

                let level = node.level || node.data?.level || node.attrs?.level || 2;

                if (text && typeof text === 'string' && text.trim().length > 0) {
                  const prefix = '#'.repeat(level);
                  return `${prefix} ${text}`;
                }
              }

              // Priority 2: Check for specific content keys
              // If the node has 'text', 'content', 'value', or 'html', prioritize extracting that
              // BUT we must also check for children/blocks arrays as they might contain MORE text

              let extractedText = "";

              // Check direct text properties
              if (node.text && typeof node.text === 'string') extractedText += node.text;
              else if (node.content && typeof node.content === 'string') extractedText += node.content;

              // Check for children/blocks arrays which act as containers
              // We blindly traverse these common container keys
              const containerKeys = ['blocks', 'children', 'content', 'data', 'items'];
              let childrenText = "";

              for (const key of containerKeys) {
                if (Array.isArray(node[key])) {
                  childrenText += node[key].map((child: any) => extractTextFromNode(child)).join("\n\n");
                } else if (typeof node[key] === 'object' && node[key] !== null) {
                  childrenText += extractTextFromNode(node[key]);
                }
              }

              if (childrenText) {
                // If we found children text, append it. 
                // Using \n\n ensures separate blocks don't merge (e.g. Header + Paragraph)
                extractedText = extractedText ? extractedText + "\n\n" + childrenText : childrenText;
              }

              // Fallback: If we extracted nothing so far, try blind recursion on ALL values
              // This catches { "someStrangeField": "Actual Content" }
              if (!extractedText) {
                return Object.values(node)
                  .map(val => extractTextFromNode(val))
                  .join("\n\n");
              }

              return extractedText;
            }
            return "";
          };

          if (typeof json === 'object' && json !== null) {
            contentToProcess = extractTextFromNode(json);
          }
        }

      } catch (e) {
        // Not JSON, treat as Markdown string
        console.log("[PDF API] Content is not JSON, treating as Markdown");
        console.log("[PDF API] Parse error:", e instanceof Error ? e.message : String(e));
      }

      // 2. Apply LaTeX Preprocessor to the final string
      console.log("[PDF API] Applying LaTeX preprocessor...");
      const { latexPreprocessor } = await import("@/lib/latex-preprocessor");
      contentToProcess = latexPreprocessor.normalizeLatex(contentToProcess);

      console.log("[PDF API] Processing markdown for PDF...");
      console.log("[PDF API] Content to process length:", contentToProcess.length);

      const processedBody = await processMarkdownForPdf(contentToProcess);
      console.log("[PDF API] Markdown processed successfully");

      console.log("[PDF API] Generating HTML for lesson...");
      htmlContent = generatePdfHtml({
        title,
        subtitle: `Level: ${lesson.level}`,
        content: processedBody,
        headerType: 'lesson',
        isPreNumbered, // Pass the flag
        meta: {
          "level": formatLevel(lesson.level),
          "stream": lesson.stream !== 'NONE' ? lesson.stream : undefined,
          "semester": lesson.semester.toString(),
          "category": lesson.category || undefined
        } as any
      });
      console.log("[PDF API] HTML generated for lesson");
    } else if (type === 'chapter' && id) {
      // Fetch Chapter
      const chapter = await prisma.chapter.findUnique({
        where: { id },
        include: {
          lesson: {
            include: {
              educationalStream: true,
              module: true
            }
          }
        }
      });
      if (!chapter) throw new Error("Chapter not found");

      title = `${chapter.chapterNumber ? `Chapitre ${chapter.chapterNumber}: ` : ''}${chapter.titleFr}`;
      let contentToProcess = chapter.contentFr || "";
      let isPreNumbered = false;

      // Reuse Content Processing Logic
      try {
        let json = JSON.parse(contentToProcess);
        if (typeof json === 'string') json = JSON.parse(json);

        if (json && (json.lesson || json.introduction || json.definitions)) {
          const { convertLessonJsonToMarkdown } = await import("@/lib/markdown-converter");
          contentToProcess = convertLessonJsonToMarkdown(json);
          isPreNumbered = true;
          console.log("Converted structured chapter JSON to Markdown");
        } else {
          // Fallback: Use Recursive Extractor
          const extractTextFromNode = (node: any): string => {
            if (!node) return "";
            if (typeof node === 'string') return node;
            if (typeof node === 'number') return String(node);
            if (Array.isArray(node)) return node.map(extractTextFromNode).join("\n\n");

            if (typeof node === 'object') {
              const isHeader = (node.type === 'header' || node.type === 'heading') || (node.level && typeof node.level === 'number');
              if (isHeader) {
                let text = node.text || node.data?.text || node.content;
                if (Array.isArray(text)) text = text.map((c: any) => extractTextFromNode(c)).join('');
                else if (typeof text === 'object') text = extractTextFromNode(text);

                let level = node.level || node.data?.level || node.attrs?.level || 2;
                if (text && typeof text === 'string' && text.trim().length > 0) return `${'#'.repeat(level)} ${text}`;
              }

              let extractedText = "";
              if (node.text && typeof node.text === 'string') extractedText += node.text;
              else if (node.content && typeof node.content === 'string') extractedText += node.content;

              const containerKeys = ['blocks', 'children', 'content', 'data', 'items'];
              let childrenText = "";
              for (const key of containerKeys) {
                if (Array.isArray(node[key])) childrenText += node[key].map((child: any) => extractTextFromNode(child)).join("\n\n");
                else if (typeof node[key] === 'object' && node[key] !== null) childrenText += extractTextFromNode(node[key]);
              }

              if (childrenText) extractedText = extractedText ? extractedText + "\n\n" + childrenText : childrenText;

              if (!extractedText) return Object.values(node).map(val => extractTextFromNode(val)).join("\n\n");
              return extractedText;
            }
            return "";
          };

          if (typeof json === 'object' && json !== null) {
            contentToProcess = extractTextFromNode(json);
          }
        }
      } catch (e) {
        console.log("Content is not JSON, treating as Markdown");
      }

      const { latexPreprocessor } = await import("@/lib/latex-preprocessor");
      contentToProcess = latexPreprocessor.normalizeLatex(contentToProcess);

      const processedBody = await processMarkdownForPdf(contentToProcess);

      const lesson = chapter.lesson;

      htmlContent = generatePdfHtml({
        title,
        content: processedBody,
        headerType: 'chapter',
        isPreNumbered,
        meta: {
          "level": lesson?.educationalStream?.name || "N/A",
          "stream": "", // Integrated into level for this view usually
          "semester": lesson?.semester?.toString() || "",
          "category": lesson?.titleFr || "CHAPITRE"
        } as any
      });


    } else if (type === 'series' && id) {
      // Fetch series with deep relations for header data
      const series = await prisma.series.findUnique({
        where: { id },
        include: {
          exercises: {
            orderBy: { order: 'asc' }
          },
          educationalStream: true, // Direct series educationalStream
          lesson: {
            include: {
              module: {
                include: {
                  educationalStream: true
                }
              },
              educationalStream: true
            }
          }
        }
      });
      if (!series) throw new Error("Series not found");

      title = series.title;
      let bodyMarkdown = series.description ? `_Description :_ ${series.description}\n\n---\n\n` : "";

      const { convertExerciseJsonToMarkdown } = await import("@/lib/markdown-converter");

      series.exercises.forEach((ex, idx) => {
        // Helper function to extract text from JSON solution (reuse the same logic as lessons)
        const extractTextFromNode = (node: any): string => {
          if (!node) return "";
          if (typeof node === 'string') return node;
          if (typeof node === 'number') return String(node);
          if (Array.isArray(node)) return node.map(extractTextFromNode).join("\n\n");

          if (typeof node === 'object') {
            const isHeader = (node.type === 'header' || node.type === 'heading') || (node.level && typeof node.level === 'number');
            if (isHeader) {
              let text = node.text || node.data?.text || node.content;
              if (Array.isArray(text)) text = text.map((c: any) => extractTextFromNode(c)).join('');
              else if (typeof text === 'object') text = extractTextFromNode(text);

              let level = node.level || node.data?.level || node.attrs?.level || 2;
              if (text && typeof text === 'string' && text.trim().length > 0) return `${'#'.repeat(level)} ${text}`;
            }

            let extractedText = "";
            if (node.text && typeof node.text === 'string') extractedText += node.text;
            else if (node.content && typeof node.content === 'string') extractedText += node.content;

            const containerKeys = ['blocks', 'children', 'content', 'data', 'items'];
            let childrenText = "";
            for (const key of containerKeys) {
              if (Array.isArray(node[key])) childrenText += node[key].map((child: any) => extractTextFromNode(child)).join("\n\n");
              else if (typeof node[key] === 'object' && node[key] !== null) childrenText += extractTextFromNode(node[key]);
            }

            if (childrenText) extractedText = extractedText ? extractedText + "\n\n" + childrenText : childrenText;
            if (!extractedText) return Object.values(node).map(val => extractTextFromNode(val)).join("\n\n");
            return extractedText;
          }
          return "";
        };

        // Process problem text - try to parse as JSON first
        let problemText = ex.problemTextFr;
        try {
          const problemJson = JSON.parse(ex.problemTextFr);
          // If it's JSON, extract the text
          problemText = extractTextFromNode(problemJson);
        } catch {
          // Not JSON, use as-is
          problemText = ex.problemTextFr;
        }

        // Process solution - try to parse as JSON first
        let solutionText = null;
        if (body.includeCorrection && ex.solutionFr) {
          try {
            const solutionJson = JSON.parse(ex.solutionFr);
            // If it's JSON, extract the text
            solutionText = extractTextFromNode(solutionJson);
            console.log(`[PDF] Exercise ${idx + 1} - Solution extracted (${solutionText?.length || 0} chars)`);
          } catch (e) {
            // Not JSON, use as-is
            solutionText = ex.solutionFr;
            console.log(`[PDF] Exercise ${idx + 1} - Solution is plain text (${solutionText?.length || 0} chars)`);
          }
        } else {
          console.log(`[PDF] Exercise ${idx + 1} - No solution (includeCorrection: ${body.includeCorrection}, has solutionFr: ${!!ex.solutionFr})`);
        }

        // Create an object structure compatible with our converter
        const exerciseData = {
          problemText: problemText,
          hints: body.includeHints ? ex.hints : [],
          solution: solutionText
        };

        bodyMarkdown += `## Exercice ${idx + 1}\n\n`;
        bodyMarkdown += convertExerciseJsonToMarkdown(exerciseData, true); // forPdf = true
        bodyMarkdown += "---\n\n";
      });

      // Apply LaTeX preprocessing
      const { latexPreprocessor } = await import("@/lib/latex-preprocessor");
      bodyMarkdown = latexPreprocessor.normalizeLatex(bodyMarkdown);

      const processedBody = await processMarkdownForPdf(bodyMarkdown);

      // Determine Header Info from the series's relations
      // Priority: series.educationalStream > lesson.educationalStream > lesson.module.educationalStream > formatLevel(series.level)
      const lesson = series.lesson;
      const streamName =
        series.educationalStream?.name ||
        lesson?.educationalStream?.name ||
        lesson?.module?.educationalStream?.name ||
        formatLevel(series.level); // Use level enum, not stream
      const moduleName = lesson?.module?.name || "";

      htmlContent = generatePdfHtml({
        title,
        headerType: 'series',
        content: processedBody,
        // Series doesn't have "Pre-numbered" content like lessons (1. Intro), 
        // it uses "## Exercice N" which we want to box. 
        // We set isPreNumbered = true to avoid adding "Book Icon + 1." to "Exercice 1".
        // Instead, we rely on the specific styling for "Exercice" blocks if we had them, 
        // or just let them be standard headers. 
        // Actually, let's use the standard "Box Numbering" for robustness, 
        // but since we manually added "Exercice N", we don't want "1. Exercice N".
        // Use PRE-NUMBERED to avoid double numbering.
        isPreNumbered: true,
        meta: {
          "level": streamName || "Mathématiques",
          "stream": "",  // Already included in level if exists
          "semester": series.semester?.toString() || lesson?.semester?.toString() || "",
          "category": "SÉRIE D'EXERCICES",
          "professor": process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof: Mohamed Nagchi"
        } as any
      });
    } else if (type === 'exam' && id) {
      // Fetch Exam from DB
      const exam = await prisma.exam.findUnique({ where: { id } });
      if (!exam) throw new Error("Exam not found");

      title = exam.title;
      let content = exam.content as any;

      if (typeof content === 'string') {
        try { content = JSON.parse(content); } catch { content = {}; }
      }

      let bodyMarkdown = "";

      // Instructions
      if (content.instructions) {
        bodyMarkdown += `## Instructions\n\n${content.instructions}\n\n`;
      }

      // Exercises
      if (Array.isArray(content.exercises)) {
        content.exercises.forEach((ex: any, idx: number) => {
          bodyMarkdown += `## Exercice ${idx + 1} (${ex.points || 0} pts)\n\n`;
          bodyMarkdown += (ex.problem || "") + "\n\n";

          if (body.includeCorrection && ex.solution) {
            bodyMarkdown += `### Solution\n\n${ex.solution}\n\n`;
          } else if (ex.spaceLines && ex.spaceLines > 0) {
            bodyMarkdown += `_Answer Space (${ex.spaceLines} lines)_\n\n`;
          }

          bodyMarkdown += "---\n\n";
        });
      }

      // Apply LaTeX preprocessing
      const { latexPreprocessor: examLatexPreprocessor } = await import("@/lib/latex-preprocessor");
      bodyMarkdown = examLatexPreprocessor.normalizeLatex(bodyMarkdown);

      const processedBody = await processMarkdownForPdf(bodyMarkdown);

      // Determine exam type label
      let typeLabel = "Examen";
      if (exam.type === "EXAM") {
        if (exam.examType === "NATIONAL") typeLabel = "Examen National";
        else if (exam.examType === "REGIONAL") typeLabel = "Examen Régional";
        else if (exam.examType === "LOCAL") typeLabel = "Examen Local";
      } else {
        typeLabel = `Contrôle N°${exam.controlNumber || 1}`;
      }

      // Add "CORRIGÉ" label if correction included
      if (body.includeCorrection) {
        typeLabel += " - CORRIGÉ";
      }

      htmlContent = generatePdfHtml({
        title,
        subtitle: content.subtitle,
        headerType: 'exam',
        content: processedBody,
        meta: {
          "Duration": content.duration,
          "Total Points": content.totalPoints?.toString(),
          "category": typeLabel.toUpperCase(), // Ensure uppercase for category
          "level": formatLevel(exam.level),
          "semester": exam.semester.toString(),
          "stream": exam.stream !== 'NONE' ? exam.stream : undefined,
          "professor": process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof: Mohamed Nagchi"
        } as any
      });

    } else if (type === 'exam_payload') {
      // Raw exam data from frontend preview
      const { exam } = body;
      title = exam.title || "Examen";

      let bodyMarkdown = "";

      // Instructions
      if (exam.instructions) {
        bodyMarkdown += `## Instructions\n\n${exam.instructions}\n\n`;
      }

      // Exercises
      exam.exercises.forEach((ex: any, idx: number) => {
        bodyMarkdown += `## Exercice ${idx + 1} (${ex.points || 0} pts)\n\n`;
        bodyMarkdown += ex.problem + "\n\n";

        if (ex.spaceLines) {
          bodyMarkdown += `_Answer Space (${ex.spaceLines} lines)_\n\n`;
        }
        bodyMarkdown += "---\n\n";
      });

      // Apply LaTeX preprocessing
      const { latexPreprocessor: payloadLatexPreprocessor } = await import("@/lib/latex-preprocessor");
      bodyMarkdown = payloadLatexPreprocessor.normalizeLatex(bodyMarkdown);

      const processedBody = await processMarkdownForPdf(bodyMarkdown);
      htmlContent = generatePdfHtml({
        title,
        subtitle: exam.subtitle,
        headerType: 'exam',
        content: processedBody,
        meta: { "Duration": exam.duration, "Total Points": exam.totalPoints }
      });
    }
    // Add other types as needed

    // Launch Puppeteer
    console.log("[PDF API] Launching Puppeteer...");
    let browser;
    try {
      browser = await getBrowser();
      console.log("[PDF API] Browser launched.");
      const page = await browser.newPage();

      // Capture console logs from the page
      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
          console.error(`[Browser Console Error] ${text}`);
        } else if (type === 'warn') {
          console.warn(`[Browser Console] ${text}`);
        } else {
          console.log(`[Browser Console] ${text}`);
        }
      });

      // Set a longer default timeout for all operations
      page.setDefaultTimeout(30000);

      // Set content with increased timeout
      console.log("[PDF API] Setting page content...");
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      console.log("[PDF API] Content set successfully.");

      // Wait for KaTeX rendering
      try {
        console.log("[PDF API] Waiting for #print-ready...");
        await page.waitForSelector('#print-ready', { timeout: 20000 });
        console.log("[PDF API] Print ready signal received.");
      } catch (e) {
        console.warn("[PDF API] Print ready signal timeout, proceeding anyway...");
      }

      // Generate PDF
      console.log("[PDF API] Generating PDF...");
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }, // handled by CSS padding
        timeout: 30000
      });
      console.log("[PDF API] PDF generated successfully.");

      return new NextResponse(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
        },
      })

    } catch (error) {
      console.error("[PDF API] PDF Generation Error:", error);
      console.error("[PDF API] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json({
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    } finally {
      // Always close browser to prevent resource leaks
      if (browser) {
        try {
          await browser.close();
          console.log("[PDF API] Browser closed.");
        } catch (closeError) {
          console.error("[PDF API] Error closing browser:", closeError);
        }
      }
    }
  } catch (error) {
    console.error("[PDF API] Outer error:", error);
    console.error("[PDF API] Error stack:", error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({
      error: "PDF generation failed",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
