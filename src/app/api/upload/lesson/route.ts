import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageContent } from "@/lib/roles";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !canManageContent(session.user.role)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("lessonFile") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  // Create uploads folder if missing
  const uploadDir = path.join(process.cwd(), "public", "uploads", "lessons");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, filename);

  // Write file to disk
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  // Return public URL
  const url = `/uploads/lessons/${filename}`;
  return NextResponse.json({ success: true, url });
}
