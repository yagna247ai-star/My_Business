-- Journey track changes (Easy / Intermediate / Hard / Critical)
CREATE TABLE "track_changes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromJourneyId" TEXT NOT NULL,
    "toJourneyId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "mode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    CONSTRAINT "track_changes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "track_changes_tenantId_userId_state_idx" ON "track_changes"("tenantId", "userId", "state");
