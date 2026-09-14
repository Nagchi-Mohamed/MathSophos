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

export type FicheSession = {
  id: string
  title: string // e.g. "Séance 1 — Ensemble N et Parité"
  duration: string // e.g. "2 h"
  demarche: string // Démarche & Activités (HTML/LaTeX)
  traceEcrite: string // Trace écrite / Contenu du cours (HTML/LaTeX)
  evaluation: string // Évaluation / Application (HTML/LaTeX)
}

export type CreateFicheInput = {
  teacherName: string
  schoolName: string
  gradeLevel: EducationalLevel
  stream?: string
  subject?: string
  schoolYear?: string
  textbook?: string
  semester?: number
  lessonTitle?: string
  duration: string
  capacities?: string
  programContents?: string
  pedagogicalGuidelines?: string
  prerequisites?: string
  extensions?: string
  didacticTools?: string
  bilanSequence?: string
  difficultiesObserved?: string
  remediationProposed?: string
  observations?: string
  content: FicheSession[] | FicheContentStep[] | any
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
      subject: data.subject || "Mathématiques",
      schoolYear: data.schoolYear || "2025 – 2026",
      textbook: data.textbook || "Najah",
      semester: data.semester || 1,
      lessonTitle: data.lessonTitle,
      duration: data.duration,
      capacities: data.capacities,
      programContents: data.programContents,
      pedagogicalGuidelines: data.pedagogicalGuidelines,
      prerequisites: data.prerequisites,
      extensions: data.extensions,
      didacticTools: data.didacticTools,
      bilanSequence: data.bilanSequence,
      difficultiesObserved: data.difficultiesObserved,
      remediationProposed: data.remediationProposed,
      observations: data.observations,
      content: JSON.stringify(data.content),
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
      subject: data.subject,
      schoolYear: data.schoolYear,
      textbook: data.textbook,
      semester: data.semester,
      duration: data.duration,
      lessonTitle: data.lessonTitle,
      capacities: data.capacities,
      programContents: data.programContents,
      pedagogicalGuidelines: data.pedagogicalGuidelines,
      prerequisites: data.prerequisites,
      extensions: data.extensions,
      didacticTools: data.didacticTools,
      bilanSequence: data.bilanSequence,
      difficultiesObserved: data.difficultiesObserved,
      remediationProposed: data.remediationProposed,
      observations: data.observations,
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
      teacherName: session.user.name || sourceFiche.teacherName,
      schoolName: sourceFiche.schoolName,
      gradeLevel: sourceFiche.gradeLevel,
      stream: sourceFiche.stream,
      subject: sourceFiche.subject,
      schoolYear: sourceFiche.schoolYear,
      textbook: sourceFiche.textbook,
      semester: sourceFiche.semester,
      lessonTitle: newTitle,
      duration: sourceFiche.duration,
      capacities: sourceFiche.capacities,
      programContents: sourceFiche.programContents,
      pedagogicalGuidelines: sourceFiche.pedagogicalGuidelines,
      prerequisites: sourceFiche.prerequisites,
      extensions: sourceFiche.extensions,
      didacticTools: sourceFiche.didacticTools,
      bilanSequence: sourceFiche.bilanSequence,
      difficultiesObserved: sourceFiche.difficultiesObserved,
      remediationProposed: sourceFiche.remediationProposed,
      observations: sourceFiche.observations,
      content: sourceFiche.content as any,
      status: "DRAFT",
      isPublic: false,
    },
  })

  revalidatePath("/teacher/fiches")
  return newFiche.id
}

export async function getFiche(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    // Public fiches could be allowed? For now, restrict.
  }

  const fiche = await prisma.pedagogicalSheet.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } }
  })

  return fiche ? JSON.parse(JSON.stringify(fiche)) : null
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
    const list = await prisma.pedagogicalSheet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, role: true } } }
    })
    return JSON.parse(JSON.stringify(list))
  }

  // Teachers see: their own fiches + public fiches (published by admin)
  if (user.role === 'TEACHER') {
    const list = await prisma.pedagogicalSheet.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // Own fiches
          { isPublic: true }            // Admin-published fiches
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, role: true } } }
    })
    return JSON.parse(JSON.stringify(list))
  }

  // Students should not access fiches at all
  return []
}

export async function getAllFiches() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const list = await prisma.pedagogicalSheet.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true }
  })
  return JSON.parse(JSON.stringify(list))
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
  const list = await prisma.pedagogicalSheet.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } }
  })
  return JSON.parse(JSON.stringify(list))
}
