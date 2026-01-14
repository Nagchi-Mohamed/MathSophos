-- Add primaire exercise fields to Exercise table
ALTER TABLE "Exercise" 
ADD COLUMN IF NOT EXISTS "exerciseType" TEXT,
ADD COLUMN IF NOT EXISTS "qcmOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "correctAnswer" TEXT;

