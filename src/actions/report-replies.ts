"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { canAccessAdmin } from "@/lib/roles"

export async function replyToReport(reportId: string, content: string) {
  try {
    const session = await auth()
    if (!session?.user?.id || !canAccessAdmin(session.user.role || "STUDENT")) {
      return { success: false, error: "Non autorisé" }
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { type: true, userId: true },
    })

    if (!report) {
      return { success: false, error: "Message introuvable" }
    }

    if (report.type !== "CONTACT") {
      return { success: false, error: "Vous ne pouvez répondre qu'aux messages de contact" }
    }

    // Try to create the reply using raw SQL as fallback if model doesn't exist
    let reply;
    try {
      console.log("💬 Creating reply to report:", reportId, "by user:", session.user.id)

      // First try with Prisma model - check if it exists and is a function
      const prismaAny = prisma as any;
      if (prismaAny.reportReply && typeof prismaAny.reportReply.create === 'function') {
        console.log("✅ Using Prisma ReportReply model")
        reply = await prismaAny.reportReply.create({
          data: {
            reportId,
            content: content.trim(),
            repliedById: session.user.id,
          },
          include: {
            repliedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        })
        console.log("✅ Reply created via Prisma model:", reply.id)
      } else {
        console.log("⚠️ Prisma ReportReply model not available, using raw SQL fallback")
        // Fallback to raw SQL if model not available
        // First, try to create the table if it doesn't exist
        try {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ReportReply" (
              "id" TEXT NOT NULL,
              "reportId" TEXT NOT NULL,
              "content" TEXT NOT NULL,
              "repliedById" TEXT NOT NULL,
              "isRead" BOOLEAN NOT NULL DEFAULT false,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP(3) NOT NULL,
              CONSTRAINT "ReportReply_pkey" PRIMARY KEY ("id")
            );
          `);

          // Try to add foreign keys (ignore if they already exist)
          try {
            await prisma.$executeRawUnsafe(`
              DO $$ 
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint 
                  WHERE conname = 'ReportReply_reportId_fkey'
                ) THEN
                  ALTER TABLE "ReportReply" 
                  ADD CONSTRAINT "ReportReply_reportId_fkey" 
                  FOREIGN KEY ("reportId") 
                  REFERENCES "Report"("id") 
                  ON DELETE CASCADE 
                  ON UPDATE CASCADE;
                END IF;
              END $$;
            `);
          } catch (fkError: any) {
            // Ignore if constraint already exists
            console.warn('Could not add reportId foreign key:', fkError.message);
          }

          try {
            await prisma.$executeRawUnsafe(`
              DO $$ 
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint 
                  WHERE conname = 'ReportReply_repliedById_fkey'
                ) THEN
                  ALTER TABLE "ReportReply" 
                  ADD CONSTRAINT "ReportReply_repliedById_fkey" 
                  FOREIGN KEY ("repliedById") 
                  REFERENCES "User"("id") 
                  ON DELETE RESTRICT 
                  ON UPDATE CASCADE;
                END IF;
              END $$;
            `);
          } catch (fkError: any) {
            // Ignore if constraint already exists
            console.warn('Could not add repliedById foreign key:', fkError.message);
          }
        } catch (createError: any) {
          // If table creation fails, it might already exist or there's a permission issue
          if (!createError.message?.includes('already exists')) {
            console.warn('Could not create ReportReply table:', createError.message);
          }
        }

        const { randomBytes } = await import('crypto')
        const replyId = `reply_${Date.now()}_${randomBytes(4).toString('hex')}`

        console.log("💾 Inserting reply into ReportReply table with ID:", replyId)
        await prisma.$executeRaw`
          INSERT INTO "ReportReply" (id, "reportId", content, "repliedById", "isRead", "createdAt", "updatedAt")
          VALUES (${replyId}, ${reportId}, ${content.trim()}, ${session.user.id}, false, NOW(), NOW())
        `
        console.log("✅ Reply inserted successfully")

        // Fetch the created reply with user info
        console.log("🔍 Fetching created reply from database")
        const result = await prisma.$queryRaw<Array<{
          id: string
          content: string
          createdAt: Date
          repliedBy_name: string | null
          repliedBy_email: string | null
        }>>`
          SELECT 
            rr.id,
            rr.content,
            rr."createdAt",
            u.name as "repliedBy_name",
            u.email as "repliedBy_email"
          FROM "ReportReply" rr
          JOIN "User" u ON rr."repliedById" = u.id
          WHERE rr.id = ${replyId}
        `

        console.log("📋 Query result:", result?.length || 0, "rows")

        if (result && result.length > 0) {
          const createdReply = result[0]
          reply = {
            id: createdReply.id,
            content: createdReply.content,
            createdAt: createdReply.createdAt,
            repliedBy: {
              name: createdReply.repliedBy_name,
              email: createdReply.repliedBy_email,
            },
          }
          console.log("✅ Reply fetched successfully:", reply.id)
        } else {
          console.log("❌ Failed to fetch created reply - result is empty")
          throw new Error("Failed to create reply")
        }
      }
    } catch (error: any) {
      console.error("Error creating reply:", error)
      // Check if error is due to missing model or table
      if (error.message?.includes('reportReply') || error.message?.includes('ReportReply') || error.message?.includes('does not exist') || error.message?.includes('n\'existe pas') || error.message?.includes('relation') || error.code === 'P2001' || error.code === 'P2010' || error.code === '42P01') {
        return { success: false, error: "La table ReportReply n'existe pas dans la base de données. Veuillez exécuter 'npx prisma db push' puis redémarrer le serveur." }
      }
      return { success: false, error: error.message || "Une erreur s'est produite lors de l'envoi de la réponse." }
    }

    console.log("✅ Reply created successfully:", {
      replyId: reply?.id,
      reportId,
      repliedById: session.user.id,
      content: content.substring(0, 50),
    })

    revalidatePath("/admin/reports")
    return { success: true, data: reply }
  } catch (error: any) {
    console.error("❌ Error replying to report:", error?.message, error?.stack)
    return { success: false, error: "Une erreur s'est produite lors de l'envoi de la réponse." }
  }
}

export async function getReportReplies(reportId: string) {
  try {
    // Try to use the model - if it doesn't exist, Prisma will throw an error
    const replies = await prisma.reportReply.findMany({
      where: { reportId },
      orderBy: { createdAt: "asc" },
      include: {
        repliedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
    return { success: true, data: replies }
  } catch (error: any) {
    // If model doesn't exist or relation is missing, return empty array silently
    if (error?.code === 'P2001' || error?.code === 'P2010' || error?.code === '42P01' ||
      error?.message?.includes('reportReply') || error?.message?.includes('ReportReply') ||
      error?.message?.includes('does not exist') || error?.message?.includes('n\'existe pas')) {
      return { success: true, data: [] }
    }
    console.error("Error fetching report replies:", error)
    return { success: false, error: "Une erreur s'est produite lors de la récupération des réponses." }
  }
}

export async function getUserUnreadReplies(userId: string) {
  try {
    console.log("🔔 getUserUnreadReplies called for userId:", userId)

    // Get all reports from this user
    const userReports = await prisma.report.findMany({
      where: { userId },
      select: { id: true, type: true, title: true },
    })

    console.log(`📋 Found ${userReports.length} reports for user:`, userReports.map(r => ({ id: r.id, type: r.type, title: r.title })))

    const reportIds = userReports.map((r) => r.id)

    if (reportIds.length === 0) {
      console.log("⚠️ No reports found for user, returning empty array")
      return { success: true, data: [] }
    }

    // Get all unread replies for these reports
    try {
      console.log("🔍 Searching for unread replies for reportIds:", reportIds)

      // First, try using Prisma model if available
      const prismaAny = prisma as any
      if (prismaAny.reportReply && typeof prismaAny.reportReply.findMany === 'function') {
        console.log("✅ Using Prisma ReportReply model to fetch replies")
        const unreadReplies = await prismaAny.reportReply.findMany({
          where: {
            reportId: { in: reportIds },
            isRead: false,
          },
          orderBy: { createdAt: "desc" },
          include: {
            report: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
            repliedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        })

        console.log(`✅ Found ${unreadReplies.length} unread replies via Prisma:`, unreadReplies.map((r: any) => ({ id: r.id, reportId: r.reportId, content: r.content?.substring(0, 50) })))
        return { success: true, data: unreadReplies }
      } else {
        // Fallback to raw SQL if model doesn't exist
        console.log("⚠️ Prisma ReportReply model not available, trying raw SQL")

        // Check if table exists first
        try {
          const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'ReportReply'
            ) as exists
          `

          if (!tableExists[0]?.exists) {
            console.log("⚠️ ReportReply table doesn't exist yet")
            return { success: true, data: [] }
          }

          // Use parameterized query for safety
          const placeholders = reportIds.map((_, i) => `$${i + 1}`).join(', ')
          const query = `
            SELECT 
              rr.id,
              rr."reportId",
              rr.content,
              rr."isRead",
              rr."createdAt",
              u.name as "repliedBy_name",
              u.email as "repliedBy_email",
              r.id as "report_id",
              r.title as "report_title",
              r.type as "report_type"
            FROM "ReportReply" rr
            JOIN "User" u ON rr."repliedById" = u.id
            JOIN "Report" r ON rr."reportId" = r.id
            WHERE rr."reportId" IN (${placeholders})
              AND rr."isRead" = false
            ORDER BY rr."createdAt" DESC
          `

          const result = await prisma.$queryRawUnsafe<Array<{
            id: string
            reportId: string
            content: string
            isRead: boolean
            createdAt: Date
            repliedBy_name: string | null
            repliedBy_email: string | null
            report_id: string
            report_title: string
            report_type: string
          }>>(query, ...reportIds)

          const unreadReplies = result.map(row => ({
            id: row.id,
            reportId: row.reportId,
            content: row.content,
            isRead: row.isRead,
            createdAt: row.createdAt,
            repliedBy: {
              name: row.repliedBy_name,
              email: row.repliedBy_email,
            },
            report: {
              id: row.report_id,
              title: row.report_title,
              type: row.report_type,
            },
          }))

          console.log(`✅ Found ${unreadReplies.length} unread replies via raw SQL:`, unreadReplies.map(r => ({ id: r.id, reportId: r.reportId, content: r.content.substring(0, 50) })))
          return { success: true, data: unreadReplies }
        } catch (sqlError: any) {
          console.log("❌ Error with raw SQL query:", sqlError?.message)
          if (sqlError?.message?.includes('does not exist') || sqlError?.message?.includes('relation') || sqlError?.code === '42P01') {
            console.log("⚠️ ReportReply table doesn't exist")
            return { success: true, data: [] }
          }
          throw sqlError
        }
      }
    } catch (modelError: any) {
      console.log("❌ Error fetching replies:", modelError?.message, modelError?.code)
      // If ReportReply model doesn't exist yet or relation is missing, return empty array silently
      if (modelError?.code === 'P2001' || modelError?.code === 'P2010' || modelError?.code === '42P01' ||
        modelError?.message?.includes('reportReply') || modelError?.message?.includes('ReportReply') ||
        modelError?.message?.includes('does not exist') || modelError?.message?.includes('n\'existe pas') ||
        modelError?.message?.includes('relation') || modelError?.code === '42P01') {
        console.log("⚠️ ReportReply model/table doesn't exist yet")
        return { success: true, data: [] }
      }
      console.error("Error fetching unread replies:", modelError)
      return { success: true, data: [] }
    }
  } catch (error: any) {
    console.error("❌ Error in getUserUnreadReplies:", error?.message, error?.stack)
    return { success: false, error: "Une erreur s'est produite lors de la récupération des notifications." }
  }
}

export async function markReplyAsRead(replyId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Non autorisé" }
    }

    if (!('reportReply' in prisma)) {
      return { success: false, error: "Le modèle de réponse n'est pas disponible." }
    }

    await prisma.reportReply.update({
      where: { id: replyId },
      data: { isRead: true },
    })

    return { success: true }
  } catch (error) {
    console.error("Error marking reply as read:", error)
    return { success: false, error: "Une erreur s'est produite." }
  }
}

export async function deleteReply(replyId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Non autorisé" }
    }

    const reply = await prisma.reportReply.findUnique({
      where: { id: replyId },
      include: {
        report: {
          select: { userId: true },
        },
      },
    })

    if (!reply) {
      return { success: false, error: "Réponse introuvable" }
    }

    // User can only delete replies to their own reports
    if (reply.report.userId !== session.user.id) {
      return { success: false, error: "Non autorisé" }
    }

    await prisma.reportReply.delete({
      where: { id: replyId },
    })

    return { success: true }
  } catch (error: any) {
    // If model doesn't exist, return success (no-op)
    if (error?.code === 'P2001' || error?.code === 'P2010' || error?.code === '42P01' ||
      error?.message?.includes('reportReply') || error?.message?.includes('ReportReply') ||
      error?.message?.includes('does not exist')) {
      return { success: true }
    }
    console.error("Error deleting reply:", error)
    return { success: false, error: "Une erreur s'est produite lors de la suppression." }
  }
}

export async function deleteReport(reportId: string) {
  try {
    console.log("🗑️ deleteReport called for reportId:", reportId)
    const session = await auth()
    if (!session?.user?.id || !canAccessAdmin(session.user.role || "STUDENT")) {
      console.log("❌ Unauthorized - user role:", session?.user?.role)
      return { success: false, error: "Non autorisé" }
    }

    // First, try to delete associated replies if ReportReply table exists
    try {
      const prismaAny = prisma as any
      if (prismaAny.reportReply && typeof prismaAny.reportReply.deleteMany === 'function') {
        console.log("🗑️ Deleting associated replies...")
        await prismaAny.reportReply.deleteMany({
          where: { reportId },
        })
        console.log("✅ Replies deleted successfully")
      } else {
        // Try raw SQL
        try {
          await prisma.$executeRawUnsafe(`
            DELETE FROM "ReportReply" WHERE "reportId" = $1
          `, reportId)
          console.log("✅ Replies deleted via raw SQL")
        } catch (sqlError: any) {
          if (!sqlError?.message?.includes('does not exist') && sqlError?.code !== '42P01') {
            console.log("⚠️ Could not delete replies (table may not exist):", sqlError?.message)
          }
        }
      }
    } catch (replyError: any) {
      console.log("⚠️ Could not delete replies:", replyError?.message)
      // Continue anyway - replies might not exist
    }

    // Now delete the report
    console.log("🗑️ Deleting report...")
    await prisma.report.delete({
      where: { id: reportId },
    })

    console.log("✅ Report deleted successfully")
    revalidatePath("/admin/reports")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error deleting report:", error?.message, error?.code)
    if (error?.code === 'P2003') {
      return { success: false, error: "Impossible de supprimer ce rapport car il contient des réponses. Supprimez d'abord les réponses." }
    }
    return { success: false, error: error?.message || "Une erreur s'est produite lors de la suppression." }
  }
}

export async function clearInbox() {
  try {
    console.log("🧹 clearInbox called - deleting ALL reports from inbox")
    const session = await auth()
    if (!session?.user?.id || !canAccessAdmin(session.user.role || "STUDENT")) {
      console.log("❌ Unauthorized - user role:", session?.user?.role)
      return { success: false, error: "Non autorisé" }
    }

    // First, get ALL report IDs (not just resolved ones)
    const allReports = await prisma.report.findMany({
      select: { id: true },
    })

    const reportIds = allReports.map(r => r.id)
    console.log(`📋 Found ${reportIds.length} total reports to delete`)

    // Delete associated replies first if ReportReply table exists
    if (reportIds.length > 0) {
      try {
        const prismaAny = prisma as any
        if (prismaAny.reportReply && typeof prismaAny.reportReply.deleteMany === 'function') {
          console.log("🗑️ Deleting all associated replies...")
          const replyResult = await prismaAny.reportReply.deleteMany({
            where: { reportId: { in: reportIds } },
          })
          console.log(`✅ Deleted ${replyResult.count} replies successfully`)
        } else {
          // Try raw SQL
          try {
            const placeholders = reportIds.map((_, i) => `$${i + 1}`).join(', ')
            const replyResult = await prisma.$executeRawUnsafe<{ count: number }>(`
              DELETE FROM "ReportReply" WHERE "reportId" IN (${placeholders})
            `, ...reportIds)
            console.log("✅ Replies deleted via raw SQL")
          } catch (sqlError: any) {
            if (!sqlError?.message?.includes('does not exist') && sqlError?.code !== '42P01') {
              console.log("⚠️ Could not delete replies (table may not exist):", sqlError?.message)
            }
          }
        }
      } catch (replyError: any) {
        console.log("⚠️ Could not delete replies:", replyError?.message)
        // Continue anyway - replies might not exist
      }
    }

    // Now delete ALL reports (not just resolved ones)
    console.log("🗑️ Deleting ALL reports from inbox...")
    const result = await prisma.report.deleteMany({})

    console.log(`✅ Deleted ${result.count} total reports from inbox`)
    revalidatePath("/admin/reports")
    return { success: true, count: result.count }
  } catch (error: any) {
    console.error("❌ Error clearing inbox:", error?.message, error?.code)
    return { success: false, error: error?.message || "Une erreur s'est produite lors du nettoyage." }
  }
}
