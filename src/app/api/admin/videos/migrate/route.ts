import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Migration endpoint to update old video URLs to use the new API format
 * This fixes videos that were uploaded with /uploads/videos/ paths
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Only allow admins to run migrations
    if (!session || !session.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    console.log("[Video Migration] Starting migration of old video URLs...");

    // Find all videos with old /uploads/videos/ URLs
    const oldVideos = await prisma.platformVideo.findMany({
      where: {
        OR: [
          { url: { startsWith: "/uploads/videos/" } },
          { filepath: { startsWith: "/uploads/videos/" } },
          { filepath: { startsWith: "public/uploads/videos/" } },
        ]
      }
    });

    console.log(`[Video Migration] Found ${oldVideos.length} videos with old URLs`);

    let updated = 0;
    let failed = 0;

    for (const video of oldVideos) {
      try {
        // Update to use the new API URL format
        await prisma.platformVideo.update({
          where: { id: video.id },
          data: {
            url: `/api/videos/${video.id}`,
            // Clear the old filepath since we can't serve from filesystem on Vercel
            filepath: null,
          }
        });
        updated++;
        console.log(`[Video Migration] Updated video ${video.id}: ${video.originalFilename}`);
      } catch (error) {
        console.error(`[Video Migration] Failed to update video ${video.id}:`, error);
        failed++;
      }
    }

    const result = {
      success: true,
      message: `Migration complete: ${updated} videos updated, ${failed} failed`,
      details: {
        found: oldVideos.length,
        updated,
        failed
      }
    };

    console.log("[Video Migration]", result.message);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[Video Migration] Error:", error);
    return NextResponse.json({
      error: "Migration failed",
      details: error.message
    }, { status: 500 });
  }
}
