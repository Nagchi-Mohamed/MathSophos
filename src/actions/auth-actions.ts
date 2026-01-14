"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmation requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export async function changePassword(formData: FormData) {
  const session = await auth()

  if (!session?.user?.email) {
    return { error: "Non autorisé" }
  }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  const validation = ChangePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || !user.passwordHash) {
      return { error: "Utilisateur non trouvé" }
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isPasswordValid) {
      return { error: "Mot de passe actuel incorrect" }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email: session.user.email },
      data: { passwordHash: newPasswordHash },
    })

    revalidatePath("/")
    return { success: "Mot de passe modifié avec succès" }
  } catch (error) {
    console.error("Change password error:", error)
    return { error: "Une erreur est survenue" }
  }
}

import { resend } from "@/lib/mail"

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Return success even if user not found to prevent enumeration
      // But based on user request "valid code... sent only to email already registered", we might hint differently or just proceed.
      // To follow user request precisely: "valide code access as admin can be send only to an email already registred as admin"
      // If I return generic success, it satisfies this (safety).
      return { success: "Si un compte existe avec cet email, un code a été envoyé." }
    }

    if (user.role === "EDITOR") {
      return { error: "Veuillez contacter un administrateur pour réinitialiser votre mot de passe." }
    }

    // Generate code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash the code and set it as the new password (Temporary Access)
    const hashedPassword = await bcrypt.hash(resetCode, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword }
    })

    // Log code prominently for development
    console.log("*****************************************************")
    console.log(`[PASSWORD RESET] NEW TEMP PASSWORD FOR ${email}: ${resetCode}`)
    console.log("*****************************************************")

    // Send email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: 'MathSophos <onboarding@resend.dev>', // Use default testing sender
        to: email, // This only works if 'email' is the registered testing email on Resend free tier
        subject: 'Votre nouveau mot de passe temporaire MathSophos',
        html: `
          <h1>Mot de passe temporaire</h1>
          <p>Vous avez demandé un accès à votre compte.</p>
          <p>Voici votre nouveau mot de passe temporaire :</p>
          <h2>${resetCode}</h2>
          <p>Utilisez ce code comme mot de passe pour vous connecter via l'écran de connexion.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, veuillez contacter le support immédiatement.</p>
        `,
      });

      if (error) {
        console.error("Resend API Error:", error)
        // We calculate success even if email fails in dev, but log it.
      } else {
        console.log("Email sent successfully via Resend:", data)
      }
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
    }

    return { success: "Si un compte existe, un code a été envoyé. (Vérifiez la console serveur en développement)" }

  } catch (error) {
    console.error("Request password reset error:", error)
    return { error: "Une erreur est survenue" }
  }
}
