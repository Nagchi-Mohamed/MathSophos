import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await prisma.platformVideo.findUnique({
      where: { id },
      select: {
        filepath: true,
        mimeType: true,
        filename: true,
        url: true,
        originalFilename: true
      }
    });

    if (!video) {
      return new NextResponse("Video not found", { status: 404 });
    }

    // 1. If URL is an external link (S3), redirect
    if (video.url && video.url.startsWith("http")) {
      return NextResponse.redirect(video.url);
    }

    // 2. If filepath contains base64 data, serve it
    if (video.filepath && !video.filepath.startsWith("http") && !video.filepath.startsWith("/")) {
      // This is base64 data
      try {
        const buffer = Buffer.from(video.filepath, 'base64');

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": video.mimeType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Disposition": `inline; filename="${video.filename}"`,
            "Accept-Ranges": "bytes",
          },
        });
      } catch (error) {
        console.error(`[Video API] Failed to decode base64 for video ${id}:`, error);
        return new NextResponse("Video data corrupted", { status: 500 });
      }
    }

    // 3. If filepath is a local path (legacy from Cloud Run), it's lost on Vercel
    if (video.filepath && video.filepath.startsWith("/")) {
      console.warn(`[Video API] Video ${id} (${video.originalFilename}) has legacy filesystem path but no data`);
      return new NextResponse(
        "Video unavailable - This video was uploaded before migration to database storage and is no longer available. Please re-upload.",
        { status: 410 } // 410 Gone - resource permanently deleted
      );
    }

    return new NextResponse("Video content missing", { status: 404 });
  } catch (error) {
    console.error("[Video API] Error serving video:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
