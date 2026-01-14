import { FicheBuilder } from "@/components/fiches/fiche-builder"
import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getFiche } from "@/actions/fiches"
import { prisma } from "@/lib/prisma"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditFichePage({ params }: PageProps) {
  const session = await auth()
  if (!session) redirect("/auth/login")

  const { id } = await params
  const fiche = await getFiche(id)

  if (!fiche) {
    notFound()
  }

  // Check ownership: Only Owner or Admin can edit
  const canEdit = session.user.role === 'ADMIN' || fiche.userId === session.user.id

  if (!canEdit) {
    // If unauthorized, redirect to list
    redirect("/teacher/fiches")
  }

  // Fetch help video (same as create page)
  const helpVideo = await prisma.platformVideo.findFirst({
    where: {
      entityType: "system-help",
      entityId: "fiche-creation-help"
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <FicheBuilder
    initialData={fiche}
    isEditing={true}
    userRole={session.user.role}
    helpVideo={helpVideo}
  />
}
