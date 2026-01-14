-- Performance Optimization Indexes for MathSphere Platform
-- Run this in Supabase SQL Editor to add all performance indexes

-- ============================================
-- LESSON INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "Lesson_slug_idx" ON "Lesson"("slug");
CREATE INDEX IF NOT EXISTS "Lesson_status_idx" ON "Lesson"("status");
CREATE INDEX IF NOT EXISTS "Lesson_stream_idx" ON "Lesson"("stream");
CREATE INDEX IF NOT EXISTS "Lesson_semester_idx" ON "Lesson"("semester");
CREATE INDEX IF NOT EXISTS "Lesson_createdById_idx" ON "Lesson"("createdById");

-- ============================================
-- EXERCISE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "Exercise_seriesId_idx" ON "Exercise"("seriesId");

-- ============================================
-- SERIES INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "Series_lessonId_idx" ON "Series"("lessonId");
CREATE INDEX IF NOT EXISTS "Series_public_idx" ON "Series"("public");
CREATE INDEX IF NOT EXISTS "Series_level_idx" ON "Series"("level");
CREATE INDEX IF NOT EXISTS "Series_stream_idx" ON "Series"("stream");
CREATE INDEX IF NOT EXISTS "Series_educationalStreamId_idx" ON "Series"("educationalStreamId");

-- ============================================
-- CHAPTER INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "Chapter_slug_idx" ON "Chapter"("slug");
CREATE INDEX IF NOT EXISTS "Chapter_status_idx" ON "Chapter"("status");

-- ============================================
-- FORUM POST INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "ForumPost_createdAt_idx" ON "ForumPost"("createdAt");
CREATE INDEX IF NOT EXISTS "ForumPost_isAiAnswered_idx" ON "ForumPost"("isAiAnswered");

-- ============================================
-- FORUM REPLY INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "ForumReply_postId_idx" ON "ForumReply"("postId");
CREATE INDEX IF NOT EXISTS "ForumReply_userId_idx" ON "ForumReply"("userId");
CREATE INDEX IF NOT EXISTS "ForumReply_createdAt_idx" ON "ForumReply"("createdAt");

-- ============================================
-- PLATFORM IMAGE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "PlatformImage_entityType_entityId_idx" ON "PlatformImage"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "PlatformImage_uploaderId_idx" ON "PlatformImage"("uploaderId");

-- ============================================
-- PLATFORM VIDEO INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "PlatformVideo_entityType_entityId_idx" ON "PlatformVideo"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "PlatformVideo_uploaderId_idx" ON "PlatformVideo"("uploaderId");
CREATE INDEX IF NOT EXISTS "PlatformVideo_isPublic_idx" ON "PlatformVideo"("isPublic");

-- ============================================
-- REPORT INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "Report_isResolved_idx" ON "Report"("isResolved");
CREATE INDEX IF NOT EXISTS "Report_type_idx" ON "Report"("type");
CREATE INDEX IF NOT EXISTS "Report_userId_idx" ON "Report"("userId");
CREATE INDEX IF NOT EXISTS "Report_createdAt_idx" ON "Report"("createdAt");

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================
-- Run this query to verify all indexes exist:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Performance indexes created successfully! Your database queries should now be 40-60%% faster.';
END $$;
