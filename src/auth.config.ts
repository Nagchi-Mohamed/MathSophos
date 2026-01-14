
import type { NextAuthConfig } from "next-auth"

export default {
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [], // Providers are defined in auth.ts to avoid Edge Runtime issues
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as any
      }
      return session
    },
  },
} satisfies NextAuthConfig

