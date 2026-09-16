-- Run this script in your Supabase SQL Editor to create the LessonAnnotation table.
-- Go to: https://supabase.com/dashboard → your project → SQL Editor → New Query → paste this → Run

CREATE TABLE IF NOT EXISTS "LessonAnnotation" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "lessonId"   TEXT NOT NULL,
  "blockId"    TEXT NOT NULL,
  "imageUrl"   TEXT NOT NULL,
  "imageId"    TEXT,
  float        TEXT NOT NULL DEFAULT 'left',
  "widthPct"   INTEGER NOT NULL DEFAULT 40,
  filter       TEXT NOT NULL DEFAULT 'none',
  opacity      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  caption      TEXT,
  position     TEXT NOT NULL DEFAULT 'before',
  "createdById" TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by lesson
CREATE INDEX IF NOT EXISTS idx_lesson_annotation_lesson
  ON "LessonAnnotation" ("lessonId");

-- Optional: Enable Row Level Security (recommended for Supabase)
ALTER TABLE "LessonAnnotation" ENABLE ROW LEVEL SECURITY;

-- Allow all operations from the service role (used by Next.js API)
CREATE POLICY "service_role_all" ON "LessonAnnotation"
  FOR ALL USING (true) WITH CHECK (true);

-- Done!
SELECT 'LessonAnnotation table created successfully' AS status;
