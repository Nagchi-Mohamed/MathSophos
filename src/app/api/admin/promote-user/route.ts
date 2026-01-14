import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN }
    })

    return NextResponse.json({
      success: true,
      message: "User promoted to ADMIN",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    })
  } catch (error: any) {
    console.error("Error promoting user:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
