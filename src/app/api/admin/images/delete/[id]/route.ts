import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageContent } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    if (!canManageContent(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    // Get image record
    const image = await prisma.platformImage.findUnique({
      where: { id },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Check if user owns the image or has admin rights
    const userRole = session.user.role;
    if (image.uploaderId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own images" },
        { status: 403 }
      );
    }

    // Delete file from filesystem (only if filepath exists - base64 images don't have files)
    if (image.filepath) {
      try {
        await deleteFile(image.filepath);
      } catch (fileError: any) {
        // File might not exist, log but don't fail
        console.warn("Failed to delete file:", fileError.message);
      }
    }

    // Delete database record
    await prisma.platformImage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete image" },
      { status: 500 }
    );
  }
}
