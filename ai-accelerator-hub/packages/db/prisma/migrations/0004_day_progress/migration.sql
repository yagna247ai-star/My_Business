-- Interactive day pages: each day is done (steps ticked + screenshot) or skipped
CREATE TABLE "day_progress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "steps" TEXT,
    "fileId" TEXT,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "day_progress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "day_progress_enrollmentId_levelId_day_key" ON "day_progress"("enrollmentId", "levelId", "day");
CREATE INDEX "day_progress_tenantId_userId_idx" ON "day_progress"("tenantId", "userId");
ALTER TABLE "day_progress" ADD CONSTRAINT "day_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
