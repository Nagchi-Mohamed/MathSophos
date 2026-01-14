import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Public routes that don't need auth check
  if (nextUrl.pathname.startsWith('/api/auth') || nextUrl.pathname === '/login') {
    return
  }

  // Print routes are public (Puppeteer)
  if (nextUrl.pathname.startsWith('/print/')) {
    return
  }

  // Admin Protection
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      // User must log in
      return Response.redirect(new URL('/login', nextUrl))
    }

    const role = req.auth?.user?.role as string

    // ADMIN has full access
    if (role === 'ADMIN') {
      return
    }

    // EDITOR has limited access
    if (role === 'EDITOR') {
      const allowedPaths = [
        '/admin/lessons',
        '/admin/exercises',
        '/admin/exams',
        '/admin/content',
        // Allow dashboard root for now, but sensitive widgets should also check roles in React
        // Using strict check to prevent access to /admin/users etc.
      ]

      // Check if current path starts with any allowed path OR is exactly /admin
      const isAllowed =
        nextUrl.pathname === '/admin' ||
        allowedPaths.some(path => nextUrl.pathname.startsWith(path)) ||
        nextUrl.pathname === '/admin/pdf-playground'

      if (!isAllowed) {
        return Response.redirect(new URL('/unauthorized', nextUrl))
      }
      return
    }

    // Other roles -> Unauthorized
    return Response.redirect(new URL('/unauthorized', nextUrl))
  }

  return
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
