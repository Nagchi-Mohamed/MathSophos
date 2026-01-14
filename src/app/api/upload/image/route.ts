import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageContent } from "@/lib/roles";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized - Not logged in" },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "misc";

  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "File must be an image" },
      { status: 400 }
    );
  }

  // Create uploads folder if missing
  // Sanitize folder name to prevent directory traversal
  const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, "");
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);

  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Error creating directory:", error);
    return NextResponse.json(
      { error: "Failed to create upload directory" },
      { status: 500 }
    );
  }

  const ext = path.extname(file.name);
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, filename);

  // Write file to disk
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  // Return public URL
  const url = `/uploads/${safeFolder}/${filename}`;
  return NextResponse.json({ success: true, url });
}
