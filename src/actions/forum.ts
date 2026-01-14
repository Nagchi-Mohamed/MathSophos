"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { unlink } from "fs/promises"
import { join } from "path"

export async function createForumPost(data: {
  title: string
  content: string
  imageUrl?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour créer un sujet" }
    }

    // Verify user exists in DB to prevent FK violation (stale session case)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isCommentBlocked: true,
        commentSuspendedUntil: true,
      }
    })

    if (!user) {
      return { success: false, error: "Compte utilisateur introuvable. Veuillez vous reconnecter." }
    }

    // Check if user is permanently blocked
    if (user.isCommentBlocked) {
      return { success: false, error: "Vous êtes bloqué et ne pouvez plus publier." }
    }

    // Check if user is temporarily suspended
    if (user.commentSuspendedUntil) {
      const now = new Date()
      if (new Date(user.commentSuspendedUntil) > now) {
        const daysLeft = Math.ceil((new Date(user.commentSuspendedUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          success: false,
          error: `Vous êtes suspendu et ne pouvez plus publier. La suspension expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`
        }
      }
    }

    const post = await prisma.forumPost.create({
      data: {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath("/forum")
    return { success: true, data: post }
  } catch (error: any) {
    console.error("Error creating forum post:", error)
    return { success: false, error: error.message }
  }
}

export async function updateForumPost(data: {
  id: string
  title?: string
  content?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour modifier un sujet" }
    }

    // Check if post exists and user owns it
    const post = await prisma.forumPost.findUnique({
      where: { id: data.id },
      select: { userId: true },
    })

    if (!post) {
      return { success: false, error: "Sujet introuvable" }
    }

    if (post.userId !== session.user.id) {
      return { success: false, error: "Vous ne pouvez modifier que vos propres sujets" }
    }

    // Update the post
    const updatedPost = await prisma.forumPost.update({
      where: { id: data.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath("/forum")
    revalidatePath(`/forum/${data.id}`)
    return { success: true, data: updatedPost }
  } catch (error: any) {
    console.error("Error updating forum post:", error)
    return { success: false, error: error.message }
  }
}

export async function createForumReply(data: {
  postId: string
  content: string
  imageUrl?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour répondre" }
    }

    // Verify user exists in DB and check if suspended/blocked
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isCommentBlocked: true,
        commentSuspendedUntil: true,
      }
    })

    if (!user) {
      return { success: false, error: "Compte utilisateur introuvable. Veuillez vous reconnecter." }
    }

    // Check if user is permanently blocked
    if (user.isCommentBlocked) {
      return { success: false, error: "Vous êtes bloqué et ne pouvez plus commenter." }
    }

    // Check if user is temporarily suspended
    if (user.commentSuspendedUntil) {
      const now = new Date()
      if (new Date(user.commentSuspendedUntil) > now) {
        const daysLeft = Math.ceil((new Date(user.commentSuspendedUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          success: false,
          error: `Vous êtes suspendu et ne pouvez plus commenter. La suspension expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`
        }
      }
    }

    const reply = await prisma.forumReply.create({
      data: {
        content: data.content,
        postId: data.postId,
        imageUrl: data.imageUrl,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath(`/forum/${data.postId}`)
    return { success: true, data: reply }
  } catch (error: any) {
    console.error("Error creating forum reply:", error)
    return { success: false, error: error.message }
  }
}

export async function updateForumReply(data: {
  id: string
  content: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour modifier une réponse" }
    }

    // Check if reply exists and user owns it
    const reply = await prisma.forumReply.findUnique({
      where: { id: data.id },
      select: { userId: true, postId: true },
    })

    if (!reply) {
      return { success: false, error: "Réponse introuvable" }
    }

    if (reply.userId !== session.user.id) {
      return { success: false, error: "Vous ne pouvez modifier que vos propres réponses" }
    }

    // Update the reply
    const updatedReply = await prisma.forumReply.update({
      where: { id: data.id },
      data: {
        content: data.content,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath(`/forum/${reply.postId}`)
    return { success: true, data: updatedReply }
  } catch (error: any) {
    console.error("Error updating forum reply:", error)
    return { success: false, error: error.message }
  }
}

export async function toggleReaction(data: {
  postId?: string
  replyId?: string
  emoji: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour réagir" }
    }

    const existingReaction = await prisma.forumReaction.findFirst({
      where: {
        userId: session.user.id,
        emoji: data.emoji,
        OR: [
          { postId: data.postId },
          { replyId: data.replyId }
        ]
      }
    })

    if (existingReaction) {
      await prisma.forumReaction.delete({
        where: { id: existingReaction.id }
      })
    } else {
      await prisma.forumReaction.create({
        data: {
          emoji: data.emoji,
          userId: session.user.id,
          postId: data.postId,
          replyId: data.replyId
        }
      })
    }

    // Revalidate paths
    if (data.postId) {
      revalidatePath(`/forum/${data.postId}`)
    } else if (data.replyId) {
      // We need to find the post ID for the reply to revalidate correctly
      const reply = await prisma.forumReply.findUnique({
        where: { id: data.replyId },
        select: { postId: true }
      })
      if (reply) {
        revalidatePath(`/forum/${reply.postId}`)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error toggling reaction:", error)
    return { success: false, error: error.message }
  }
}

export async function getForumPosts(limit: number = 20, offset: number = 0) {
  try {
    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          replies: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.forumPost.count(),
    ])

    return { success: true, data: { posts, total } }
  } catch (error: any) {
    console.error("Error fetching forum posts:", error)
    return { success: false, error: error.message }
  }
}

export async function getForumPost(id: string) {
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            reactions: {
              select: {
                id: true,
                emoji: true,
                userId: true,
              },
            },
          },
        },
      },
    })

    if (!post) {
      return { success: false, error: "Sujet introuvable" }
    }

    return { success: true, data: post }
  } catch (error: any) {
    console.error("Error fetching forum post:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteForumPost(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Non autorisé" }
    }

    // Check if user owns the post or is admin
    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: { userId: true, imageUrl: true },
    })

    if (!post) {
      return { success: false, error: "Sujet introuvable" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (post.userId !== session.user.id && user?.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" }
    }

    // Delete associated image file if it exists
    if (post.imageUrl) {
      try {
        const filePath = join(process.cwd(), "public", post.imageUrl)
        await unlink(filePath)
      } catch (error) {
        // File might not exist or already deleted, continue anyway
        console.warn("Could not delete image file:", error)
      }
    }

    await prisma.forumPost.delete({
      where: { id },
    })

    revalidatePath("/forum")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting forum post:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteForumReply(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Non autorisé" }
    }

    // Check if user owns the reply or is admin
    const reply = await prisma.forumReply.findUnique({
      where: { id },
      select: { userId: true, postId: true, imageUrl: true },
    })

    if (!reply) {
      return { success: false, error: "Réponse introuvable" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (reply.userId !== session.user.id && user?.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" }
    }

    // Delete associated image file if it exists
    if (reply.imageUrl) {
      try {
        const filePath = join(process.cwd(), "public", reply.imageUrl)
        await unlink(filePath)
      } catch (error) {
        // File might not exist or already deleted, continue anyway
        console.warn("Could not delete image file:", error)
      }
    }

    await prisma.forumReply.delete({
      where: { id },
    })

    revalidatePath(`/forum/${reply.postId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting forum reply:", error)
    return { success: false, error: error.message }
  }
}

export async function suspendUserComments(userId: string, hours: number) {
  try {
    const session = await auth()
    const currentUser = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true }
    })

    if (currentUser?.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" }
    }

    const suspendUntil = new Date()
    suspendUntil.setHours(suspendUntil.getHours() + hours)

    await prisma.user.update({
      where: { id: userId },
      data: {
        commentSuspendedUntil: suspendUntil,
        isCommentBlocked: false
      }
    })

    revalidatePath("/admin/forum")
    return { success: true }
  } catch (error: any) {
    console.error("Error suspending user:", error)
    return { success: false, error: error.message }
  }
}

export async function blockUserComments(userId: string) {
  try {
    const session = await auth()
    const currentUser = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true }
    })

    if (currentUser?.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isCommentBlocked: true,
        commentSuspendedUntil: null
      }
    })

    revalidatePath("/admin/forum")
    return { success: true }
  } catch (error: any) {
    console.error("Error blocking user:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await auth()
    const currentUser = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true }
    })

    if (currentUser?.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" }
    }

    if (userId === session?.user?.id) {
      return { success: false, error: "Vous ne pouvez pas supprimer votre propre compte ici" }
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    revalidatePath("/admin/forum")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return { success: false, error: error.message }
  }
}

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
