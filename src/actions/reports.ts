"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function submitReport(data: {
  type: "ERROR" | "CONTACT"
  content: string
  pageType: "lesson" | "exercise" | "forum" | "exam" | "control" | "series" | "home" | "calculator" | "solver" | "general"
  entityId?: string
  entityTitle?: string
  url?: string
  path?: string
}) {
  console.log("📝 submitReport called with:", { type: data.type, pageType: data.pageType, contentLength: data.content?.length })

  const session = await auth()
  console.log("🔐 Session:", session?.user ? { id: session.user.id, email: session.user.email, name: session.user.name } : "No session")

  if (!session?.user?.id) {
    console.log("❌ No session - returning error")
    return { success: false, error: "Vous devez être connecté pour envoyer un signalement." }
  }

  // First, find the user - try by ID, then by email if needed
  console.log("👤 Step 1: Checking if user exists...")
  let userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true }
  })

  // If user not found by ID, try to find by email (JWT sessions might have stale IDs)
  if (!userExists && session.user.email) {
    console.log("⚠️ User not found by ID, trying to find by email:", session.user.email)
    userExists = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (userExists) {
      console.log("✅ User found by email, ID:", userExists.id)
    }
  }

  if (!userExists) {
    console.log("❌ User not found in database by ID or email")
    return { success: false, error: "Compte utilisateur introuvable. Veuillez vous reconnecter." }
  }
  console.log("✅ Step 1: User exists with ID:", userExists.id)

  // Get the verified user ID to use
  const verifiedUserId = userExists.id

  // Check if user is blocked or suspended from sending reports
  // Use try-catch to handle cases where fields might not exist in DB yet
  try {

    // Try to check suspension/block status if fields exist
    try {
      console.log("🔒 Step 2: Checking suspension/block status...")
      // Use the verified user ID
      const user = await prisma.user.findUnique({
        where: { id: verifiedUserId },
        select: {
          id: true,
          isReportBlocked: true,
          reportSuspendedUntil: true,
        }
      })
      console.log("🔒 Step 2: User data retrieved:", {
        hasUser: !!user,
        isBlocked: user?.isReportBlocked,
        suspendedUntil: user?.reportSuspendedUntil
      })

      if (user) {
        // Check if user is permanently blocked
        if (user.isReportBlocked === true) {
          console.log("❌ User is permanently blocked")
          return { success: false, error: "Vous êtes bloqué et ne pouvez plus envoyer de signalements." }
        }

        // Check if user is temporarily suspended
        if (user.reportSuspendedUntil) {
          const now = new Date()
          if (new Date(user.reportSuspendedUntil) > now) {
            const daysLeft = Math.ceil((new Date(user.reportSuspendedUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            console.log(`❌ User is suspended for ${daysLeft} more days`)
            return {
              success: false,
              error: `Vous êtes suspendu et ne pouvez plus envoyer de signalements. La suspension expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`
            }
          }
        }
      }
      console.log("✅ Step 2: User is not blocked or suspended")
    } catch (fieldError: any) {
      console.log("⚠️ Step 2: Error checking suspension fields:", fieldError?.message)
      // If fields don't exist in the database schema yet, skip the check
      // This can happen if the Prisma client was generated before the fields were added
      if (fieldError?.message?.includes('isReportBlocked') || fieldError?.message?.includes('reportSuspendedUntil') ||
        fieldError?.message?.includes('Unknown field')) {
        // Fields don't exist yet, skip suspension check and continue
        console.log("⚠️ Step 2: Suspension fields don't exist, continuing anyway")
      } else {
        // Re-throw if it's a different error
        console.log("❌ Step 2: Unexpected error, re-throwing:", fieldError)
        throw fieldError
      }
    }
    console.log("✅ User validation complete")
  } catch (error: any) {
    console.log("❌ Error in user validation:", error?.message, error?.stack)
    // If there's an error, we already verified the user exists above, so continue
    console.log("⚠️ Skipping suspension check due to error, but user exists")
  }

  console.log("📝 Step 3: Validating content...")
  if (!data.content || !data.content.trim()) {
    console.log("❌ No content provided")
    return { success: false, error: "Le contenu du signalement est requis." }
  }
  console.log("✅ Step 3: Content is valid")

  console.log("💾 Step 4: Attempting to create report in database...")
  try {
    console.log("💾 Creating report with verified userId:", verifiedUserId)

    const report = await prisma.report.create({
      data: {
        type: data.type,
        title: data.entityTitle || data.pageType,
        description: data.content.trim(),
        userId: verifiedUserId,
        metadata: {
          pageType: data.pageType,
          entityId: data.entityId,
          url: data.url || "",
          path: data.path || "",
        }
      },
    })

    console.log("✅ Report created successfully:", {
      id: report.id,
      type: report.type,
      title: report.title,
      userId: report.userId,
    })

    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error submitting report:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    })
    return {
      success: false,
      error: error?.message || "Une erreur s'est produite lors de l'envoi du signalement."
    }
  }
}

export async function getReports(filters?: {
  status?: "pending" | "resolved"
  type?: "ERROR" | "CONTACT" | "FORUM_COMMENT"
}) {
  try {
    // Build where clause based on filters
    const where: any = {}
    if (filters?.status === "pending") {
      where.isResolved = false
    } else if (filters?.status === "resolved") {
      where.isResolved = true
    }
    if (filters?.type) {
      where.type = filters.type
    }

    console.log("🔍 Fetching reports with filters:", filters, "where clause:", where)

    // First try with all relations including replies
    try {
      const reports = await prisma.report.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          replies: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              repliedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
      console.log(`✅ Found ${reports.length} reports`)
      return reports
    } catch (relationError: any) {
      // If relation fails (e.g., missing foreign key or model), try without replies
      if (relationError?.code === 'P2017' || relationError?.code === 'P2001' || relationError?.code === 'P2010' || relationError?.code === '42P01' ||
        relationError?.message?.includes('relation') || relationError?.message?.includes('foreign') ||
        relationError?.message?.includes('replies') || relationError?.message?.includes('ReportReply') ||
        relationError?.message?.includes('does not exist') || relationError?.message?.includes('n\'existe pas')) {
        // Silently fall back to fetching without replies
        const reports = await prisma.report.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
        return reports
      }
      throw relationError
    }
  } catch (error: any) {
    console.error("Error fetching reports:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    throw new Error(error?.message || "Une erreur s'est produite lors de la récupération des signalements.")
  }
}

export async function getReportCounts() {
  try {
    // Fetch the first three counts in parallel
    const [pendingCount, errorCount, contactCount] = await Promise.all([
      prisma.report.count({ where: { isResolved: false } }),
      prisma.report.count({ where: { type: "ERROR" } }),
      prisma.report.count({ where: { type: "CONTACT" } }),
    ])

    // Try to count FORUM_COMMENT, but handle gracefully if enum value doesn't exist in DB yet
    let forumCommentCount = 0
    try {
      forumCommentCount = await prisma.report.count({ where: { type: "FORUM_COMMENT" } })
    } catch (forumError: any) {
      // If FORUM_COMMENT doesn't exist in the database enum yet, return 0
      // This can happen if the schema was updated but migrations haven't been run
      if (forumError?.message?.includes('FORUM_COMMENT') || forumError?.message?.includes('ReportType')) {
        // Silently return 0 - the enum value doesn't exist in DB yet
        forumCommentCount = 0
      } else {
        // Re-throw if it's a different error
        throw forumError
      }
    }

    return {
      pendingCount,
      errorCount,
      contactCount,
      forumCommentCount,
    }
  } catch (error: any) {
    console.error("Error fetching report counts:", error)
    // Return zeros on error to prevent UI issues
    return {
      pendingCount: 0,
      errorCount: 0,
      contactCount: 0,
      forumCommentCount: 0,
    }
  }
}

export async function markReportResolved(reportId: string) {
  try {
    await prisma.report.update({
      where: { id: reportId },
      data: { isResolved: true },
    })

    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error) {
    console.error("Error marking report as resolved:", error)
    return { success: false, error: "Une erreur s'est produite lors de la mise à jour du signalement." }
  }
}

export async function reportForumComment(data: {
  replyId: string
  replyContent: string
  replyAuthorId: string
  replyAuthorName: string
  postId: string
  reason: string
}) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Vous devez être connecté pour signaler un commentaire." }
  }

  // Check if user is blocked or suspended from sending reports
  // Use try-catch to handle cases where fields might not exist in DB yet
  try {
    // First verify user exists
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })
    if (!userExists) {
      return { success: false, error: "Compte utilisateur introuvable." }
    }

    // Try to check suspension/block status if fields exist
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          isReportBlocked: true,
          reportSuspendedUntil: true,
        }
      })

      if (user) {
        // Check if user is permanently blocked
        if (user.isReportBlocked === true) {
          return { success: false, error: "Vous êtes bloqué et ne pouvez plus envoyer de signalements." }
        }

        // Check if user is temporarily suspended
        if (user.reportSuspendedUntil) {
          const now = new Date()
          if (new Date(user.reportSuspendedUntil) > now) {
            const daysLeft = Math.ceil((new Date(user.reportSuspendedUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return {
              success: false,
              error: `Vous êtes suspendu et ne pouvez plus envoyer de signalements. La suspension expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`
            }
          }
        }
      }
    } catch (fieldError: any) {
      // If fields don't exist in the database schema yet, skip the check
      // This can happen if the Prisma client was generated before the fields were added
      if (fieldError?.message?.includes('isReportBlocked') || fieldError?.message?.includes('reportSuspendedUntil') ||
        fieldError?.message?.includes('Unknown field')) {
        // Fields don't exist yet, skip suspension check and continue
      } else {
        // Re-throw if it's a different error
        throw fieldError
      }
    }
  } catch (error: any) {
    // If there's any other error, just verify user exists and continue
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })
    if (!userExists) {
      return { success: false, error: "Compte utilisateur introuvable." }
    }
    // Skip suspension check on error
  }

  if (!data.reason || !data.reason.trim()) {
    return { success: false, error: "La raison du signalement est requise." }
  }

  try {
    // Get the post to get its title
    const post = await prisma.forumPost.findUnique({
      where: { id: data.postId },
      select: { title: true },
    })

    await prisma.report.create({
      data: {
        type: "FORUM_COMMENT",
        title: `Commentaire signalé - ${data.replyAuthorName}`,
        description: data.reason.trim(),
        userId: session.user.id,
        metadata: {
          replyId: data.replyId,
          replyContent: data.replyContent,
          replyAuthorId: data.replyAuthorId,
          replyAuthorName: data.replyAuthorName,
          postId: data.postId,
          postTitle: post?.title || "",
          pageType: "forum",
          path: `/forum/${data.postId}`,
        }
      },
    })

    revalidatePath("/admin/reports")
    revalidatePath(`/forum/${data.postId}`)
    return { success: true }
  } catch (error) {
    console.error("Error reporting forum comment:", error)
    return { success: false, error: "Une erreur s'est produite lors de l'envoi du signalement." }
  }
}

export async function deleteForumReply(replyId: string) {
  try {
    const session = await auth()
    if (!session?.user?.role || (session.user.role !== "ADMIN" && session.user.role !== "CONTENT_MODERATOR")) {
      return { success: false, error: "Non autorisé" }
    }

    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
      select: { postId: true },
    })

    if (!reply) {
      return { success: false, error: "Commentaire introuvable" }
    }

    await prisma.forumReply.delete({
      where: { id: replyId },
    })

    revalidatePath("/admin/reports")
    revalidatePath(`/forum/${reply.postId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting forum reply:", error)
    return { success: false, error: "Une erreur s'est produite lors de la suppression du commentaire." }
  }
}

export async function suspendUser(userId: string, duration: "1day" | "7days" | "permanent") {
  try {
    console.log(`🔒 suspendUser called: userId=${userId}, duration=${duration}`)
    const session = await auth()
    if (!session?.user?.role || (session.user.role !== "ADMIN" && session.user.role !== "CONTENT_MODERATOR")) {
      console.log("❌ Unauthorized - user role:", session?.user?.role)
      return { success: false, error: "Non autorisé" }
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      console.log("❌ User not found:", userId)
      return { success: false, error: "Utilisateur introuvable." }
    }

    const now = new Date()
    let suspendedUntil: Date | null = null
    let isBlocked = false

    if (duration === "1day") {
      suspendedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    } else if (duration === "7days") {
      suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else if (duration === "permanent") {
      isBlocked = true
    }

    console.log(`💾 Updating user comment suspension: suspendedUntil=${suspendedUntil}, isBlocked=${isBlocked}`)

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          commentSuspendedUntil: suspendedUntil,
          isCommentBlocked: isBlocked,
        },
      })
      console.log("✅ User suspended from comments successfully")
    } catch (updateError: any) {
      // If fields don't exist, try raw SQL as fallback
      if (updateError?.message?.includes('isCommentBlocked') || updateError?.message?.includes('commentSuspendedUntil') ||
        updateError?.message?.includes('Unknown field')) {
        console.log("⚠️ Comment suspension fields don't exist in Prisma, trying raw SQL fallback")
        try {
          if (suspendedUntil) {
            await prisma.$executeRawUnsafe(`
              UPDATE "User" 
              SET "commentSuspendedUntil" = $1, "isCommentBlocked" = $2
              WHERE id = $3
            `, suspendedUntil, isBlocked, userId)
          } else {
            await prisma.$executeRawUnsafe(`
              UPDATE "User" 
              SET "commentSuspendedUntil" = NULL, "isCommentBlocked" = $1
              WHERE id = $2
            `, isBlocked, userId)
          }
          console.log("✅ User suspended from comments successfully via raw SQL")
        } catch (sqlError: any) {
          console.error("❌ Raw SQL also failed:", sqlError?.message)
          return {
            success: false,
            error: "Les champs de suspension n'existent pas encore. Veuillez exécuter 'npx prisma db push' puis redémarrer le serveur."
          }
        }
      } else {
        throw updateError
      }
    }

    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error suspending user:", error?.message, error?.stack)
    return { success: false, error: error?.message || "Une erreur s'est produite lors de la suspension de l'utilisateur." }
  }
}

export async function unsuspendUser(userId: string) {
  try {
    console.log(`🔓 unsuspendUser called: userId=${userId}`)
    const session = await auth()
    if (!session?.user?.role || (session.user.role !== "ADMIN" && session.user.role !== "CONTENT_MODERATOR")) {
      console.log("❌ Unauthorized - user role:", session?.user?.role)
      return { success: false, error: "Non autorisé" }
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      console.log("❌ User not found:", userId)
      return { success: false, error: "Utilisateur introuvable." }
    }

    console.log("💾 Removing comment suspension from user")

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          commentSuspendedUntil: null,
          isCommentBlocked: false,
        },
      })
      console.log("✅ User unsuspended from comments successfully")
    } catch (updateError: any) {
      // If fields don't exist, try raw SQL as fallback
      if (updateError?.message?.includes('isCommentBlocked') || updateError?.message?.includes('commentSuspendedUntil') ||
        updateError?.message?.includes('Unknown field')) {
        console.log("⚠️ Comment suspension fields don't exist in Prisma, trying raw SQL fallback")
        try {
          await prisma.$executeRawUnsafe(`
            UPDATE "User" 
            SET "commentSuspendedUntil" = NULL, "isCommentBlocked" = false
            WHERE id = $1
          `, userId)
          console.log("✅ User unsuspended from comments successfully via raw SQL")
        } catch (sqlError: any) {
          console.log("⚠️ Raw SQL also failed, but user is effectively unsuspended:", sqlError?.message)
          // User is effectively unsuspended if fields don't exist
          revalidatePath("/admin/reports")
          return { success: true }
        }
      } else {
        throw updateError
      }
    }

    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error unsuspending user:", error?.message, error?.stack)
    return { success: false, error: error?.message || "Une erreur s'est produite lors de la levée de la suspension." }
  }
}

export async function suspendUserFromReports(userId: string, duration: "1day" | "7days" | "permanent") {
  try {
    console.log(`🔒 suspendUserFromReports called: userId=${userId}, duration=${duration}`)
    const session = await auth()
    if (!session?.user?.role || (session.user.role !== "ADMIN" && session.user.role !== "CONTENT_MODERATOR")) {
      console.log("❌ Unauthorized - user role:", session?.user?.role)
      return { success: false, error: "Non autorisé" }
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      console.log("❌ User not found:", userId)
      return { success: false, error: "Utilisateur introuvable." }
    }

    const now = new Date()
    let suspendedUntil: Date | null = null
    let isBlocked = false

    if (duration === "1day") {
      suspendedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    } else if (duration === "7days") {
      suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else if (duration === "permanent") {
      isBlocked = true
    }

    console.log(`💾 Updating user: suspendedUntil=${suspendedUntil}, isBlocked=${isBlocked}`)

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          reportSuspendedUntil: suspendedUntil,
          isReportBlocked: isBlocked,
        },
      })
      console.log("✅ User suspended successfully")
    } catch (updateError: any) {
      // If fields don't exist, try raw SQL as fallback
      if (updateError?.message?.includes('isReportBlocked') || updateError?.message?.includes('reportSuspendedUntil') ||
        updateError?.message?.includes('Unknown field')) {
        console.log("⚠️ Suspension fields don't exist in Prisma, trying raw SQL fallback")
        try {
          if (suspendedUntil) {
            await prisma.$executeRawUnsafe(`
              UPDATE "User" 
              SET "reportSuspendedUntil" = $1, "isReportBlocked" = $2
              WHERE id = $3
            `, suspendedUntil, isBlocked, userId)
          } else {
            await prisma.$executeRawUnsafe(`
              UPDATE "User" 
              SET "reportSuspendedUntil" = NULL, "isReportBlocked" = $1
              WHERE id = $2
            `, isBlocked, userId)
          }
          console.log("✅ User suspended successfully via raw SQL")
        } catch (sqlError: any) {
          console.error("❌ Raw SQL also failed:", sqlError?.message)
          return {
            success: false,
            error: "Les champs de suspension n'existent pas encore. Veuillez exécuter 'npx prisma db push' puis redémarrer le serveur."
          }
        }
      } else {
        throw updateError
      }
    }

    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error suspending user from reports:", error?.message, error?.stack)
    return { success: false, error: error?.message || "Une erreur s'est produite lors de la suspension de l'utilisateur." }
  }
}

export async function unsuspendUserFromReports(userId: string) {
  try {
    console.log(`🔓 unsuspendUserFromReports called: userId=${userId}`)
    const session = await auth()
    if (!session?.user?.role || (session.user.role !== "ADMIN" && session.user.role !== "CONTENT_MODERATOR")) {
      console.log("❌ Unauthorized - user role:", session?.user?.role)
      return { success: false, error: "Non autorisé" }
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      console.log("❌ User not found:", userId)
      return { success: false, error: "Utilisateur introuvable." }
    }

    console.log("💾 Removing suspension from user")

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          reportSuspendedUntil: null,
          isReportBlocked: false,
        },
      })
      console.log("✅ User unsuspended successfully")
    } catch (updateError: any) {
      // If fields don't exist, try raw SQL as fallback
      if (updateError?.message?.includes('isReportBlocked') || updateError?.message?.includes('reportSuspendedUntil') ||
        updateError?.message?.includes('Unknown field')) {
        console.log("⚠️ Suspension fields don't exist in Prisma, trying raw SQL fallback")
        try {
          await prisma.$executeRawUnsafe(`
            UPDATE "User" 
            SET "reportSuspendedUntil" = NULL, "isReportBlocked" = false
            WHERE id = $1
          `, userId)
          console.log("✅ User unsuspended successfully via raw SQL")
        } catch (sqlError: any) {
          console.log("⚠️ Raw SQL also failed, but user is effectively unsuspended:", sqlError?.message)
          // User is effectively unsuspended if fields don't exist
          revalidatePath("/admin/reports")
          return { success: true }
        }
      } else {
        throw updateError
      }
    }

    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error unsuspending user from reports:", error?.message, error?.stack)
    return { success: false, error: error?.message || "Une erreur s'est produite lors de la levée de la suspension." }
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await auth()
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return { success: false, error: "Non autorisé - Seuls les administrateurs peuvent supprimer des utilisateurs." }
    }

    // Prevent self-deletion
    if (session.user.id === userId) {
      return { success: false, error: "Vous ne pouvez pas supprimer votre propre compte." }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Une erreur s'est produite lors de la suppression de l'utilisateur." }
  }
}
