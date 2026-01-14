'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EducationalLevel, LessonStatus } from "@prisma/client"
import { redirect } from "next/navigation"

export type FicheContentStep = {
  id: string
  type: string // "Activité", "Définition", etc.
  duration?: string
  content: string // HTML/LaTeX
  observations?: string
}

export type CreateFicheInput = {
  teacherName: string
  schoolName: string
  gradeLevel: EducationalLevel
  stream?: string
  semester?: number
  lessonTitle?: string
  duration: string
  pedagogicalGuidelines?: string
  prerequisites?: string
  extensions?: string
  didacticTools?: string
  content: FicheContentStep[]
}

export async function createFiche(data: CreateFicheInput) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const fiche = await prisma.pedagogicalSheet.create({
    data: {
      userId: session.user.id,
      teacherName: data.teacherName,
      schoolName: data.schoolName,
      gradeLevel: data.gradeLevel,
      stream: data.stream,
      semester: data.semester || 1,
      lessonTitle: data.lessonTitle,
      duration: data.duration,
      pedagogicalGuidelines: data.pedagogicalGuidelines,
      prerequisites: data.prerequisites,
      extensions: data.extensions,
      didacticTools: data.didacticTools,
      content: JSON.stringify(data.content), // Store as stringified JSON if needed, or straight valid JSON
      status: "DRAFT",
    },
  })

  revalidatePath("/teacher/fiches")
  return fiche
}

export async function updateFiche(id: string, data: Partial<CreateFicheInput>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check ownership
  const existing = await prisma.pedagogicalSheet.findUnique({
    where: { id },
  })

  if (!existing) throw new Error("Not found")
  if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const fiche = await prisma.pedagogicalSheet.update({
    where: { id },
    data: {
      teacherName: data.teacherName,
      schoolName: data.schoolName,
      gradeLevel: data.gradeLevel,
      stream: data.stream,
      semester: data.semester,
      duration: data.duration,
      lessonTitle: data.lessonTitle,
      pedagogicalGuidelines: data.pedagogicalGuidelines,
      prerequisites: data.prerequisites,
      extensions: data.extensions,
      didacticTools: data.didacticTools,
      content: data.content ? JSON.stringify(data.content) : undefined,
    },
  })

  revalidatePath("/teacher/fiches")
  revalidatePath(`/teacher/fiches/${id}/edit`)
  return fiche
}

export async function duplicateFiche(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const sourceFiche = await prisma.pedagogicalSheet.findUnique({
    where: { id },
  })

  if (!sourceFiche) {
    throw new Error("Fiche not found")
  }

  const newTitle = sourceFiche.lessonTitle ? `${sourceFiche.lessonTitle} (Copie)` : "Fiche (Copie)"

  const newFiche = await prisma.pedagogicalSheet.create({
    data: {
      userId: session.user.id,
      teacherName: session.user.name || sourceFiche.teacherName, // Default to current user's name
      schoolName: sourceFiche.schoolName, // Keep source school or leave blank? User asked to "edit and put his name", keeping school seems convenient for now.
      gradeLevel: sourceFiche.gradeLevel,
      stream: sourceFiche.stream,
      semester: sourceFiche.semester,
      lessonTitle: newTitle,
      duration: sourceFiche.duration,
      pedagogicalGuidelines: sourceFiche.pedagogicalGuidelines,
      prerequisites: sourceFiche.prerequisites,
      extensions: sourceFiche.extensions,
      didacticTools: sourceFiche.didacticTools,
      content: sourceFiche.content as any, // Copy the JSON content
      status: "DRAFT",
      isPublic: false, // Private copy
    },
  })

  revalidatePath("/teacher/fiches")
  return newFiche.id
}

export async function getFiche(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    // Public fiches could be allowed? For now, restrict.
    // Allow if public?
  }

  const fiche = await prisma.pedagogicalSheet.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } }
  })

  return fiche
}

export async function getUserFiches() {
  const session = await auth()
  if (!session?.user?.id) return []

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!user) return []

  // Admins and Editors see ALL fiches
  if (user.role === 'ADMIN' || user.role === 'EDITOR') {
    return await prisma.pedagogicalSheet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, role: true } } }
    })
  }

  // Teachers see: their own fiches + public fiches (published by admin)
  if (user.role === 'TEACHER') {
    return await prisma.pedagogicalSheet.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // Own fiches
          { isPublic: true }            // Admin-published fiches
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, role: true } } }
    })
  }

  // Students should not access fiches at all
  return []
}

export async function getAllFiches() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  return await prisma.pedagogicalSheet.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true }
  })
}

export async function deleteFiche(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await prisma.pedagogicalSheet.findUnique({
    where: { id },
  })

  if (!existing) throw new Error("Not found")
  if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  await prisma.pedagogicalSheet.delete({
    where: { id },
  })

  revalidatePath("/teacher/fiches")
  revalidatePath("/admin/fiches")
}

export async function toggleFichePublish(id: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const fiche = await prisma.pedagogicalSheet.findUnique({ where: { id } })
  if (!fiche) throw new Error("Not found")

  await prisma.pedagogicalSheet.update({
    where: { id },
    data: { isPublic: !fiche.isPublic }
  })

  revalidatePath("/admin/fiches")
  revalidatePath("/fiches")
  revalidatePath("/teacher/fiches")
}

export async function getPublicFiches() {
  return await prisma.pedagogicalSheet.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } }
  })
}
