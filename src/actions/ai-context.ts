"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { redirect } from "next/navigation"

const AiContextSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  systemPrompt: z.string().min(10, "Le prompt système doit contenir au moins 10 caractères"),
  structureTemplate: z.string().optional(),
})

export async function createAiContext(formData: FormData) {
  const validatedFields = AiContextSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    systemPrompt: formData.get("systemPrompt"),
    structureTemplate: formData.get("structureTemplate"),
  })

  if (!validatedFields.success) {
    return { error: "Champs invalides" }
  }

  await prisma.aiContext.create({
    data: validatedFields.data,
  })

  revalidatePath("/admin/ai-context")
  redirect("/admin/ai-context")
}

export async function updateAiContext(id: string, formData: FormData) {
  const validatedFields = AiContextSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    systemPrompt: formData.get("systemPrompt"),
    structureTemplate: formData.get("structureTemplate"),
  })

  if (!validatedFields.success) {
    return { error: "Champs invalides" }
  }

  await prisma.aiContext.update({
    where: { id },
    data: validatedFields.data,
  })

  revalidatePath("/admin/ai-context")
  redirect("/admin/ai-context")
}

export async function deleteAiContext(id: string) {
  await prisma.aiContext.delete({
    where: { id },
  })
  revalidatePath("/admin/ai-context")
}

export async function getAiContexts() {
  try {
    const contexts = await prisma.aiContext.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: contexts }
  } catch (error) {
    console.error("Error fetching AI contexts:", error)
    return { success: false, error: "Failed to fetch AI contexts" }
  }
}

