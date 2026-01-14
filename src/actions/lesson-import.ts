"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { EducationalLevel, Stream, LessonStatus, Prisma } from "@prisma/client"
import { EDUCATION_SYSTEM } from "@/lib/education-system"

export type ImportLessonsParams = {
  sourceStreamId: string
  targetStreamId: string
  lessonIds: string[]
  targetModuleId?: string
}

export type StreamInfo = {
  id: string
  name: string
  slug: string
  level: EducationalLevel
  description: string | null
}

export type LessonImportCandidate = {
  id: string
  titleFr: string
  chaptersCount: number
  seriesCount: number
  exercisesCount: number
  order: number
}

// Helper to parse complex ID
function parseStreamId(id: string) {
  if (id.startsWith('ENUM:')) {
    const parts = id.split(':')
    const level = parts[1] as EducationalLevel
    const stream = parts[2] === 'NONE' ? undefined : (parts[2] as Stream)

    return {
      type: 'ENUM' as const,
      level,
      stream
    }
  }
  return {
    type: 'DB' as const,
    id
  }
}

// Check authorization
async function checkAuth() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    throw new Error("Non autorisé")
  }
  return session.user
}

/**
 * Fetch available streams for the source selection
 */
export async function getAvailableStreams(): Promise<{ success: boolean; data?: StreamInfo[]; error?: string }> {
  try {
    await checkAuth()

    // 1. Fetch DB Streams (Supérieur)
    const dbStreams = await prisma.educationalStream.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        level: true,
        description: true
      }
    })

    const combinedStreams: StreamInfo[] = [...dbStreams]

    // 2. Add Enum Streams (Lycée / Collège)
    // Traverse EDUCATION_SYSTEM to build options
    const system = EDUCATION_SYSTEM as any
    for (const cycleKey of ['COLLEGE', 'LYCEE']) {
      const cycle = system[cycleKey]
      if (!cycle) continue

      for (const level of cycle.levels) {
        if (level.streams) {
          for (const stream of level.streams) {
            combinedStreams.push({
              id: `ENUM:${level.value}:${stream.value}`,
              name: `${level.label} - ${stream.label}`,
              slug: `${level.value}-${stream.value}`.toLowerCase(),
              level: level.value,
              description: cycle.label
            })
          }
        } else {
          // No streams, just level (e.g. College)
          combinedStreams.push({
            id: `ENUM:${level.value}:NONE`,
            name: `${level.label}`,
            slug: level.value.toLowerCase(),
            level: level.value,
            description: cycle.label
          })
        }
      }
    }

    return { success: true, data: combinedStreams }
  } catch (error: any) {
    console.error("Error fetching available streams:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetch lessons from a stream that can be imported
 */
export async function getStreamLessons(streamId: string): Promise<{ success: boolean; data?: LessonImportCandidate[]; error?: string }> {
  try {
    await checkAuth()

    const parsed = parseStreamId(streamId)
    let whereClause: any = {}

    if (parsed.type === 'ENUM') {
      whereClause = {
        level: parsed.level,
        stream: parsed.stream || 'NONE'
      }
    } else {
      whereClause = {
        educationalStreamId: parsed.id
      }
    }

    const lessons = await prisma.lesson.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
      select: {
        id: true,
        titleFr: true,
        order: true,
        _count: {
          select: {
            chapters: true,
            series: true,
            exercises: true
          }
        },
        series: {
          select: {
            _count: {
              select: { exercises: true }
            }
          }
        }
      }
    })

    const processedLessons = lessons.map(lesson => {
      const seriesExercisesCount = lesson.series.reduce((acc, s) => acc + s._count.exercises, 0)
      return {
        id: lesson.id,
        titleFr: lesson.titleFr,
        order: lesson.order,
        chaptersCount: lesson._count.chapters,
        seriesCount: lesson._count.series,
        exercisesCount: lesson._count.exercises + seriesExercisesCount
      }
    })

    return { success: true, data: processedLessons }
  } catch (error: any) {
    console.error("Error fetching stream lessons:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate a unique slug for the new entry
 */
async function generateUniqueSlug(modelName: 'lesson' | 'chapter' | 'series' | 'exercise', baseSlug: string, suffix?: string): Promise<string> {
  const cleanBaseSlug = baseSlug
    .toLowerCase()
    .normalize('NFD') // decompose potential chars
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // keep only alphanumeric and dashes
    .replace(/^-+|-+$/g, '') // trim dashes

  let slug = suffix ? `${cleanBaseSlug}-${suffix}` : `${cleanBaseSlug}-${Date.now().toString().slice(-6)}`
  let counter = 1

  // Checking function depends on model
  const checkExists = async (s: string) => {
    // @ts-ignore - dynamic model access
    const count = await prisma[modelName].count({ where: { slug: s } })
    return count > 0
  }

  while (await checkExists(slug)) {
    slug = suffix ? `${cleanBaseSlug}-${suffix}-${counter}` : `${cleanBaseSlug}-${Date.now().toString().slice(-6)}-${counter}`
    counter++
  }

  return slug
}

/**
 * Deep copy a lesson with all its related content
 */
async function copyLesson(
  sourceLessonId: string,
  targetStreamId: string,
  targetModuleId: string | undefined,
  targetSlugSuffix: string,
  user: any
) {
  // 1. Fetch full source lesson
  const sourceLesson = await prisma.lesson.findUnique({
    where: { id: sourceLessonId },
    include: {
      chapters: true,
      series: {
        include: { exercises: true }
      },
      exercises: true // Standalone exercises
    }
  })

  if (!sourceLesson) return { success: false, error: "Leçon source introuvable" }

  // 2. Determine target properties
  const parsedTarget = parseStreamId(targetStreamId)

  let targetLevel: EducationalLevel
  let targetStreamEnum: Stream
  let targetEduStreamId: string | null = null

  if (parsedTarget.type === 'DB') {
    const targetStream = await prisma.educationalStream.findUnique({
      where: { id: parsedTarget.id }
    })
    if (!targetStream) return { success: false, error: "Filière cible introuvable" }

    targetLevel = targetStream.level
    targetStreamEnum = 'NONE'
    targetEduStreamId = parsedTarget.id
  } else {
    targetLevel = parsedTarget.level
    targetStreamEnum = parsedTarget.stream || 'NONE'
    targetEduStreamId = null
  }

  // 3. Create new Lesson
  const newLessonSlug = await generateUniqueSlug('lesson', sourceLesson.titleFr, targetSlugSuffix)

  const createdLesson = await prisma.lesson.create({
    data: {
      titleFr: sourceLesson.titleFr,
      titleEn: sourceLesson.titleEn,
      slug: newLessonSlug,
      contentFr: sourceLesson.contentFr,
      contentEn: sourceLesson.contentEn,
      level: targetLevel,
      stream: targetStreamEnum,
      semester: sourceLesson.semester,
      order: sourceLesson.order,
      category: sourceLesson.category,
      status: sourceLesson.status,
      educationalStreamId: targetEduStreamId,
      moduleId: targetModuleId,
      createdById: user.id,
      imagesUsed: sourceLesson.imagesUsed,
      courseId: sourceLesson.courseId,
      aiContextId: sourceLesson.aiContextId
    }
  })

  // 4. Copy Chapters
  for (const chapter of sourceLesson.chapters) {
    const newChapterSlug = await generateUniqueSlug('chapter', chapter.titleFr, newLessonSlug)

    await prisma.chapter.create({
      data: {
        titleFr: chapter.titleFr,
        titleEn: chapter.titleEn,
        slug: newChapterSlug,
        contentFr: chapter.contentFr,
        contentEn: chapter.contentEn,
        chapterNumber: chapter.chapterNumber,
        order: chapter.order,
        status: chapter.status,
        lessonId: createdLesson.id,
        createdById: user.id,
        imagesUsed: chapter.imagesUsed
      }
    })
  }

  // 5. Copy Series
  for (const series of sourceLesson.series) {
    const newSeriesSlug = series.slug
      ? await generateUniqueSlug('series', series.title, newLessonSlug)
      : await generateUniqueSlug('series', series.title, `s-${Date.now()}`)

    const createdSeries = await prisma.series.create({
      data: {
        title: series.title,
        description: series.description,
        slug: newSeriesSlug,
        cycle: series.cycle,
        level: targetLevel,
        stream: targetStreamEnum,
        semester: series.semester,
        public: series.public,
        lessonId: createdLesson.id,
        educationalStreamId: targetEduStreamId,
        imagesUsed: series.imagesUsed
      }
    })

    // Copy Exercises in Series
    for (const exercise of series.exercises) {
      const newExerciseSlug = await generateUniqueSlug('exercise', `${newLessonSlug}-ex-s`)

      await prisma.exercise.create({
        data: {
          slug: newExerciseSlug,
          problemTextFr: exercise.problemTextFr,
          problemTextEn: exercise.problemTextEn,
          solutionFr: exercise.solutionFr,
          solutionEn: exercise.solutionEn,
          hints: exercise.hints,
          order: exercise.order,
          seriesId: createdSeries.id,
          exerciseType: exercise.exerciseType,
          qcmOptions: exercise.qcmOptions,
          correctAnswer: exercise.correctAnswer
        }
      })
    }
  }

  // 6. Copy Standalone Exercises
  for (const exercise of sourceLesson.exercises) {
    if (!exercise.seriesId) {
      const newExerciseSlug = await generateUniqueSlug('exercise', `${newLessonSlug}-ex-l`)

      await prisma.exercise.create({
        data: {
          slug: newExerciseSlug,
          problemTextFr: exercise.problemTextFr,
          problemTextEn: exercise.problemTextEn,
          solutionFr: exercise.solutionFr,
          solutionEn: exercise.solutionEn,
          hints: exercise.hints,
          order: exercise.order,
          lessonId: createdLesson.id,
          exerciseType: exercise.exerciseType,
          qcmOptions: exercise.qcmOptions,
          correctAnswer: exercise.correctAnswer
        }
      })
    }
  }

  return { success: true, lesson: createdLesson }
}

/**
 * Main Action: Import multiple lessons
 */
export async function importLessonsToStream(params: ImportLessonsParams) {
  try {
    const user = await checkAuth()

    const { sourceStreamId, targetStreamId, lessonIds, targetModuleId } = params

    if (!sourceStreamId || !targetStreamId || !lessonIds.length) {
      return { success: false, error: "Paramètres manquants" }
    }

    if (sourceStreamId === targetStreamId) {
      return { success: false, error: "La source et la destination doivent être différentes" }
    }

    // Determine target suffix for slugs
    let targetSlugSuffix = 'imported'
    const parsedTarget = parseStreamId(targetStreamId)

    if (parsedTarget.type === 'DB') {
      const targetStream = await prisma.educationalStream.findUnique({
        where: { id: parsedTarget.id },
        select: { slug: true }
      })
      if (!targetStream) return { success: false, error: "Filière cible introuvable" }
      targetSlugSuffix = targetStream.slug
    } else {
      targetSlugSuffix = parsedTarget.stream
        ? `${parsedTarget.level}-${parsedTarget.stream}`.toLowerCase()
        : parsedTarget.level.toLowerCase()
    }

    // Cleanup suffix
    targetSlugSuffix = targetSlugSuffix.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    for (const lessonId of lessonIds) {
      try {
        await copyLesson(
          lessonId,
          targetStreamId,
          targetModuleId,
          targetSlugSuffix,
          user
        )
        successCount++
      } catch (e: any) {
        console.error(`Failed to copy lesson ${lessonId}:`, e)
        failureCount++
        errors.push(e.message)
      }
    }

    revalidatePath("/admin/lessons")
    revalidatePath("/admin/content")

    return {
      success: true,
      data: {
        imported: successCount,
        failed: failureCount,
        errors
      }
    }

  } catch (error: any) {
    console.error("Error importing lessons:", error)
    return { success: false, error: error.message }
  }
}
