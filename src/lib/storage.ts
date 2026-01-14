import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";

// Configuration from environment variables
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local"; // 'local' or 's3'
const S3_BUCKET = process.env.S3_BUCKET_NAME || "";
const S3_REGION = process.env.S3_REGION || "auto"; // 'auto' is common for generic S3, 'us-east-1' for AWS
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || "";
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
const S3_ENDPOINT = process.env.S3_ENDPOINT; // e.g. https://storage.googleapis.com

// S3 Client initialization
const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: !!S3_ENDPOINT, // Useful for some S3-compatible providers
});

/**
 * Uploads a file to the configured storage provider.
 * @param file The file object to upload
 * @param directory The directory path (e.g. "lessons/lesson-id")
 * @returns Object containing the public filepath and filename
 */
export async function uploadFile(
  file: File,
  directory: string
): Promise<{ filepath: string, filename: string }> {
  // Generate unique filename
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = path.extname(file.name);
  const filename = `${crypto.randomUUID()}${ext}`;

  if (STORAGE_PROVIDER === "s3") {
    if (!S3_BUCKET) throw new Error("S3_BUCKET_NAME is not configured");

    const key = `${directory}/${filename}`;

    // Upload to S3
    // Note: We don't set ACL here as modern buckets prefer Bucket Policies for public access.
    // Ensure your bucket allows public read access.
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    // Construct Public URL
    let url = "";
    if (S3_ENDPOINT?.includes("storage.googleapis.com")) {
      // Google Cloud Storage style
      url = `https://storage.googleapis.com/${S3_BUCKET}/${key}`;
    } else if (S3_ENDPOINT) {
      // Generic S3 endpoint style
      url = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
    } else {
      // AWS Standard style
      url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
    }

    return { filepath: url, filename };
  } else {
    // Local Filesystem Fallback
    const uploadDir = path.join(process.cwd(), "public", "uploads", directory);

    // Ensure directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // Return relative path for Next/Image
    return { filepath: `/uploads/${directory}/${filename}`, filename };
  }
}

/**
 * Deletes a file from the configured storage provider.
 * @param filepath The stored filepath (URL or relative path)
 */
export async function deleteFile(filepath: string): Promise<void> {
  if (STORAGE_PROVIDER === "s3") {
    if (!S3_BUCKET) return;

    try {
      // Attempt to extract Key from URL
      // For GCS: https://storage.googleapis.com/BUCKET/folder/file.png -> Key: folder/file.png
      // For AWS: https://BUCKET.s3.REGION.amazonaws.com/folder/file.png -> Key: folder/file.png

      let key = "";
      if (filepath.startsWith("http")) {
        const url = new URL(filepath);
        key = url.pathname.substring(1); // remove leading /

        // Remove bucket name if it's in the path (Path Style)
        if (key.startsWith(`${S3_BUCKET}/`)) {
          key = key.replace(`${S3_BUCKET}/`, "");
        }
      } else {
        // Fallback if we stored just the key (unlikely based on upload implementation)
        key = filepath;
      }

      if (key) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        }));
      }
    } catch (e) {
      console.error("Failed to delete S3 file:", e);
      // Don't throw, just log
    }
  } else {
    // Local
    // filepath is likely /uploads/folder/file.png
    // absolute: process.cwd() + public + filepath
    const absolutePath = path.join(process.cwd(), "public", filepath);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      console.warn("Local file delete failed (may not exist):", error);
    }
  }
}
