import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  // Only OWNER or ADMIN may upload corrections
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("correctionFile") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "corrections"
  );
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  const url = `/uploads/corrections/${filename}`;
  return NextResponse.json({ success: true, url });
}
