import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Increase body size limit for video uploads (Vercel default is 4.5MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

// Set max duration for video processing
export const maxDuration = 60;

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

    // Check file size (max 30MB for base64 storage - becomes ~40MB after encoding)
    const maxSizeBytes = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      return NextResponse.json({
        error: `File too large: ${sizeMB}MB. Maximum size is 30MB. Consider compressing the video or using a video hosting service like YouTube.`
      }, { status: 413 });
    }

    // Convert video to base64 for database storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    console.log(`[Video Upload] Storing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) as base64`);

    const video = await prisma.platformVideo.create({
      data: {
        filename: `${crypto.randomUUID()}.${file.name.split('.').pop()}`,
        originalFilename: file.name,
        filepath: base64Data, // Store base64 in filepath field (we'll serve it via API)
        url: null, // Will be constructed as /api/videos/[id]
        mimeType: file.type,
        fileSize: file.size,
        entityType: entityType,
        entityId: entityId === "null" || entityId === "undefined" ? null : entityId,
        uploaderId: session.user.id,
      },
    });

    // Return video with constructed URL
    const videoWithUrl = {
      ...video,
      url: `/api/videos/${video.id}`,
    };

    return NextResponse.json({ success: true, video: videoWithUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
