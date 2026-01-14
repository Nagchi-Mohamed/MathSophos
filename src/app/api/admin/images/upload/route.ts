import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageContent } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import path from "path";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      console.error("[Upload] No session or user");
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    const isForumEntity = entityType === 'forum_post' || entityType === 'forum_reply';

    if (!isForumEntity && !canManageContent(session.user.role)) {
      console.error("[Upload] Insufficient permissions:", session.user.role);
      return NextResponse.json(
        { error: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      console.error("[Upload] No user ID in session:", session.user);
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    console.log("[Upload] Received request:", {
      hasFile: !!file,
      fileType: file?.type,
      entityType,
      entityId,
      fileName: file?.name,
      fileSize: file?.size
    });

    if (!file) {
      console.error("[Upload] No file provided");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      console.error("[Upload] Invalid file type:", file.type);
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    if (!entityType) {
      console.error("[Upload] No entity type provided");
      return NextResponse.json(
        { error: "Entity type is required" },
        { status: 400 }
      );
    }

    if (!entityId) {
      console.error("[Upload] No entity ID provided");
      return NextResponse.json(
        { error: "Entity ID is required" },
        { status: 400 }
      );
    }

    // Determine folder name based on entity type
    let folderType = "misc";
    if (entityType === "lesson") folderType = "lessons";
    else if (entityType === "series" || entityType === "exercise") folderType = "exercises";
    else if (entityType === "exam" || entityType === "control") folderType = "exams";

    const safeEntityId = entityId.replace(/[^a-zA-Z0-9-_]/g, "");

    if (!safeEntityId || safeEntityId === "temp") {
      return NextResponse.json(
        { error: "Invalid entity ID" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${crypto.randomUUID()}${ext}`;

    // Save to database with base64 data
    try {
      console.log("[Upload] Saving to database with base64 data:", {
        entityType,
        entityId,
        filename,
        uploaderId: userId,
        fileSize: file.size
      });

      const image = await prisma.platformImage.create({
        data: {
          entityType: entityType,
          entityId: entityId,
          filename: filename,
          originalFilename: file.name,
          filepath: null, // Not using filepath anymore
          base64Data: base64Data, // Store base64 directly
          mimeType: file.type,
          fileSize: file.size,
          uploaderId: userId,
          metadata: {}
        }
      });

      console.log("[Upload] Image saved successfully:", image.id);
      return NextResponse.json({ success: true, image });
    } catch (dbError: any) {
      console.error("[Upload] Database error:", dbError);
      return NextResponse.json(
        { error: `Failed to save image record: ${dbError.message || "Unknown database error"}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Upload] Unexpected error:", error);
    console.error("[Upload] Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
