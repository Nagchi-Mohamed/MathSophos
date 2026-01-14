// Client-safe types for lessons
// These mirror the Prisma types but use our safe enums

import { EducationalLevel, Stream, LessonStatus } from "@/lib/enums"

export interface LessonData {
  id: string
  titleFr: string
  titleEn?: string | null
  slug: string
  contentFr?: string | null
  contentEn?: string | null
  level: EducationalLevel
  stream: Stream
  semester: number
  order: number
  category?: string | null
  status: LessonStatus
  courseId?: string | null
  createdById?: string | null
  aiContextId?: string | null
  imagesUsed?: string[]
  createdAt: Date
  updatedAt: Date
  educationalStreamId?: string | null
  moduleId?: string | null
  module?: {
    id: string
    name: string
  } | null
  educationalStream?: {
    id: string
    name: string
  } | null
}
