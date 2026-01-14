
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // Verify this path
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id || !["ADMIN", "EDITOR", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!entityType) {
      return NextResponse.json({ error: "Entity type is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalFilename = file.name;
    const fileExtension = path.extname(originalFilename);
    const filename = `${uuidv4()}${fileExtension}`;

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads/videos");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const videoUrl = `/uploads/videos/${filename}`;

    const video = await prisma.platformVideo.create({
      data: {
        filename: filename,
        originalFilename: originalFilename,
        filepath: filepath,
        url: videoUrl,
        mimeType: file.type,
        fileSize: file.size,
        entityType: entityType,
        entityId: entityId === "null" || entityId === "undefined" ? null : entityId,
        uploaderId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, video });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
