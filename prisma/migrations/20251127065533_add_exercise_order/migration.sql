-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seriesId" TEXT;

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cycle" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "stream" TEXT,
    "semester" INTEGER NOT NULL,
    "lessonId" TEXT,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_seriesId_idx" ON "Exercise"("seriesId");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
