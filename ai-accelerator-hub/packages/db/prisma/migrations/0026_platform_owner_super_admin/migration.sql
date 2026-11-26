-- docs/SUPER_ADMIN_EVERYWHERE_SPEC.md AC-5: the platform owner's account is a Super Admin for the whole platform
-- (every institution, every privilege). Requested by the platform owner on 2026-11-26. Does nothing if the account
-- does not exist yet; never removes anything.
UPDATE "users" SET "globalRole" = 'super_admin'
WHERE lower("email") = 'yagna247.ai@gmail.com' AND ("globalRole" IS NULL OR "globalRole" <> 'super_admin');
