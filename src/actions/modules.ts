"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type CreateModuleParams = {
  name: string
  educationalStreamId: string
  description?: string
  order?: number
}

export async function createModule(params: CreateModuleParams) {
  try {
    // Check if module model exists in Prisma client
    if (!prisma.module) {
      return { success: false, error: "Module model not available. Please restart the dev server after running: npx prisma generate" }
    }

    // Generate a slug from the name
    const slug = params.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

    // Get the next order number if not provided
    let order = params.order
    if (!order) {
      const lastModule = await prisma.module.findFirst({
        where: { educationalStreamId: params.educationalStreamId },
        orderBy: { order: "desc" },
      })
      order = lastModule ? lastModule.order + 1 : 1
    }

    const module = await prisma.module.create({
      data: {
        name: params.name,
        slug: `${slug}-${Date.now()}`,
        educationalStreamId: params.educationalStreamId,
        description: params.description,
        order,
      },
    })

    revalidatePath("/admin/lessons")
    return { success: true, data: module }
  } catch (error: any) {
    console.error("Error creating module:", error)
    return { success: false, error: error.message }
  }
}

export async function getModulesByStream(educationalStreamId: string) {
  try {
    // Check if module model exists in Prisma client
    if (!prisma.module) {
      console.warn("Module model not available in Prisma client. Please restart the dev server after running: npx prisma generate")
      return { success: true, data: [] } // Return empty array instead of error
    }

    const modules = await prisma.module.findMany({
      where: { educationalStreamId },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    })
    return { success: true, data: modules }
  } catch (error: any) {
    // If it's a model not found error, return empty array
    if (error?.message?.includes("module") || error?.message?.includes("Module")) {
      console.warn("Module model not found. Please restart the dev server after running: npx prisma generate")
      return { success: true, data: [] }
    }
    console.error("Error fetching modules:", error)
    return { success: false, error: error.message || "Failed to fetch modules" }
  }
}

export async function getModuleById(id: string) {
  try {
    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        educationalStream: true,
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    })
    return { success: true, data: module }
  } catch (error: any) {
    console.error("Error fetching module:", error)
    return { success: false, error: error.message }
  }
}

export async function renameModule(id: string, newName: string) {
  try {
    // Generate a new slug from the name
    const slug = newName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

    const module = await prisma.module.update({
      where: { id },
      data: {
        name: newName,
        slug: `${slug}-${Date.now()}`,
      },
    })

    revalidatePath("/admin/lessons")
    return { success: true, data: module }
  } catch (error: any) {
    console.error("Error renaming module:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteModule(id: string) {
  try {
    await prisma.module.delete({
      where: { id },
    })
    revalidatePath("/admin/lessons")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting module:", error)
    return { success: false, error: error.message }
  }
}
