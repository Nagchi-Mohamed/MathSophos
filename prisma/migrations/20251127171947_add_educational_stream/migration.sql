-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "educationalStreamId" TEXT;

-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "educationalStreamId" TEXT;

-- CreateTable (only if it doesn't exist - may have been created in previous migration)
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

-- CreateIndex (only if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "EducationalStream_level_slug_key" ON "EducationalStream"("level", "slug");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_educationalStreamId_fkey" FOREIGN KEY ("educationalStreamId") REFERENCES "EducationalStream"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_educationalStreamId_fkey" FOREIGN KEY ("educationalStreamId") REFERENCES "EducationalStream"("id") ON DELETE SET NULL ON UPDATE CASCADE;
