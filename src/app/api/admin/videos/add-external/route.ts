import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

/**
 * Add external video (YouTube, Vimeo, etc.) by URL
 * This bypasses file upload limits entirely
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id || !["ADMIN", "EDITOR", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoUrl, title, entityType, entityId } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    if (!entityType) {
      return NextResponse.json({ error: "Entity type is required" }, { status: 400 });
    }

    // Validate URL is from supported platforms
    const supportedPlatforms = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com'];
    const isSupported = supportedPlatforms.some(platform => videoUrl.includes(platform));

    if (!isSupported) {
      return NextResponse.json({
        error: "Unsupported video platform. Please use YouTube, Vimeo, or Dailymotion."
      }, { status: 400 });
    }

    // Extract video ID and create embed URL
    let embedUrl = videoUrl;
    let thumbnailUrl = null;

    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = extractYouTubeId(videoUrl);
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    // Vimeo
    else if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('/').pop()?.split('?')[0];
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
    }

    const video = await prisma.platformVideo.create({
      data: {
        filename: title || "External Video",
        originalFilename: title || "External Video",
        filepath: null, // No file storage needed
        url: embedUrl, // Store embed URL
        mimeType: "video/external",
        fileSize: 0, // External video
        entityType: entityType,
        entityId: entityId === "null" || entityId === "undefined" ? null : entityId,
        uploaderId: session.user.id,
        thumbnailUrl: thumbnailUrl,
        metadata: {
          originalUrl: videoUrl,
          platform: videoUrl.includes('youtube') ? 'youtube' : videoUrl.includes('vimeo') ? 'vimeo' : 'other'
        }
      },
    });

    return NextResponse.json({ success: true, video });
  } catch (error: any) {
    console.error("External video add error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
