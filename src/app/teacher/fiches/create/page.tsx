import { FicheBuilder } from "@/components/fiches/fiche-builder"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function CreateFichePage() {
  const session = await auth()
  if (!session) {
    redirect("/auth/login")
  }

  // Optionally check for "TEACHER" or "ADMIN" role
  // if (session.user.role === "STUDENT") redirect("/")

  // Fetch help video
  const helpVideo = await prisma.platformVideo.findFirst({
    where: {
      entityType: "system-help",
      entityId: "fiche-creation-help"
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <FicheBuilder userRole={session.user.role} helpVideo={helpVideo} />
}
