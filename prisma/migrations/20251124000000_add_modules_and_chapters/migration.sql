-- Create enums if they don't exist (needed before using them)
DO $$ BEGIN
    CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'AI_GENERATED', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EducationalLevel" AS ENUM ('PRIMAIRE_1', 'PRIMAIRE_2', 'PRIMAIRE_3', 'PRIMAIRE_4', 'PRIMAIRE_5', 'PRIMAIRE_6', 'COLLEGE_1AC', 'COLLEGE_2AC', 'COLLEGE_3AC', 'LYCEE_TC', 'LYCEE_1BAC', 'LYCEE_2BAC', 'UNIVERSITY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Stream" AS ENUM ('TC_LETTRES', 'TC_SCIENCES', 'TC_TECHNOLOGIE', 'SC_MATH_A', 'SC_MATH_B', 'SC_EXPERIMENTAL', 'SC_PHYSIQUE', 'SC_VIE_TERRE', 'SC_ECONOMIE', 'LETTRES_HUMAINES', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create EducationalStream table if it doesn't exist (needed for Module foreign key)
CREATE TABLE IF NOT EXISTS "EducationalStream" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "level" "EducationalLevel" NOT NULL,
    "semesterCount" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationalStream_pkey" PRIMARY KEY ("id")
);

-- Create unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "EducationalStream_level_slug_key" ON "EducationalStream"("level", "slug");

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "educationalStreamId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT,
    "slug" TEXT NOT NULL,
    "contentFr" TEXT,
    "contentEn" TEXT,
    "chapterNumber" INTEGER NOT NULL DEFAULT 1,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "imagesUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Module_educationalStreamId_name_key" ON "Module"("educationalStreamId", "name");

-- CreateIndex
CREATE INDEX "Module_educationalStreamId_idx" ON "Module"("educationalStreamId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_slug_key" ON "Chapter"("slug");

-- CreateIndex
CREATE INDEX "Chapter_lessonId_idx" ON "Chapter"("lessonId");

-- CreateIndex
CREATE INDEX "Chapter_createdById_idx" ON "Chapter"("createdById");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_educationalStreamId_fkey" FOREIGN KEY ("educationalStreamId") REFERENCES "EducationalStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "moduleId" TEXT;

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
