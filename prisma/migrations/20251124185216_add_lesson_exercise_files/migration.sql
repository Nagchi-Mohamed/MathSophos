/*
  Warnings:

  - You are about to drop the column `difficulty` on the `Exercise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "difficulty",
ADD COLUMN     "correctionFileUrl" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "fileUrl" TEXT;
