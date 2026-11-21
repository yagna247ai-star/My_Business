-- Learner "Was this useful?" on day lessons and activities
CREATE TABLE "content_feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "useful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "content_feedback_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "content_feedback_levelId_target_userId_key" ON "content_feedback"("levelId", "target", "userId");
CREATE INDEX "content_feedback_tenantId_levelId_idx" ON "content_feedback"("tenantId", "levelId");
