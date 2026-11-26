-- docs/DAY_MATERIALS_SPEC.md v1.1: day materials are course-wide. Each institution has its own copy of a course,
-- so a material added on one copy was invisible to learners in the others. Link copies with groupId and copy
-- every existing material to the same day (journey slug + level code + day) of every other institution's copy.
ALTER TABLE "day_materials" ADD COLUMN "groupId" TEXT;
CREATE INDEX "day_materials_groupId_idx" ON "day_materials"("groupId");
UPDATE "day_materials" SET "groupId" = "id" WHERE "groupId" IS NULL;

INSERT INTO "day_materials" ("id", "tenantId", "contentId", "title", "url", "kind", "note", "sortOrder", "linkStatus", "linkCheckedAt", "createdById", "groupId", "createdAt", "updatedAt")
SELECT 'dm' || substr(md5(m."id" || c2."id"), 1, 23), l2."tenantId", c2."id", m."title", m."url", m."kind", m."note", m."sortOrder", m."linkStatus", m."linkCheckedAt", m."createdById", m."groupId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "day_materials" m
JOIN "contents" c ON c."id" = m."contentId"
JOIN "levels" l ON l."id" = c."levelId"
JOIN "journeys" j ON j."id" = l."journeyId"
JOIN "journeys" j2 ON j2."slug" = j."slug" AND j2."id" <> j."id"
JOIN "levels" l2 ON l2."journeyId" = j2."id" AND l2."code" = l."code"
JOIN "contents" c2 ON c2."levelId" = l2."id" AND c2."position" = c."position" AND c2."kind" = 'md'
WHERE NOT EXISTS (SELECT 1 FROM "day_materials" x WHERE x."contentId" = c2."id" AND x."url" = m."url")
ON CONFLICT ("id") DO NOTHING;
