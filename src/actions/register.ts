"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(["STUDENT", "TEACHER"]).default("STUDENT"),
})

export async function registerUser(formData: FormData) {
  const validatedFields = RegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
  })

  if (!validatedFields.success) {
    return { error: "Invalid fields" }
  }

  const { email, password, name, role } = validatedFields.data

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "Cet email est déjà utilisé." }
    }

    // Check if this is the default admin account
    const isDefaultAdmin = email === "mohamed.nagchi@gmail.com" && password === "NAGCHI@ADMIN"

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role: isDefaultAdmin ? "ADMIN" : role,
      },
    })

    return { success: "Compte créé avec succès !" }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Une erreur est survenue lors de l'inscription." }
  }
}
