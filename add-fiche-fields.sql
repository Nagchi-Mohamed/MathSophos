-- Add new columns to PedagogicalSheet table
ALTER TABLE "PedagogicalSheet" 
ADD COLUMN IF NOT EXISTS "stream" TEXT,
ADD COLUMN IF NOT EXISTS "lessonTitle" TEXT;
