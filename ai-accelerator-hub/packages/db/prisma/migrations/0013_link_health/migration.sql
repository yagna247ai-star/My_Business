-- docs/SHOWCASE_LINK_HEALTH_SPEC.md: remember whether each showcase link opens for everyone.
ALTER TABLE "project_repos" ADD COLUMN "linkStatus" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "project_repos" ADD COLUMN "linkCheckedAt" TIMESTAMP(3);
