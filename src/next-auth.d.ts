import { UserRole } from "@/lib/enums"
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
  }
}
