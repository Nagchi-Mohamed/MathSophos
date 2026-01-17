import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const image = await prisma.platformImage.findUnique({
      where: { id },
      select: {
        base64Data: true,
        mimeType: true,
        filename: true,
        filepath: true
      }
    });

    if (!image) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // 1. If filepath is an external URL (S3), redirect
    if (image.filepath && image.filepath.startsWith("http")) {
      return NextResponse.redirect(image.filepath);
    }

    // 2. If filepath is local (but managed via storage.ts fallback), try serving it (or redirect)
    // Note: Local uploads return a relative path like /uploads/..., which is handled by next/image or public folder.
    // If we are here, it means we manually requested /api/images/[id]
    if (image.filepath && image.filepath.startsWith("/")) {
      return NextResponse.redirect(new URL(image.filepath, request.url));
    }

    // 3. Fallback: Serve base64 data (legacy)
    if (image.base64Data) {
      const buffer = Buffer.from(image.base64Data, 'base64');
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": image.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Disposition": `inline; filename="${image.filename}"`
        },
      });
    }

    return new NextResponse("Image content missing", { status: 404 });
  } catch (error) {
    console.error("[Image API] Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
