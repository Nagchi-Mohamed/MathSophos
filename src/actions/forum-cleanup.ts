import { unlink } from "fs/promises"
import { join } from "path"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function cleanupOldForumPosts() {
  try {
    const session = await auth()

    // Check if user is admin
    if (!session?.user?.id) {
      return { success: false, error: "Non autorisé" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return { success: false, error: "Accès réservé aux administrateurs" }
    }

    // Calculate cutoff date (1 month ago = 30 days)
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    // Find old posts and replies with their images
    const oldPosts = await prisma.forumPost.findMany({
      where: {
        createdAt: {
          lt: oneMonthAgo,
        },
      },
      select: {
        id: true,
        imageUrl: true,
        replies: {
          select: {
            imageUrl: true,
          },
        },
      },
    })

    // Collect all image URLs to delete
    const imageUrls: string[] = []
    oldPosts.forEach(post => {
      if (post.imageUrl) imageUrls.push(post.imageUrl)
      post.replies.forEach(reply => {
        if (reply.imageUrl) imageUrls.push(reply.imageUrl)
      })
    })

    // Delete posts (cascade will delete replies and reactions)
    const deleteResult = await prisma.forumPost.deleteMany({
      where: {
        createdAt: {
          lt: oneMonthAgo,
        },
      },
    })

    // Delete image files from filesystem
    let deletedFiles = 0
    let failedFiles = 0

    for (const imageUrl of imageUrls) {
      try {
        // Convert URL to filesystem path
        // imageUrl format: "/uploads/forum/filename.jpg"
        const filePath = join(process.cwd(), "public", imageUrl)
        await unlink(filePath)
        deletedFiles++
      } catch (error) {
        console.error(`Failed to delete file ${imageUrl}:`, error)
        failedFiles++
      }
    }

    revalidatePath("/admin/forum")
    revalidatePath("/forum")

    return {
      success: true,
      data: {
        postsDeleted: deleteResult.count,
        filesDeleted: deletedFiles,
        filesFailed: failedFiles,
      },
    }
  } catch (error: any) {
    console.error("Error cleaning up old forum posts:", error)
    return { success: false, error: error.message }
  }
}
