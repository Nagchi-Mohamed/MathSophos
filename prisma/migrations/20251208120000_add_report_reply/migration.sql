-- CreateTable
CREATE TABLE IF NOT EXISTS "ReportReply" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "repliedById" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReportReply_reportId_idx" ON "ReportReply"("reportId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReportReply_repliedById_idx" ON "ReportReply"("repliedById");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ReportReply_reportId_fkey'
    ) THEN
        ALTER TABLE "ReportReply" 
        ADD CONSTRAINT "ReportReply_reportId_fkey" 
        FOREIGN KEY ("reportId") 
        REFERENCES "Report"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ReportReply_repliedById_fkey'
    ) THEN
        ALTER TABLE "ReportReply" 
        ADD CONSTRAINT "ReportReply_repliedById_fkey" 
        FOREIGN KEY ("repliedById") 
        REFERENCES "User"("id") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
    END IF;
END $$;
