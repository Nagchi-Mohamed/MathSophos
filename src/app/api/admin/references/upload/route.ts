import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageContent } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import pdf from "pdf-parse";

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
    const type = formData.get("type") as string;
    const level = formData.get("level") as string;
    const subject = formData.get("subject") as string || "MATH";

    if (!file || !title || !type || !level) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // 1. Save File Locally (for this environment)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "references");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    const filepath = path.join(uploadDir, filename);
    const fileUrl = `/uploads/references/${filename}`;

    await writeFile(filepath, buffer);

    // 2. Extract Text
    let textContent = "";
    try {
      const data = await pdf(buffer);
      textContent = data.text;
      console.log(`[Reference Upload] Extracted ${textContent.length} characters`);
    } catch (parseError) {
      console.error("Failed to parse PDF:", parseError);
      // We continue even if parse fails, just without text content
      textContent = "";
    }

    // 3. Save to Database
    const reference = await prisma.pedagogicalReference.create({
      data: {
        title,
        type,
        level: level as any, // Cast to enum
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
