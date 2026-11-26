-- docs/SUPER_ADMIN_EVERYWHERE_SPEC.md: anyone given the Super Admin role in any institution is a platform Super Admin,
-- so they have every privilege in every institution (users.globalRole). Idempotent; never removes a role.
UPDATE "users" SET "globalRole" = 'super_admin'
WHERE ("globalRole" IS NULL OR "globalRole" <> 'super_admin')
  AND "id" IN (
    SELECT m."userId" FROM "memberships" m JOIN "roles" r ON r."id" = m."roleId"
    WHERE r."code" = 'super_admin' AND m."status" = 'active');
