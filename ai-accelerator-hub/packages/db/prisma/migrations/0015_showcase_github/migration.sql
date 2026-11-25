-- docs/SHOWCASE_GITHUB_SPEC.md: project definition, GitHub repos created by the app, connected accounts, contributors.
ALTER TABLE "projects" ADD COLUMN "problem" TEXT;
ALTER TABLE "projects" ADD COLUMN "solution" TEXT;
ALTER TABLE "projects" ADD COLUMN "tech" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "projects" ADD COLUMN "links" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "projects" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'reviewed';
ALTER TABLE "project_repos" ADD COLUMN "fullName" TEXT;
ALTER TABLE "project_repos" ADD COLUMN "createdByApp" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "github_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "tokenEnc" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT '',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "github_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "github_accounts_userId_key" ON "github_accounts"("userId");
ALTER TABLE "github_accounts" ADD CONSTRAINT "github_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "project_contributors" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'push',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_contributors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "project_contributors_projectId_userId_key" ON "project_contributors"("projectId", "userId");
ALTER TABLE "project_contributors" ADD CONSTRAINT "project_contributors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_contributors" ADD CONSTRAINT "project_contributors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
