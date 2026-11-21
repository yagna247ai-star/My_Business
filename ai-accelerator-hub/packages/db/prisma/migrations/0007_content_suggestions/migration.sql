-- Content review: suggestions on levels, day lessons and activities
CREATE TABLE "content_suggestions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'open',
    "authorId" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "content_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "content_suggestions_tenantId_journeyId_state_idx" ON "content_suggestions"("tenantId", "journeyId", "state");
CREATE INDEX "content_suggestions_levelId_idx" ON "content_suggestions"("levelId");
