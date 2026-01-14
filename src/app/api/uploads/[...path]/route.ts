import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// S3 Config (mirrored from storage.ts)
const S3_BUCKET = process.env.S3_BUCKET_NAME || "";
const S3_REGION = process.env.S3_REGION || "auto";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || "";
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
const S3_ENDPOINT = process.env.S3_ENDPOINT;

const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: !!S3_ENDPOINT,
});


const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // prevent directory traversal
    if (pathSegments.some((segment) => segment.includes("..") || segment.includes("/") || segment.includes("\\"))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", ...pathSegments);

    // 1. Try serving from Local Filesystem (Priority)
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // 2. Try serving from S3/GCS (Fallback)
    // If we have S3 config and file wasn't found locally, try to fetch it from bucket
    if (S3_BUCKET) {
      try {
        // Reconstruct key: path segments joined by /
        // e.g., ["exercises", "abc.png"] -> "exercises/abc.png"
        const key = pathSegments.join("/");

        const command = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        });

        const response = await s3Client.send(command);

        if (response.Body) {
          // Convert stream to buffer
          const byteArray = await response.Body.transformToByteArray();
          const buffer = Buffer.from(byteArray);

          const ext = path.extname(key).toLowerCase();
          const contentType = MIME_TYPES[ext] || response.ContentType || "application/octet-stream";

          return new NextResponse(buffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch (s3Error) {
        // S3 fetch failed (file not found or other error)
        // Check if it's a 404-like error to just continue, otherwise log
        // console.warn("S3 Proxy fetch failed:", s3Error);
      }
    }

    // Default 404 if not found in either
    return new NextResponse("Not Found", { status: 404 });

  } catch (error) {
    console.error("[Uploads API] Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
