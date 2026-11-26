-- docs/INSTITUTIONS_SPEC.md: institution code, type and logo; membership history (alumni, moved to).
ALTER TABLE "tenants" ADD COLUMN "code" TEXT;
ALTER TABLE "tenants" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "tenants" ADD COLUMN "logoUrl" TEXT;
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");
ALTER TABLE "memberships" ADD COLUMN "leftAt" TIMESTAMP(3);
ALTER TABLE "memberships" ADD COLUMN "movedToTenantId" TEXT;

-- Codes for existing institutions: the platform's own institution is AIHUB, SLNHRD keeps its name,
-- every other one gets its slug in capitals (letters and digits, at most 12), made unique with its row number.
UPDATE "tenants" SET "code" = 'AIHUB', "type" = 'platform' WHERE "code" IS NULL AND "id" = (
  SELECT "id" FROM "tenants" WHERE lower("name") LIKE '%accelerator%' OR lower("slug") LIKE '%aihub%' ORDER BY "createdAt" ASC LIMIT 1);
UPDATE "tenants" SET "code" = 'SLNHRD', "type" = 'skill_centre' WHERE "code" IS NULL AND "id" = (
  SELECT "id" FROM "tenants" WHERE (lower("name") LIKE '%slnhrd%' OR lower("slug") LIKE '%slnhrd%' OR lower("slug") LIKE '%sln%') AND "code" IS NULL ORDER BY "createdAt" ASC LIMIT 1);
UPDATE "tenants" t SET "code" = sub.c FROM (
  SELECT "id", left(upper(regexp_replace("slug", '[^A-Za-z0-9]', '', 'g')), 9) || CASE WHEN row_number() OVER (PARTITION BY left(upper(regexp_replace("slug", '[^A-Za-z0-9]', '', 'g')), 9) ORDER BY "createdAt") > 1 THEN row_number() OVER (PARTITION BY left(upper(regexp_replace("slug", '[^A-Za-z0-9]', '', 'g')), 9) ORDER BY "createdAt")::text ELSE '' END AS c
  FROM "tenants" WHERE "code" IS NULL) sub
WHERE t."id" = sub."id" AND NOT EXISTS (SELECT 1 FROM "tenants" x WHERE x."code" = sub.c);
