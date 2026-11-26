-- docs/FEED_ENGAGEMENT_SPEC.md: course scoping, day tags, staff pins, accepted answers and edits. Additive only.
ALTER TABLE "posts" ADD COLUMN "journeyId" TEXT;
ALTER TABLE "posts" ADD COLUMN "day" INTEGER;
ALTER TABLE "posts" ADD COLUMN "pinnedAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN "pinnedById" TEXT;
ALTER TABLE "posts" ADD COLUMN "acceptedCommentId" TEXT;
ALTER TABLE "posts" ADD COLUMN "answeredAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "comments" ADD COLUMN "editedAt" TIMESTAMP(3);

CREATE INDEX "posts_tenantId_journeyId_state_createdAt_idx" ON "posts"("tenantId", "journeyId", "state", "createdAt");
