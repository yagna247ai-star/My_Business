-- docs/REGISTRATION_HOME_SPEC.md AC-5: learners who register without a code must land in AI Accelerator Hub.
-- When no institution holds the code AIHUB, give it to the platform's own institution (type "platform", or
-- "accelerator" / "aihub" / "aiac" in its name or short name), never to an SLN institution. Runs once; changes nothing
-- if AIHUB is already held.
UPDATE "tenants" SET "code" = 'AIHUB', "type" = 'platform'
WHERE NOT EXISTS (SELECT 1 FROM "tenants" x WHERE x."code" = 'AIHUB')
  AND "id" = (
    SELECT "id" FROM "tenants"
    WHERE "status" = 'active'
      AND ("type" = 'platform' OR lower("name") LIKE '%accelerator%' OR lower("slug") LIKE '%aihub%' OR lower("slug") LIKE '%aiac%' OR lower("name") LIKE '%aihub%')
      AND lower("name") NOT LIKE '%sln%' AND lower("slug") NOT LIKE '%sln%'
    ORDER BY ("type" = 'platform') DESC, "createdAt" ASC
    LIMIT 1);
