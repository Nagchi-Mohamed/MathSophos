
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    const params = await props.params;
    const { entityType, entityId } = params;

    const videos = await prisma.platformVideo.findMany({
      where: {
        entityType: entityType,
        entityId: entityId === "null" || entityId === "undefined" ? null : entityId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error("Fetch videos error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
