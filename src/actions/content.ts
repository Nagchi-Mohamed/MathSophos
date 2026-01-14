"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { EducationalLevel, Stream, LessonStatus } from "@prisma/client"

export interface CreateLessonData {
  title: string
  content: string
  level: EducationalLevel
  stream: Stream
  subject: string
  status: LessonStatus
  semester: number
  order?: number
  educationalStreamId?: string
  moduleId?: string
}

export async function createLesson(data: CreateLessonData) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    // For SUPERIEUR (UNIVERSITY), we don't use semester in filters
    const isUniversity = data.level === EducationalLevel.UNIVERSITY

    let newOrder = data.order

    // 1. Determine order if not provided (Auto-increment)
    if (newOrder === undefined) {
      const whereMax: any = {
        level: data.level,
        stream: data.stream,
      }
      if (!isUniversity) {
        whereMax.semester = data.semester
      }
      if (data.educationalStreamId) {
        whereMax.educationalStreamId = data.educationalStreamId
      }
      if (data.moduleId) {
        whereMax.moduleId = data.moduleId
      }

      const lastLesson = await prisma.lesson.findFirst({
        where: whereMax,
        orderBy: { order: 'desc' },
        select: { order: true }
      })

      newOrder = (lastLesson?.order || 0) + 1
    } else {
      // 2. Only shift existing lessons if a specific order was requested
      const where: any = {
        level: data.level,
        stream: data.stream,
        order: {
          gte: newOrder
        }
      }
      // Only add semester filter for non-UNIVERSITY levels
      if (!isUniversity) {
        where.semester = data.semester
      }
      if (data.educationalStreamId) {
        where.educationalStreamId = data.educationalStreamId
      }
      if (data.moduleId) {
        where.moduleId = data.moduleId
      }

      // Prisma types are not recognizing the `order` field for updateMany in this
      // environment. Use a raw SQL update to increment the stored order values
      // atomically instead.
      {
        const params: any[] = [data.level, data.stream]
        let sql = `UPDATE "Lesson" SET "order" = "order" + 1 WHERE "level" = $1 AND "stream" = $2`
        let paramIndex = 3
        // Only add semester filter for non-UNIVERSITY levels
        if (!isUniversity) {
          sql += ` AND "semester" = $${paramIndex}`
          params.push(data.semester)
          paramIndex++
        }
        sql += ` AND "order" >= $${paramIndex}`
        params.push(newOrder)
        paramIndex++
        if (data.educationalStreamId) {
          sql += ` AND "educationalStreamId" = $${paramIndex}`
          params.push(data.educationalStreamId)
          paramIndex++
        }
        if (data.moduleId) {
          sql += ` AND "moduleId" = $${paramIndex}`
          params.push(data.moduleId)
          paramIndex++
        }
        await prisma.$executeRawUnsafe(sql, ...params)
      }
    }

    // 2. Create the new lesson
    const lesson = await prisma.lesson.create({
      data: {
        titleFr: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
        contentFr: data.content,
        level: data.level,
        stream: data.stream,
        category: data.subject,
        status: data.status,
        semester: isUniversity ? 1 : data.semester, // For UNIVERSITY, use default 1 (not used for filtering)
        order: newOrder,
        educationalStreamId: data.educationalStreamId,
        moduleId: data.moduleId,
      },
    })

    revalidatePath("/admin/lessons")
    return { success: true, data: lesson }
  } catch (error: any) {
    console.error("Error creating lesson:", error)
    return { success: false, error: error.message }
  }
}

export async function getLessons() {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { updatedAt: "desc" },
    })
    return { success: true, data: lessons }
  } catch (error: any) {
    // Log error message only to avoid source map issues
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error fetching lessons:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export interface LessonFilters {
  level?: EducationalLevel;
  stream?: Stream;
  educationalStreamId?: string;
  moduleId?: string;
  semester?: number;
  category?: string;
  search?: string;
}

export async function getPaginatedLessons(limit: number = 12, offset: number = 0, filters?: LessonFilters) {
  try {
    const where: any = {};

    if (filters?.level) where.level = filters.level;
    if (filters?.stream) where.stream = filters.stream;
    if (filters?.educationalStreamId) where.educationalStreamId = filters.educationalStreamId;
    if (filters?.moduleId) where.moduleId = filters.moduleId;
    if (filters?.semester) where.semester = filters.semester;
    if (filters?.category) where.category = filters.category;
    if (filters?.search) {
      where.OR = [
        { titleFr: { contains: filters.search, mode: "insensitive" } },
        { contentFr: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        orderBy: [
          { order: "asc" }, // Order by manual order first
          { updatedAt: "desc" }
        ],
        skip: offset,
        take: limit,
      }),
      prisma.lesson.count({ where }),
    ]);
    return { success: true, data: { lessons, total } };
  } catch (error: any) {
    // Log error message only to avoid source map issues
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error fetching paginated lessons:", errorMessage);
    return { success: false, error: errorMessage };
  }
}



export async function renameLesson(id: string, newTitle: string) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    // Generate a new slug from the title
    const slug = newTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        titleFr: newTitle,
        slug: `${slug}-${Date.now()}`,
      },
    })

    revalidatePath("/admin/lessons")
    return { success: true, data: lesson }
  } catch (error: any) {
    console.error("Error renaming lesson:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteLesson(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Seul un administrateur peut supprimer une leçon" }
  }

  try {
    await prisma.lesson.delete({ where: { id } })
    revalidatePath("/admin/lessons")
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || "Unknown error";
    return { success: false, error: errorMessage }
  }
}

// Simple in-memory cache for lesson lookups
const lessonCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export async function getLessonBySlug(slug: string) {
  try {
    // Check cache first
    const cached = lessonCache.get(slug);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, data: cached.data };
    }

    const lesson = await prisma.lesson.findUnique({
      where: { slug },
      select: {
        id: true,
        titleFr: true,
        titleEn: true,
        slug: true,
        contentFr: true,
        contentEn: true,
        level: true,
        stream: true,
        semester: true,
        order: true,
        category: true,
        status: true,
        courseId: true,
        createdById: true,
        aiContextId: true,
        imagesUsed: true,
        createdAt: true,
        updatedAt: true,
        educationalStreamId: true,
        moduleId: true,
      }
    });

    // Update cache
    if (lesson) {
      lessonCache.set(slug, { data: lesson, timestamp: Date.now() });
    }

    return { success: true, data: lesson };
  } catch (error: any) {
    // Log error message only to avoid source map issues
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error fetching lesson:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function getLessonById(id: string) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            name: true,
          },
        },
        educationalStream: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return { success: true, data: lesson };
  } catch (error: any) {
    // Log error message only to avoid source map issues
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error fetching lesson:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function updateLesson(id: string, data: Partial<CreateLessonData>) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    const updateData: any = {};
    if (data.title !== undefined) updateData.titleFr = data.title;
    if (data.content !== undefined) updateData.contentFr = data.content;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.stream !== undefined) updateData.stream = data.stream;
    if (data.subject !== undefined) updateData.category = data.subject;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.semester !== undefined) updateData.semester = data.semester;
    if (data.order !== undefined) updateData.order = data.order;

    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/lessons");
    revalidatePath(`/lessons/${lesson.slug}`);
    return { success: true, data: lesson };
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error updating lesson:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================
// Exercise Actions
// ============================================

export interface CreateExerciseData {
  problemTextFr: string
  solutionFr: string
  hints: string[]
  lessonId?: string
  exerciseType?: "QCM" | "FREE_RESPONSE" | null
  qcmOptions?: string[]
  correctAnswer?: string | null
  correctionFileUrl?: string
}

export async function createExercise(data: CreateExerciseData) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    const exercise = await prisma.exercise.create({
      data: {
        problemTextFr: data.problemTextFr,
        slug: "ex-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
        solutionFr: data.solutionFr,
        hints: data.hints,
        lessonId: data.lessonId || null,
        exerciseType: data.exerciseType || null,
        qcmOptions: data.qcmOptions || [],
        correctAnswer: data.correctAnswer || null,
      },
    })
    revalidatePath("/admin/exercises")
    revalidatePath("/exercises")
    return { success: true, data: exercise }
  } catch (error: any) {
    // Log error message only to avoid source map issues
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error creating exercise:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export interface ExerciseFilters {
  level?: EducationalLevel;
  stream?: Stream;
  semester?: number;
  category?: string;
  search?: string;
}

export async function getPaginatedExercises(limit: number = 12, offset: number = 0, filters?: ExerciseFilters) {
  try {
    const where: any = {};

    // Filter by lesson properties if provided
    if (filters?.level || filters?.stream || filters?.semester || filters?.category) {
      where.lesson = {};
      if (filters.level) where.lesson.level = filters.level;
      if (filters.stream) where.lesson.stream = filters.stream;
      if (filters.semester) where.lesson.semester = filters.semester;
      if (filters.category) where.lesson.category = filters.category;
    }

    // Search in problem text or solution
    if (filters?.search) {
      where.OR = [
        { problemTextFr: { contains: filters.search, mode: "insensitive" } },
        { solutionFr: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [exercises, total] = await Promise.all([
      // Force rebuild
      prisma.exercise.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          lesson: {
            select: {
              titleFr: true,
              titleEn: true,
              slug: true,
              level: true,
              stream: true,
              semester: true,
              category: true,
            },
          },
        },
      }),
      prisma.exercise.count({ where }),
    ])
    return { success: true, data: { exercises, total } }
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error fetching paginated exercises:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Simple in-memory cache for exercise lookups
const exerciseCache = new Map<string, { data: any; timestamp: number }>()

export async function getExerciseById(id: string) {
  try {
    // Check cache first
    const cached = exerciseCache.get(id)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, data: cached.data }
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            titleFr: true,
            titleEn: true,
            slug: true,
            level: true,
            stream: true,
            semester: true,
            category: true,
          },
        },
      },
    })

    // Update cache
    if (exercise) {
      exerciseCache.set(id, { data: exercise, timestamp: Date.now() })
    }

    return { success: true, data: exercise }
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error fetching exercise:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function deleteExercise(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Seul un administrateur peut supprimer un exercice" }
  }

  try {
    await prisma.exercise.delete({ where: { id } })
    revalidatePath("/admin/exercises")
    revalidatePath("/exercises")
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error deleting exercise:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function updateExercise(id: string, data: Partial<CreateExerciseData>) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { success: false, error: "Non autorisé" }
  }

  try {
    const updateData: any = {}
    if (data.problemTextFr !== undefined) updateData.problemTextFr = data.problemTextFr
    if (data.solutionFr !== undefined) updateData.solutionFr = data.solutionFr
    if (data.hints !== undefined) updateData.hints = data.hints
    if (data.lessonId !== undefined) updateData.lessonId = data.lessonId
    if (data.exerciseType !== undefined) updateData.exerciseType = data.exerciseType
    if (data.qcmOptions !== undefined) updateData.qcmOptions = data.qcmOptions
    if (data.correctAnswer !== undefined) updateData.correctAnswer = data.correctAnswer
    if (data.correctionFileUrl !== undefined) updateData.correctionFileUrl = data.correctionFileUrl

    const exercise = await prisma.exercise.update({
      where: { id },
      data: updateData,
    })
    revalidatePath("/admin/exercises")
    revalidatePath("/exercises")
    // Clear cache
    exerciseCache.delete(id)
    return { success: true, data: exercise }
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error updating exercise:", errorMessage)
    return { success: false, error: errorMessage }
  }
}
