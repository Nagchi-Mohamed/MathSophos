-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN IF EXISTS "difficulty";

-- AlterTable
ALTER TABLE "Series" DROP COLUMN IF EXISTS "difficulty";

-- DropEnum (only if no other tables use it)
-- Note: We can't drop the enum if it's still referenced, but since we removed all references, this should work
DROP TYPE IF EXISTS "DifficultyLevel";
