"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { unlink } from "fs/promises"
import path from "path"

export async function getReferences() {
  try {
    const references = await prisma.pedagogicalReference.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: references }
  } catch (error) {
    console.error("Failed to fetch references:", error)
    return { success: false, error: "Failed to fetch references" }
  }
}

export async function getReferencesByLevel(level: string) {
  try {
    const references = await prisma.pedagogicalReference.findMany({
      where: { level: level as any },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: references }
  } catch (error) {
    console.error("Failed to fetch references by level:", error)
    return { success: false, error: "Failed to fetch references" }
  }
}

export async function deleteReference(id: string) {
  try {
    const reference = await prisma.pedagogicalReference.findUnique({
      where: { id }
    })

    if (!reference) {
      return { success: false, error: "Reference not found" }
    }

    // Attempt to delete file if it exists locally
    if (reference.fileUrl.startsWith("/uploads/references/")) {
      try {
        const filePath = path.join(process.cwd(), "public", reference.fileUrl)
        await unlink(filePath)
      } catch (e) {
        console.warn("Failed to delete local file:", e)
      }
    }

    await prisma.pedagogicalReference.delete({
      where: { id }
    })

    revalidatePath("/admin/references")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete reference:", error)
    return { success: false, error: "Failed to delete reference" }
  }
}

export async function searchReferences(query: string, level: string) {
  try {
    // Basic keyword search in Postgres
    // Note: For production, Full Text Search (tsvector) or embeddings (pgvector) is better
    // Here we do a simple LIKE query which is okay for a few books
    const references = await prisma.pedagogicalReference.findMany({
      where: {
        level: level as any,
        textContent: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        type: true,
        textContent: true
      }
    })

    // Process results to extract snippets
    const results = references.map(ref => {
      const text = ref.textContent || ""
      const index = text.toLowerCase().indexOf(query.toLowerCase())

      // Extract ~1500 chars window around the match
      const start = Math.max(0, index - 500)
      const end = Math.min(text.length, index + 1000)
      const snippet = "..." + text.substring(start, end).replace(/\s+/g, ' ') + "..."

      return {
        id: ref.id,
        title: ref.title,
        type: ref.type,
        snippet
      }
    })

    return { success: true, data: results }
  } catch (error) {
    console.error("Failed to search references:", error)
    return { success: false, error: "Failed to search references" }
  }
}
