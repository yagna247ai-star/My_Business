-- docs/INSTITUTION_SHARING_SPEC.md: the same cohort in every institution shares one groupId (additive).
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
CREATE INDEX IF NOT EXISTS "cohorts_groupId_idx" ON "cohorts"("groupId");
