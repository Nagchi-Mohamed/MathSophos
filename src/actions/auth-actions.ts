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
      return { success: "Si un compte existe avec cet email, un code a été envoyé." }
    }

    if (user.role === "EDITOR") {
      return { error: "Veuillez contacter un administrateur pour réinitialiser votre mot de passe." }
    }

    // Generate 6-digit verification / temporary access code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash the code and set it as the new password (Temporary Access)
    const hashedPassword = await bcrypt.hash(resetCode, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword }
    })

    console.log("*****************************************************")
    console.log(`[PASSWORD RESET] NEW TEMP PASSWORD FOR ${email}: ${resetCode}`)
    console.log("*****************************************************")

    let emailSent = false
    // Send email using Resend if configured
    try {
      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_")) {
        const { error } = await resend.emails.send({
          from: 'MathSophos <onboarding@resend.dev>',
          to: email,
          subject: 'Votre nouveau mot de passe temporaire MathSophos',
          html: `
            <h1>Mot de passe temporaire MathSophos</h1>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Voici votre nouveau mot de passe temporaire :</p>
            <h2 style="color: #2563eb; font-size: 24px; letter-spacing: 2px;">${resetCode}</h2>
            <p>Utilisez ce code comme mot de passe pour vous connecter via la page de connexion.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez l'ignorer.</p>
          `,
        });

        if (!error) {
          emailSent = true
        } else {
          console.error("Resend API Error:", error)
        }
      }
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
    }

    if (emailSent) {
      return { success: "Un e-mail contenant votre code d'accès temporaire a été envoyé." }
    } else {
      return { success: `Mot de passe temporaire généré avec succès : ${resetCode} (Utilisez ce code pour vous connecter)` }
    }

  } catch (error) {
    console.error("Request password reset error:", error)
    return { error: "Une erreur est survenue lors de la réinitialisation." }
  }
}
