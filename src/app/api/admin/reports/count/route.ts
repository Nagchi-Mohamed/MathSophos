import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.role || !canAccessAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use a direct count query instead of fetching all reports for better performance
    const pendingCount = await prisma.report.count({
      where: {
        isResolved: false,
      },
    })

    return NextResponse.json({ pendingCount })
  } catch (error: any) {
    console.error("Error fetching reports count:", error)
    // Log more details for debugging
    if (error?.message) {
      console.error("Error message:", error.message)
    }
    if (error?.code) {
      console.error("Error code:", error.code)
    }
    if (error?.meta) {
      console.error("Error meta:", error.meta)
    }
    
    // Return 0 count on error to prevent UI issues
    // The error is already logged for debugging
    return NextResponse.json({ pendingCount: 0 })
  }
}

