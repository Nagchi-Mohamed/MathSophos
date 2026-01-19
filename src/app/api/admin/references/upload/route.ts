import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageContent } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
// @ts-ignore
const PDFParser = require("pdf2json");

export const maxDuration = 60; // Allow enough time for parsing

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || !canManageContent(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string || "MATH";

    // Parse Array Fields
    const types = JSON.parse(formData.get("types") as string || "[]");
    const levels = JSON.parse(formData.get("levels") as string || "[]");
    const streams = JSON.parse(formData.get("streams") as string || "[]");
    const semesters = JSON.parse(formData.get("semesters") as string || "[]");
    const targetLessonIds = JSON.parse(formData.get("targetLessonIds") as string || "[]");
    const targetsAllLessons = formData.get("targetsAllLessons") === "true";

    if (!file || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ... file saving logic (unchanged) ...
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "uploads", "references");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    const filepath = path.join(uploadDir, filename);
    const fileUrl = `/uploads/references/${filename}`;
    await writeFile(filepath, buffer);

    // 2. Extract Text
    let textContent = "";
    try {
      textContent = await new Promise((resolve, reject) => {
        const parser = new PDFParser(this, 1); // 1 = text only
        parser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        parser.on("pdfParser_dataReady", (pdfData: any) => {
          // getRawTextContent() returns distinct lines. We join them.
          resolve(parser.getRawTextContent());
        });
        parser.parseBuffer(buffer);
      });

      // Cleanup common issues
      textContent = textContent.replace(/----------------Page \(\d+\) Break----------------/g, "\n");
      // Remove null bytes which crash Postgres
      textContent = textContent.replace(/\u0000/g, "");
    } catch (parseError) {
      console.error("Failed to parse PDF:", parseError);
    }

    // 3. Save to Database
    const reference = await prisma.pedagogicalReference.create({
      data: {
        title,
        types,
        levels: levels as any[],
        streams: streams as any[],
        semesters: semesters.map(Number),
        targetLessonIds,
        targetsAllLessons,
        subject,
        fileUrl,
        textContent,
        metadata: {
          originalName: file.name,
          size: file.size,
        }
      }
    });

    return NextResponse.json({ success: true, reference });

  } catch (error: any) {
    console.error("[Reference Upload] Error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
