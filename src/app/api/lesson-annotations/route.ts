import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

let tableEnsured = false

async function ensureTable() {
  if (tableEnsured) return
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LessonAnnotation" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "lessonId" TEXT NOT NULL,
        "blockId" TEXT NOT NULL,
        "imageUrl" TEXT NOT NULL,
        "imageId" TEXT,
        float TEXT NOT NULL DEFAULT 'left',
        "widthPct" INTEGER NOT NULL DEFAULT 40,
        filter TEXT NOT NULL DEFAULT 'none',
        opacity DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        caption TEXT,
        position TEXT NOT NULL DEFAULT 'before',
        "createdById" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_lesson_annotation_lesson ON "LessonAnnotation" ("lessonId");
    `)
    tableEnsured = true
  } catch (e) {
    console.warn("[lesson-annotations] Table ensure check:", e)
  }
}

// GET /api/lesson-annotations?lessonId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lessonId = searchParams.get("lessonId")
  if (!lessonId) return NextResponse.json([], { status: 200 })

  await ensureTable()

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "LessonAnnotation" WHERE "lessonId" = $1 ORDER BY "createdAt" ASC`,
      lessonId
    ) as any[]
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json([], { status: 200 })
  }
}

// POST /api/lesson-annotations
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureTable()

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

  await ensureTable()

  const body = await req.json()
  const { id, float: floatDir, widthPct, filter, opacity, caption, blockId, position } = body
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
    if (blockId !== undefined)   { updates.push(`"blockId"=$${idx++}`);  values.push(blockId) }
    if (position !== undefined)  { updates.push(`position=$${idx++}`);   values.push(position) }
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

  await ensureTable()

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
