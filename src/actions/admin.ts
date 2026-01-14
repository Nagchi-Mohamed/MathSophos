"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { UserRole, LessonStatus } from "@prisma/client"
import { canManageUsers, canModifyUserRole, canManageContent, canDeleteContent } from "@/lib/roles"

// Helper to check if current user has admin access
async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.role || !canManageUsers(session.user.role)) {
    throw new Error("Unauthorized: Admin access required")
  }
  return session.user
}

// Helper to check if current user can manage content
async function checkContentManager() {
  const session = await auth()
  if (!session?.user?.role || !canManageContent(session.user.role)) {
    throw new Error("Unauthorized: Content management access required")
  }
  return session.user
}

export async function updateUserRole(userId: string, role: UserRole) {
  try {
    const currentUser = await checkAdmin()

    // Get target user to check their current role
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!targetUser) {
      return { success: false, message: "User not found" }
    }

    // Check if current user can modify target user's role
    if (!canModifyUserRole(currentUser.role as UserRole, targetUser.role)) {
      return { success: false, message: "You cannot modify this user's role" }
    }

    // Check if current user can assign the new role
    if (!canModifyUserRole(currentUser.role as UserRole, role)) {
      return { success: false, message: "You cannot assign this role" }
    }

    await db.user.update({
      where: { id: userId },
      data: { role },
    })

    revalidatePath("/admin/users")
    return { success: true, message: "User role updated successfully" }
  } catch (error) {
    console.error("Failed to update user role:", error)
    return { success: false, message: error instanceof Error ? error.message : "Failed to update user role" }
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await checkAdmin()

    // Only OWNER and ADMIN can delete users
    if (!canDeleteContent(currentUser.role as UserRole)) {
      return { success: false, message: "You don't have permission to delete users" }
    }

    await db.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/users")
    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return { success: false, message: "Failed to delete user" }
  }
}

// Content Management Actions
export async function createLesson(data: {
  title: string
  slug: string
  content: string
  level: string
  category: string
  status: LessonStatus
  semester: number
}) {
  try {
    await checkContentManager()

    await db.lesson.create({
      data: {
        titleFr: data.title,
        slug: data.slug,
        contentFr: data.content,
        category: data.category,
        status: data.status as LessonStatus,
        level: data.level as any,
        semester: data.semester,
      },
    })

    revalidatePath("/admin/content")
    return { success: true, message: "Lesson created successfully" }
  } catch (error) {
    console.error("Failed to create lesson:", error)
    return { success: false, message: "Failed to create lesson" }
  }
}

export async function updateLesson(
  id: string,
  data: {
    title: string
    slug: string
    content: string
    level: string
    category: string
    status: LessonStatus
    semester: number
  }
) {
  try {
    await checkContentManager()

    await db.lesson.update({
      where: { id },
      data: {
        titleFr: data.title,
        slug: data.slug,
        contentFr: data.content,
        category: data.category,
        status: data.status as LessonStatus,
        level: data.level as any,
        semester: data.semester,
      },
    })

    // Cascade update to associated Series
    if (data.semester) {
      await db.series.updateMany({
        where: { lessonId: id },
        data: { semester: data.semester },
      })
    }

    revalidatePath("/admin/content")
    return { success: true, message: "Lesson updated successfully" }
  } catch (error) {
    console.error("Failed to update lesson:", error)
    return { success: false, message: "Failed to update lesson" }
  }
}

export async function deleteLesson(id: string) {
  try {
    const currentUser = await checkAdmin()

    // Only OWNER and ADMIN can delete content
    if (!canDeleteContent(currentUser.role as UserRole)) {
      return { success: false, message: "You don't have permission to delete content" }
    }

    await db.lesson.delete({
      where: { id },
    })

    revalidatePath("/admin/content")
    return { success: true, message: "Lesson deleted successfully" }
  } catch (error) {
    console.error("Failed to delete lesson:", error)
    return { success: false, message: "Failed to delete lesson" }
  }
}

export async function getAdminStats() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Use Promise.allSettled to handle individual query failures gracefully
    const [
      totalUsersResult,
      totalLessonsResult,
      totalExercisesResult,
      totalForumPostsResult,
      recentUsersResult
    ] = await Promise.allSettled([
      db.user.count(),
      db.lesson.count({ where: { status: "PUBLISHED" } }),
      db.exercise.count(),
      db.forumPost.count(),
      db.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      })
    ])

    // Extract values from settled promises, defaulting to 0 on failure
    const totalUsers = totalUsersResult.status === 'fulfilled' ? totalUsersResult.value : 0;
    const totalLessons = totalLessonsResult.status === 'fulfilled' ? totalLessonsResult.value : 0;
    const totalExercises = totalExercisesResult.status === 'fulfilled' ? totalExercisesResult.value : 0;
    const totalForumPosts = totalForumPostsResult.status === 'fulfilled' ? totalForumPostsResult.value : 0;
    const recentUsers = recentUsersResult.status === 'fulfilled' ? recentUsersResult.value : 0;

    // Log any failures for debugging
    if (totalUsersResult.status === 'rejected') console.error("Failed to fetch totalUsers:", totalUsersResult.reason);
    if (totalLessonsResult.status === 'rejected') console.error("Failed to fetch totalLessons:", totalLessonsResult.reason);
    if (totalExercisesResult.status === 'rejected') console.error("Failed to fetch totalExercises:", totalExercisesResult.reason);
    if (totalForumPostsResult.status === 'rejected') console.error("Failed to fetch totalForumPosts:", totalForumPostsResult.reason);
    if (recentUsersResult.status === 'rejected') console.error("Failed to fetch recentUsers:", recentUsersResult.reason);

    return {
      success: true,
      data: {
        totalUsers,
        totalLessons,
        totalExercises,
        totalForumPosts,
        recentUsers
      }
    }
  } catch (error: any) {
    console.error("Error fetching admin stats:", error)
    return {
      success: false,
      error: error.message || "Database connection timeout. Please check your database connection."
    }
  }
}

export async function getRecentForumPosts(limit: number = 5) {
  try {
    const posts = await db.forumPost.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        },
        _count: {
          select: { replies: true }
        }
      }
    })
    return { success: true, data: posts }
  } catch (error: any) {
    console.error("Error fetching recent forum posts:", error)
    return {
      success: false,
      error: error.message || "Database connection timeout. Please check your database connection.",
      data: [] // Return empty array on error
    }
  }
}

export async function getPaginatedUsers(limit: number = 20, offset: number = 0) {
  try {
    const [users, total] = await Promise.all([
      db.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { createdLessons: true, forumPosts: true }
          }
        }
      }),
      db.user.count()
    ])
    return { success: true, data: { users, total } }
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return { success: false, error: error.message }
  }
}
