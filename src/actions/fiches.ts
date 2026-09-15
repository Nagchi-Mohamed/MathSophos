'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EducationalLevel } from "@prisma/client"

export type FicheContentStep = {
  id: string
  type: string
  duration?: string
  content: string
  observations?: string
}

export type FicheSession = {
  id: string
  title: string
  duration: string
  demarche: string
  traceEcrite: string
  evaluation: string
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
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Non autorisé - Veuillez vous connecter" }
    }

    const parsedContent = typeof data.content === 'string'
      ? JSON.parse(data.content)
      : (data.content || [])

    const validGradeLevel = Object.values(EducationalLevel).includes(data.gradeLevel)
      ? data.gradeLevel
      : EducationalLevel.LYCEE_TC

    const fiche = await prisma.pedagogicalSheet.create({
      data: {
        userId: session.user.id,
        teacherName: data.teacherName || session.user.name || "Mohamed Nagchi",
        schoolName: data.schoolName || "Lycée Hassan I",
        gradeLevel: validGradeLevel,
        stream: data.stream || "Tronc Commun Scientifique et Technique (TCSF)",
        subject: data.subject || "Mathématiques",
        schoolYear: data.schoolYear || "2025 – 2026",
        textbook: data.textbook || "Najah",
        semester: data.semester || 1,
        lessonTitle: data.lessonTitle || "Fiche sans titre",
        duration: data.duration || "7 heures",
        capacities: data.capacities || "",
        programContents: data.programContents || "",
        pedagogicalGuidelines: data.pedagogicalGuidelines || "",
        prerequisites: data.prerequisites || "",
        extensions: data.extensions || "",
        didacticTools: data.didacticTools || "",
        bilanSequence: data.bilanSequence || "",
        difficultiesObserved: data.difficultiesObserved || "",
        remediationProposed: data.remediationProposed || "",
        observations: data.observations || "",
        content: parsedContent,
        status: "DRAFT",
      },
    })

    revalidatePath("/teacher/fiches")
    return { success: true, id: fiche.id }
  } catch (error: any) {
    console.error("[createFiche Error]:", error)
    return { success: false, error: error.message || "Erreur lors de la création de la fiche" }
  }
}

export async function updateFiche(id: string, data: Partial<CreateFicheInput>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Non autorisé" }
    }

    const existing = await prisma.pedagogicalSheet.findUnique({
      where: { id },
    })

    if (!existing) return { success: false, error: "Fiche introuvable" }
    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Non autorisé à modifier cette fiche" }
    }

    const parsedContent = data.content !== undefined
      ? (typeof data.content === 'string' ? JSON.parse(data.content) : data.content)
      : undefined

    const validGradeLevel = data.gradeLevel && Object.values(EducationalLevel).includes(data.gradeLevel)
      ? data.gradeLevel
      : undefined

    const fiche = await prisma.pedagogicalSheet.update({
      where: { id },
      data: {
        teacherName: data.teacherName,
        schoolName: data.schoolName,
        gradeLevel: validGradeLevel,
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
        content: parsedContent,
      },
    })

    revalidatePath("/teacher/fiches")
    revalidatePath(`/teacher/fiches/${id}/edit`)
    return { success: true, id: fiche.id }
  } catch (error: any) {
    console.error("[updateFiche Error]:", error)
    return { success: false, error: error.message || "Erreur lors de la mise à jour de la fiche" }
  }
}

export async function duplicateFiche(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Non autorisé" }
    }

    const sourceFiche = await prisma.pedagogicalSheet.findUnique({
      where: { id },
    })

    if (!sourceFiche) {
      return { success: false, error: "Fiche source introuvable" }
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
    return { success: true, id: newFiche.id }
  } catch (error: any) {
    console.error("[duplicateFiche Error]:", error)
    return { success: false, error: error.message || "Erreur lors de la duplication" }
  }
}

export async function getFiche(id: string) {
  try {
    const fiche = await prisma.pedagogicalSheet.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    })

    return fiche ? JSON.parse(JSON.stringify(fiche)) : null
  } catch (error) {
    console.error("[getFiche Error]:", error)
    return null
  }
}

export async function getUserFiches() {
  try {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user) return []

    if (user.role === 'ADMIN' || user.role === 'EDITOR') {
      const list = await prisma.pedagogicalSheet.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } }
      })
      return JSON.parse(JSON.stringify(list))
    }

    if (user.role === 'TEACHER') {
      const list = await prisma.pedagogicalSheet.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { isPublic: true }
          ]
        },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } }
      })
      return JSON.parse(JSON.stringify(list))
    }

    return []
  } catch (error) {
    console.error("[getUserFiches Error]:", error)
    return []
  }
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
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Non autorisé" }

    const existing = await prisma.pedagogicalSheet.findUnique({
      where: { id },
    })

    if (!existing) return { success: false, error: "Fiche introuvable" }
    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Non autorisé à supprimer cette fiche" }
    }

    await prisma.pedagogicalSheet.delete({
      where: { id },
    })

    revalidatePath("/teacher/fiches")
    revalidatePath("/admin/fiches")
    return { success: true }
  } catch (error: any) {
    console.error("[deleteFiche Error]:", error)
    return { success: false, error: error.message || "Erreur lors de la suppression" }
  }
}

export async function toggleFichePublish(id: string) {
  try {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") return { success: false, error: "Non autorisé" }

    const fiche = await prisma.pedagogicalSheet.findUnique({ where: { id } })
    if (!fiche) return { success: false, error: "Fiche introuvable" }

    await prisma.pedagogicalSheet.update({
      where: { id },
      data: { isPublic: !fiche.isPublic }
    })

    revalidatePath("/admin/fiches")
    revalidatePath("/fiches")
    revalidatePath("/teacher/fiches")
    return { success: true }
  } catch (error: any) {
    console.error("[toggleFichePublish Error]:", error)
    return { success: false, error: error.message || "Erreur lors de la mise à jour de la publication" }
  }
}

export async function getPublicFiches() {
  try {
    const list = await prisma.pedagogicalSheet.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } }
    })
    return JSON.parse(JSON.stringify(list))
  } catch (error) {
    console.error("[getPublicFiches Error]:", error)
    return []
  }
}
