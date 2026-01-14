-- Run this in the Supabase SQL Editor to manually add the missing column
ALTER TABLE "PedagogicalSheet" 
ADD COLUMN IF NOT EXISTS "semester" INTEGER NOT NULL DEFAULT 1;
