-- Database Indexes for Series Table Performance Optimization
-- Run this migration to improve query performance and prevent timeouts

-- Add index for common filter combinations
CREATE INDEX IF NOT EXISTS "idx_series_filters" ON "Series" ("cycle", "level", "stream", "semester");

-- Add index for educational stream filtering
CREATE INDEX IF NOT EXISTS "idx_series_educational_stream" ON "Series" ("educationalStreamId") WHERE "educationalStreamId" IS NOT NULL;

-- Add index for lesson filtering
CREATE INDEX IF NOT EXISTS "idx_series_lesson" ON "Series" ("lessonId") WHERE "lessonId" IS NOT NULL;

-- Add index for module filtering (for SUPERIEUR cycle)
CREATE INDEX IF NOT EXISTS "idx_series_module" ON "Series" ("moduleId") WHERE "moduleId" IS NOT NULL;

-- Add index for sorting by creation date
CREATE INDEX IF NOT EXISTS "idx_series_created_at" ON "Series" ("createdAt" DESC);

-- Composite index for common query pattern (cycle + level + stream)
CREATE INDEX IF NOT EXISTS "idx_series_cycle_level_stream" ON "Series" ("cycle", "level", "stream") WHERE "stream" IS NOT NULL;

-- Analyze table to update statistics
ANALYZE "Series";
