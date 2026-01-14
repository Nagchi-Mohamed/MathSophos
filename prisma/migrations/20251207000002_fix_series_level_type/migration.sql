-- AlterTable: Convert Series.level from TEXT to EducationalLevel enum
-- Step 1: Ensure all existing level values are valid enum values, set invalid ones to a default
UPDATE "Series" 
SET "level" = 'PRIMAIRE_1' 
WHERE "level" NOT IN (
  'PRIMAIRE_1', 'PRIMAIRE_2', 'PRIMAIRE_3', 'PRIMAIRE_4', 'PRIMAIRE_5', 'PRIMAIRE_6',
  'COLLEGE_1AC', 'COLLEGE_2AC', 'COLLEGE_3AC',
  'LYCEE_TC', 'LYCEE_1BAC', 'LYCEE_2BAC', 'UNIVERSITY'
);

-- Step 2: Alter the column type from TEXT to EducationalLevel enum
ALTER TABLE "Series" 
  ALTER COLUMN "level" TYPE "EducationalLevel" 
  USING "level"::"EducationalLevel";

-- Step 3: Fix the stream column - handle NULL values and convert to enum
-- First set NULL/empty/invalid to 'NONE'
UPDATE "Series" 
SET "stream" = 'NONE' 
WHERE "stream" IS NULL 
   OR "stream" = '' 
   OR "stream" NOT IN (
     'TC_LETTRES', 'TC_SCIENCES', 'TC_TECHNOLOGIE', 'SC_MATH_A', 'SC_MATH_B', 
     'SC_EXPERIMENTAL', 'SC_PHYSIQUE', 'SC_VIE_TERRE', 'SC_ECONOMIE', 
     'LETTRES_HUMAINES', 'NONE'
   );

-- Then convert to enum type
ALTER TABLE "Series" 
  ALTER COLUMN "stream" TYPE "Stream" 
  USING "stream"::"Stream";

-- Step 4: Set default value and NOT NULL constraint
ALTER TABLE "Series" 
  ALTER COLUMN "stream" SET DEFAULT 'NONE';

ALTER TABLE "Series" 
  ALTER COLUMN "stream" SET NOT NULL;
