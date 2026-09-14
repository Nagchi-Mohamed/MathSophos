-- CreateTable: PedagogicalSheet
-- This migration creates the PedagogicalSheet table with all fields.
-- It uses IF NOT EXISTS to be safe in case it was created via db push locally.

CREATE TABLE IF NOT EXISTS "PedagogicalSheet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "gradeLevel" "EducationalLevel" NOT NULL,
    "stream" TEXT,
    "lessonTitle" TEXT,
    "subject" TEXT DEFAULT 'Mathématiques',
    "schoolYear" TEXT DEFAULT '2025 – 2026',
    "textbook" TEXT DEFAULT 'Najah',
    "duration" TEXT NOT NULL,
    "capacities" TEXT,
    "programContents" TEXT,
    "pedagogicalGuidelines" TEXT,
    "prerequisites" TEXT,
    "extensions" TEXT,
    "didacticTools" TEXT,
    "content" JSONB NOT NULL DEFAULT '[]',
    "bilanSequence" TEXT,
    "difficultiesObserved" TEXT,
    "remediationProposed" TEXT,
    "observations" TEXT,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedagogicalSheet_pkey" PRIMARY KEY ("id")
);

-- Add columns to existing table in case it already exists but is missing new columns
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "subject" TEXT DEFAULT 'Mathématiques';
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT DEFAULT '2025 – 2026';
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "textbook" TEXT DEFAULT 'Najah';
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "capacities" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "programContents" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "pedagogicalGuidelines" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "prerequisites" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "extensions" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "didacticTools" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "bilanSequence" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "difficultiesObserved" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "remediationProposed" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "observations" TEXT;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PedagogicalSheet" ADD COLUMN IF NOT EXISTS "semester" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PedagogicalSheet_userId_idx" ON "PedagogicalSheet"("userId");

-- AddForeignKey (only if not exists — use DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'PedagogicalSheet_userId_fkey'
        AND table_name = 'PedagogicalSheet'
    ) THEN
        ALTER TABLE "PedagogicalSheet" ADD CONSTRAINT "PedagogicalSheet_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
