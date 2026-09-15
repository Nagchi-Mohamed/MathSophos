import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { EducationalLevel } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé - Veuillez vous connecter" }, { status: 401 })
    }

    const data = await req.json()

    // 1. Ensure a valid user exists in DB to prevent foreign key errors
    let validUserId: string | null = null
    
    if (session.user.id) {
      const userById = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      }).catch(() => null)
      if (userById) validUserId = userById.id
    }

    if (!validUserId && session.user.email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      }).catch(() => null)
      if (userByEmail) validUserId = userByEmail.id
    }

    if (!validUserId) {
      return NextResponse.json({ 
        success: false, 
        error: "Utilisateur introuvable dans la base de données. Veuillez vous reconnecter." 
      }, { status: 403 })
    }

    // 2. Validate grade level enum
    const validGradeLevel = data.gradeLevel && Object.values(EducationalLevel).includes(data.gradeLevel)
      ? data.gradeLevel
      : EducationalLevel.LYCEE_TC

    // 3. Parse content cleanly
    const parsedContent = typeof data.content === 'string'
      ? JSON.parse(data.content)
      : (data.content || [])

    // 4. Create pedagogical sheet
    const fiche = await prisma.pedagogicalSheet.create({
      data: {
        userId: validUserId,
        teacherName: data.teacherName || session.user.name || "Mohamed Nagchi",
        schoolName: data.schoolName || "Lycée Hassan I",
        gradeLevel: validGradeLevel,
        stream: data.stream || "Tronc Commun Scientifique et Technique (TCSF)",
        subject: data.subject || "Mathématiques",
        schoolYear: data.schoolYear || "2025 – 2026",
        textbook: data.textbook || "Najah",
        semester: data.semester ? Number(data.semester) : 1,
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

    return NextResponse.json({ success: true, id: fiche.id })
  } catch (error: any) {
    console.error("[POST /api/fiches Error]:", error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || "Erreur serveur lors de la création de la fiche" 
    }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 })
    }

    const { id, ...data } = await req.json()
    if (!id) {
      return NextResponse.json({ success: false, error: "Identifiant de fiche manquant" }, { status: 400 })
    }

    const existing = await prisma.pedagogicalSheet.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: "Fiche introuvable" }, { status: 404 })
    }

    // Check ownership
    const isOwner = existing.userId === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    
    let isOwnerByEmail = false
    if (!isOwner && session.user.email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      }).catch(() => null)
      if (userByEmail && userByEmail.id === existing.userId) {
        isOwnerByEmail = true
      }
    }

    if (!isOwner && !isAdmin && !isOwnerByEmail) {
      return NextResponse.json({ success: false, error: "Non autorisé à modifier cette fiche" }, { status: 403 })
    }

    const parsedContent = data.content !== undefined
      ? (typeof data.content === 'string' ? JSON.parse(data.content) : data.content)
      : undefined

    const validGradeLevel = data.gradeLevel && Object.values(EducationalLevel).includes(data.gradeLevel)
      ? data.gradeLevel
      : undefined

    const updated = await prisma.pedagogicalSheet.update({
      where: { id },
      data: {
        teacherName: data.teacherName,
        schoolName: data.schoolName,
        gradeLevel: validGradeLevel,
        stream: data.stream,
        subject: data.subject,
        schoolYear: data.schoolYear,
        textbook: data.textbook,
        semester: data.semester ? Number(data.semester) : undefined,
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

    return NextResponse.json({ success: true, id: updated.id })
  } catch (error: any) {
    console.error("[PUT /api/fiches Error]:", error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || "Erreur serveur lors de la mise à jour" 
    }, { status: 500 })
  }
}
