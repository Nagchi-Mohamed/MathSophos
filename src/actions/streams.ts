"use server"

import { prisma } from "@/lib/prisma"
import { EducationalLevel } from "@prisma/client"
import { revalidatePath } from "next/cache"

export type CreateStreamParams = {
  name: string
  level: EducationalLevel
  semesterCount: number
  description?: string
}

export async function createStream(params: CreateStreamParams) {
  try {
    // Generate a slug from the name
    const slug = params.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

    const stream = await prisma.educationalStream.create({
      data: {
        name: params.name,
        slug,
        level: params.level,
        semesterCount: params.level === EducationalLevel.UNIVERSITY ? 0 : params.semesterCount,
        description: params.description,
      },
    })

    revalidatePath("/admin/lessons")
    revalidatePath("/admin/exercises")
    return { success: true, data: stream }
  } catch (error: any) {
    console.error("Error creating stream:", error)
    return { success: false, error: error.message }
  }
}

export async function getStreamsByLevel(level: EducationalLevel) {
  try {
    const streams = await prisma.educationalStream.findMany({
      where: { level },
      include: {
        _count: {
          select: { modules: true },
        },
      },
      orderBy: { name: "asc" },
    })
    return { success: true, data: streams }
  } catch (error: any) {
    console.error("Error fetching streams:", error)
    return { success: false, error: error.message }
  }
}

export async function getStreamById(id: string) {
  try {
    const stream = await prisma.educationalStream.findUnique({
      where: { id },
    })
    return { success: true, data: stream }
  } catch (error: any) {
    console.error("Error fetching stream:", error)
    return { success: false, error: error.message }
  }
}

export async function renameStream(id: string, newName: string) {
  try {
    // Generate a new slug from the name
    const slug = newName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

    const stream = await prisma.educationalStream.update({
      where: { id },
      data: {
        name: newName,
        slug,
      },
    })

    revalidatePath("/admin/lessons")
    revalidatePath("/admin/exercises")
    return { success: true, data: stream }
  } catch (error: any) {
    console.error("Error renaming stream:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteStream(id: string) {
  try {
    await prisma.educationalStream.delete({
      where: { id },
    })
    revalidatePath("/admin/lessons")
    revalidatePath("/admin/exercises")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting stream:", error)
    return { success: false, error: error.message }
  }
}
