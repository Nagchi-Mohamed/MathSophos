import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageContent } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    const session = await auth();
    const { entityType, entityId } = await params;

    console.log('[GET Images] Session:', {
      hasUser: !!session?.user,
      role: session?.user?.role,
      entityType,
      entityId
    });

    const isForumEntity = entityType === 'forum_post' || entityType === 'forum_reply';

    if (!session?.user || (!isForumEntity && !canManageContent(session.user.role))) {
      console.log('[GET Images] Unauthorized - role check failed');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const images = await prisma.platformImage.findMany({
      where: {
        entityType: entityType,
        entityId: entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[GET Images] Success - found', images.length, 'images');
    return NextResponse.json({ images });
  } catch (error: any) {
    console.error("[GET Images] Error:", error);
    console.error("[GET Images] Error stack:", error?.stack);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch images" },
      { status: 500 }
    );
  }
}
