-- AlterTable
ALTER TABLE "Series" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");
