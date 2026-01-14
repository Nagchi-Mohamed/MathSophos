
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !["ADMIN", "EDITOR", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const video = await prisma.platformVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Delete file from disk if it exists
    if (video.filepath) {
      try {
        await unlink(video.filepath);
      } catch (e) {
        console.error("Error deleting file:", e);
        // Continue even if file delete fails (maybe already gone)
      }
    }

    await prisma.platformVideo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete video error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
