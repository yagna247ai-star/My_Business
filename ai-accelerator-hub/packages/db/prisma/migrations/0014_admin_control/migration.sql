-- docs/SUPER_ADMIN_CONTROL_SPEC.md: forced password change, and per-person permissions on top of the role.
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "memberships" ADD COLUMN "grants" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "memberships" ADD COLUMN "revokes" TEXT NOT NULL DEFAULT '[]';
