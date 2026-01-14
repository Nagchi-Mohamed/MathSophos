import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log("Authorize called with:", credentials?.email)
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          throw new Error("MISSING_CREDENTIALS")
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Check if this is the default admin account
        const isDefaultAdmin = email === "mohamed.nagchi@gmail.com" && password === "NAGCHI@ADMIN"

        try {
          let user = await prisma.user.findUnique({
            where: {
              email: email,
            },
          })

          // If user doesn't exist and this is the default admin, create them
          if (!user && isDefaultAdmin) {
            console.log("Creating default admin user")
            const hashedPassword = await bcrypt.hash(password, 10)
            user = await prisma.user.create({
              data: {
                email: email,
                name: "Mohamed Nagchi",
                passwordHash: hashedPassword,
                role: "ADMIN",
                preferredLang: "fr",
              },
            })
            console.log("Default admin user created")
            return user
          }

          console.log("User found:", user ? user.email : "null")

          if (!user) {
            console.log("User not found")
            throw new Error("USER_NOT_FOUND")
          }

          // If this is the default admin account, ensure they have ADMIN role
          if (isDefaultAdmin && user.role !== "ADMIN") {
            console.log("Updating user to ADMIN role")
            user = await prisma.user.update({
              where: { id: user.id },
              data: { role: "ADMIN" },
            })
          }

          if (!user.passwordHash) {
            console.log("User has no password hash")
            throw new Error("NO_PASSWORD_HASH")
          }

          const passwordsMatch = await bcrypt.compare(
            password,
            user.passwordHash
          )

          console.log("Password match:", passwordsMatch)

          if (!passwordsMatch) {
            console.log("Password mismatch")
            throw new Error("INVALID_PASSWORD")
          }

          return user
        } catch (error) {
          console.error("Authorize error:", error)
          throw error
        }
      },
    }),
  ],
})
