"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const AnnouncementSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
  isActive: z.boolean().default(true),
})

export async function createAnnouncement(data: { id?: string; title: string; content: string; isActive?: boolean }) {
  try {
    const validated = AnnouncementSchema.parse({ title: data.title, content: data.content, isActive: data.isActive })
    await prisma.announcement.create({
      data: {
        ...validated,
        id: data.id, // Optional: if provided, use it
      },
    })
    revalidatePath("/")
    revalidatePath("/admin/announcements")
    return { success: true }
  } catch (error) {
    return { error: "Erreur lors de la création de l'annonce" }
  }
}

export async function updateAnnouncement(id: string, data: { title?: string; content?: string; isActive?: boolean }) {
  try {
    await prisma.announcement.update({
      where: { id },
      data,
    })
    revalidatePath("/")
    revalidatePath("/admin/announcements")
    return { success: true }
  } catch (error) {
    return { error: "Erreur lors de la mise à jour de l'annonce" }
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    await prisma.announcement.delete({
      where: { id },
    })
    revalidatePath("/")
    revalidatePath("/admin/announcements")
    return { success: true }
  } catch (error) {
    return { error: "Erreur lors de la suppression de l'annonce" }
  }
}

export async function getPublicAnnouncements() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })
    return { data: announcements }
  } catch (error) {
    return { error: "Erreur lors de la récupération des annonces" }
  }
}

export async function getAllAnnouncements() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    })
    return { data: announcements }
  } catch (error) {
    return { error: "Erreur lors de la récupération des annonces" }
  }
}
