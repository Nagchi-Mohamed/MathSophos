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
        filename: true
      }
    });

    if (!image || !image.base64Data) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(image.base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${image.filename}"`
      },
    });
  } catch (error) {
    console.error("[Image API] Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
