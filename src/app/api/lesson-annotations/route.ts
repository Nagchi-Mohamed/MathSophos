import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

// GET /api/lesson-annotations?lessonId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lessonId = searchParams.get("lessonId")
  if (!lessonId) return NextResponse.json([], { status: 200 })

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "LessonAnnotation" WHERE "lessonId" = $1 ORDER BY "createdAt" ASC`,
      lessonId
    ) as any[]
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

// POST /api/lesson-annotations
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { lessonId, blockId, imageUrl, imageId, position, float: floatDir, widthPct } = body

  if (!lessonId || !blockId || !imageUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const id = crypto.randomUUID()
    await prisma.$executeRawUnsafe(
      `INSERT INTO "LessonAnnotation"
        (id, "lessonId", "blockId", "imageUrl", "imageId", float, "widthPct", filter, opacity, caption, position, "createdById", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),now())`,
      id,
      lessonId,
      blockId,
      imageUrl,
      imageId ?? null,
      floatDir ?? "left",
      widthPct ?? 40,
      "none",
      1.0,
      null,
      position ?? "before",
      session.user.id ?? null
    )

    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "LessonAnnotation" WHERE id = $1`, id
    ) as any[]
    return NextResponse.json(rows[0] ?? { id })
  } catch (err: any) {
    console.error("[lesson-annotations POST]", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/lesson-annotations
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { id, float: floatDir, widthPct, filter, opacity, caption } = body
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (floatDir !== undefined)  { updates.push(`float=$${idx++}`);     values.push(floatDir) }
    if (widthPct !== undefined)  { updates.push(`"widthPct"=$${idx++}`); values.push(widthPct) }
    if (filter !== undefined)    { updates.push(`filter=$${idx++}`);     values.push(filter) }
    if (opacity !== undefined)   { updates.push(`opacity=$${idx++}`);    values.push(opacity) }
    if (caption !== undefined)   { updates.push(`caption=$${idx++}`);    values.push(caption) }
    updates.push(`"updatedAt"=now()`)

    if (updates.length === 1) return NextResponse.json({ ok: true })

    await prisma.$executeRawUnsafe(
      `UPDATE "LessonAnnotation" SET ${updates.join(",")} WHERE id=$${idx}`,
      ...values, id
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[lesson-annotations PATCH]", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/lesson-annotations?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "LessonAnnotation" WHERE id=$1`, id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[lesson-annotations DELETE]", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
