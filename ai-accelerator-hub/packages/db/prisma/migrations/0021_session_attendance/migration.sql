-- docs/COHORT_WEEK_SPEC.md: attendance per learner, class date and block. Additive: a new table only.
CREATE TABLE "session_attendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "markedById" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "session_attendance_cohortId_userId_date_block_key" ON "session_attendance"("cohortId", "userId", "date", "block");

CREATE INDEX "session_attendance_tenantId_cohortId_date_idx" ON "session_attendance"("tenantId", "cohortId", "date");
